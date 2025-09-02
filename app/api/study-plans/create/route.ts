import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: '未登录' 
      }, { status: 401 })
    }

    // 验证用户是否存在，如果不存在则创建
    let user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      // 创建用户记录
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          name: session.user.name || '未知用户',
          email: session.user.email,
          avatarUrl: session.user.image,
          provider: 'gitee' // 根据你的认证提供商调整
        }
      })
      console.log('Created new user:', user.id)
    }

    const body = await request.json()
    const { name, mode, duration, intensity, startDate, selectedProblems } = body

    // 验证必填字段
    if (!name || !duration || !intensity || !startDate) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必填字段' 
      }, { status: 400 })
    }

    // 检查用户是否已有活跃计划
    const existingPlan = await prisma.studyPlan.findFirst({
      where: {
        userId: session.user.id,
        status: 'active'
      }
    })

    if (existingPlan) {
      return NextResponse.json({ 
        success: false, 
        error: '您已有活跃的学习计划，请先完成或删除现有计划' 
      }, { status: 400 })
    }

    let problemIds: string[] = []

    if (mode === 'default') {
      // 使用默认的题目
      const defaultProblems = await prisma.leetCodeProblem.findMany({
        take: 19 // 默认取19道题目
      })
      problemIds = defaultProblems.map(p => p.id)
    } else if (mode === 'custom' && selectedProblems?.length > 0) {
      // 使用用户选择的题目
      problemIds = selectedProblems
    } else {
      return NextResponse.json({ 
        success: false, 
        error: '请选择题目或使用默认模式' 
      }, { status: 400 })
    }

    if (problemIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '没有可用的题目' 
      }, { status: 400 })
    }

    // 处理开始日期，避免时区问题
    const parsedStartDate = new Date(startDate + 'T00:00:00.000Z')
    console.log('Original startDate:', startDate)
    console.log('Parsed startDate:', parsedStartDate)
    
    // 验证所有题目ID是否存在
    const existingProblems = await prisma.leetCodeProblem.findMany({
      where: {
        id: { in: problemIds }
      },
      select: { id: true }
    })
    
    if (existingProblems.length !== problemIds.length) {
      const existingIds = new Set(existingProblems.map(p => p.id))
      const missingIds = problemIds.filter(id => !existingIds.has(id))
      console.error('Some problem IDs do not exist:', missingIds)
      return NextResponse.json({ 
        success: false, 
        error: `找不到以下题目ID: ${missingIds.join(', ')}` 
      }, { status: 400 })
    }

    // 创建学习计划
    const plan = await prisma.studyPlan.create({
      data: {
        userId: session.user.id,
        startDate: parsedStartDate,
        duration: Number(duration),
        intensity,
        planProblems: problemIds,
        learnedProblems: [],
        status: 'active',
        name
      }
    })

    // 生成每日任务
    await generateDailyTasks(plan.id, problemIds, Number(duration), intensity, parsedStartDate)

    return NextResponse.json({ 
      success: true, 
      data: { planId: plan.id },
      message: '学习计划创建成功'
    })
  } catch (error: any) {
    console.error('创建学习计划失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || '创建学习计划失败' 
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
      try {
        await prisma.taskItem.createMany({
          data: [...newTaskItems, ...reviewTaskItems]
        })
      } catch (error: any) {
        console.error('创建任务项失败:', error)
        throw new Error(`创建第${day}天任务失败: ${error?.message || '未知错误'}`)
      }
    }
  }
}