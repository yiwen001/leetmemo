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
    const { name, duration, intensity, startDate, problemSlugs } = body

    // 验证必填字段
    if (!name || !duration || !intensity || !startDate) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必填字段' 
      }, { status: 400 })
    }

    // 验证题目选择
    if (!problemSlugs || !Array.isArray(problemSlugs) || problemSlugs.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请至少选择一道题目' 
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

    // 根据slug获取题目ID
    const problems = await prisma.leetCodeProblem.findMany({
      where: {
        slug: { in: problemSlugs }
      },
      select: { id: true, slug: true }
    })

    if (problems.length !== problemSlugs.length) {
      const foundSlugs = new Set(problems.map(p => p.slug))
      const missingSlugs = problemSlugs.filter(slug => !foundSlugs.has(slug))
      console.error('Some problem slugs do not exist:', missingSlugs)
      return NextResponse.json({ 
        success: false, 
        error: `找不到以下题目: ${missingSlugs.join(', ')}` 
      }, { status: 400 })
    }

    const problemIds = problems.map(p => p.id)

    // 处理开始日期，避免时区问题
    const parsedStartDate = new Date(startDate + 'T00:00:00.000Z')
    console.log('Original startDate:', startDate)
    console.log('Parsed startDate:', parsedStartDate)
    
    // 题目ID验证已在上面完成，这里不需要重复验证

    // 使用事务确保数据一致性
    const plan = await prisma.$transaction(async (tx) => {
      // 创建学习计划
      const newPlan = await tx.studyPlan.create({
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

      // 生成每日任务（在同一事务中）
      await generateDailyTasksInTransaction(tx, newPlan.id, problemIds, Number(duration), intensity, parsedStartDate)
      
      return newPlan
    })

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

// 生成每日任务的函数（事务版本）
async function generateDailyTasksInTransaction(
  tx: any,
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
    const dailyTask = await tx.dailyTask.create({
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
        await tx.taskItem.createMany({
          data: [...newTaskItems, ...reviewTaskItems]
        })
      } catch (error: any) {
        console.error('创建任务项失败:', error)
        throw new Error(`创建第${day}天任务失败: ${error?.message || '未知错误'}`)
      }
    }
  }
}