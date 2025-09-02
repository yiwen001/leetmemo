import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { duration, intensity, newDuration, newIntensity, startDate } = body

    // 支持两种参数名称格式
    const finalDuration = duration || newDuration
    const finalIntensity = intensity || newIntensity

    if (!finalDuration || !finalIntensity) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必填参数: duration 和 intensity' 
      }, { status: 400 })
    }

    const planId = params.id

    // 查找计划（不限制状态，因为积压时状态可能还是active）
    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id
      }
    })

    if (!plan) {
      return NextResponse.json({ 
        success: false, 
        error: '计划不存在' 
      }, { status: 404 })
    }

    // 计算未完成的题目
    const allPlanProblems = plan.planProblems
    const learnedProblems = plan.learnedProblems
    const remainingProblems = allPlanProblems.filter((id: string) => !learnedProblems.includes(id))

    if (remainingProblems.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '所有题目已完成，无需恢复计划' 
      }, { status: 400 })
    }

    // 删除旧的日常任务
    await prisma.dailyTask.deleteMany({
      where: { planId: planId }
    })

    // 更新计划状态和信息 - 使用UTC时间
    let today = new Date()
    
    // 如果用户指定了开始日期，使用指定日期
    if (startDate) {
      today = new Date(startDate + 'T00:00:00.000Z')
      console.log('恢复计划使用用户指定日期:', today.toISOString())
    } else {
      // 否则尝试使用模拟时间或真实时间
      try {
        const mockModule = await import('../../../debug/set-mock-date/route')
        today = mockModule.getCurrentDate()
        console.log('恢复计划使用模拟时间:', today.toISOString())
      } catch (e) {
        // 如果模拟模块不存在，使用真实时间
        console.log('恢复计划使用真实时间:', today.toISOString())
      }
    }
    today.setUTCHours(0, 0, 0, 0)

    await prisma.studyPlan.update({
      where: { id: planId },
      data: {
        status: 'active',
        startDate: today,
        duration: finalDuration,
        intensity: finalIntensity,
        planProblems: remainingProblems, // 只包含未完成的题目
        pendingTasks: 0
      }
    })

    // 重新生成每日任务
    await generateDailyTasks(planId, remainingProblems, finalDuration, finalIntensity, today)

    return NextResponse.json({
      success: true,
      message: '计划恢复成功',
      remainingProblems: remainingProblems.length,
      newDuration: finalDuration,
      newStartDate: today.toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('恢复计划失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}

// 生成每日任务的函数（使用新的TaskItem架构）
async function generateDailyTasks(
  planId: string, 
  problems: string[], 
  duration: number, 
  intensity: string, 
  startDate: Date
) {
  const intensityConfig = {
    easy: { maxDailyNew: 2, maxDailyTotal: 6 },
    medium: { maxDailyNew: 3, maxDailyTotal: 8 },
    hard: { maxDailyNew: 4, maxDailyTotal: 12 }
  }

  const config = intensityConfig[intensity as keyof typeof intensityConfig] || intensityConfig.medium
  const dailyNewCount = Math.min(config.maxDailyNew, Math.ceil(problems.length / duration))
  
  const reviewIntervals = [1, 3, 7, 15, 30] // 艾宾浩斯遗忘曲线间隔

  for (let day = 1; day <= duration; day++) {
    // 纯UTC日期计算
    const currentDate = new Date(startDate)
    currentDate.setUTCDate(currentDate.getUTCDate() + day - 1)
    currentDate.setUTCHours(0, 0, 0, 0)

    // 1. 创建DailyTask记录
    const dailyTask = await prisma.dailyTask.create({
      data: {
        planId,
        day,
        originalDate: currentDate,
        currentDate: currentDate,
        status: 'pending'
      }
    })

    // 2. 计算当天的新题目
    const startIndex = (day - 1) * dailyNewCount
    const endIndex = Math.min(startIndex + dailyNewCount, problems.length)
    const newProblems = problems.slice(startIndex, endIndex)

    // 3. 计算复习题目（基于艾宾浩斯遗忘曲线）
    const reviewProblems: string[] = []
    
    for (const interval of reviewIntervals) {
      const studyDay = day - interval
      if (studyDay > 0) {
        // 计算那一天学习的新题目
        const studyStartIndex = (studyDay - 1) * dailyNewCount
        const studyEndIndex = Math.min(studyStartIndex + dailyNewCount, problems.length)
        const studyDayProblems = problems.slice(studyStartIndex, studyEndIndex)
        
        // 避免重复添加同一题目
        studyDayProblems.forEach(problemId => {
          if (!reviewProblems.includes(problemId)) {
            reviewProblems.push(problemId)
          }
        })
      }
    }

    // 4. 检查当天总任务量是否超限
    const totalTasks = newProblems.length + reviewProblems.length
    if (totalTasks > config.maxDailyTotal) {
      // 优先保留新题目，适当减少复习题目
      const maxReview = config.maxDailyTotal - newProblems.length
      reviewProblems.splice(maxReview)
    }

    // 5. 为每个新题目创建TaskItem
    const newTaskItems = newProblems.map(problemId => ({
      dailyTaskId: dailyTask.id,
      problemId,
      taskType: 'new',
      completed: false
    }))

    // 6. 为每个复习题目创建TaskItem
    const reviewTaskItems = reviewProblems.map(problemId => ({
      dailyTaskId: dailyTask.id,
      problemId,
      taskType: 'review',
      completed: false
    }))

    // 7. 批量创建所有TaskItem
    if (newTaskItems.length > 0 || reviewTaskItems.length > 0) {
      await prisma.taskItem.createMany({
        data: [...newTaskItems, ...reviewTaskItems]
      })
    }
  }
}
