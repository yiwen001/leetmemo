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
    const { newDuration, newIntensity } = body

    if (!newDuration || !newIntensity) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必填参数' 
      }, { status: 400 })
    }

    const planId = params.id

    // 查找被销毁的计划
    const destroyedPlan = await prisma.studyPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
        status: 'destroyed'
      }
    })

    if (!destroyedPlan) {
      return NextResponse.json({ 
        success: false, 
        error: '计划不存在或状态不正确' 
      }, { status: 404 })
    }

    // 计算未完成的题目
    const allPlanProblems = destroyedPlan.planProblems
    const learnedProblems = destroyedPlan.learnedProblems
    const remainingProblems = allPlanProblems.filter(id => !learnedProblems.includes(id))

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

    // 更新计划状态和信息
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.studyPlan.update({
      where: { id: planId },
      data: {
        status: 'active',
        startDate: today,
        duration: newDuration,
        intensity: newIntensity,
        planProblems: remainingProblems, // 只包含未完成的题目
        pendingTasks: 0
      }
    })

    // 重新生成每日任务
    await generateDailyTasks(planId, remainingProblems, newDuration, newIntensity, today)

    return NextResponse.json({
      success: true,
      message: '计划恢复成功',
      remainingProblems: remainingProblems.length,
      newDuration,
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

// 生成每日任务的函数（基于你的算法改进）
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
  
  const tasks = []
  const reviewIntervals = [1, 3, 7, 15, 30] // 艾宾浩斯遗忘曲线

  for (let day = 1; day <= duration; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + day - 1)
    currentDate.setHours(0, 0, 0, 0)

    // 计算当天的新题目
    const startIndex = (day - 1) * dailyNewCount
    const endIndex = Math.min(startIndex + dailyNewCount, problems.length)
    const newProblems = problems.slice(startIndex, endIndex)

    // 计算复习题目（基于艾宾浩斯遗忘曲线）
    const reviewProblems: string[] = []
    
    for (const interval of reviewIntervals) {
      const studyDay = day - interval
      if (studyDay > 0) {
        // 计算那一天学习的新题目
        const studyStartIndex = (studyDay - 1) * dailyNewCount
        const studyEndIndex = Math.min(studyStartIndex + dailyNewCount, problems.length)
        const studyDayProblems = problems.slice(studyStartIndex, studyEndIndex)
        reviewProblems.push(...studyDayProblems)
      }
    }

    // 检查当天总任务量是否超限
    const totalTasks = newProblems.length + reviewProblems.length
    if (totalTasks > config.maxDailyTotal) {
      // 优先保留新题目，适当减少复习题目
      const maxReview = config.maxDailyTotal - newProblems.length
      reviewProblems.splice(maxReview)
    }

    tasks.push({
      planId,
      day,
      originalDate: currentDate,
      currentDate: currentDate,
      newProblems,
      reviewProblems,
      status: 'pending'
    })
  }

  // 批量创建任务
  await prisma.dailyTask.createMany({
    data: tasks
  })
}
