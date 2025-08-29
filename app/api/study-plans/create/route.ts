import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

// 默认的19道经典题目
const DEFAULT_PROBLEMS = [
  'clqv8x9y10000356c8l2m3n4p', // 这些ID需要从实际数据库中获取
  // 我们先用题目编号来查找
]

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
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

    let planProblems: string[] = []

    if (mode === 'default') {
      // 使用默认的19道题目
      const defaultProblems = await prisma.leetCodeProblem.findMany({
        where: {
          number: {
            in: [1, 15, 26, 53, 121, 2, 21, 206, 141, 142, 3, 5, 20, 125, 242, 94, 104, 226, 102] // 前19道经典题目
          }
        },
        select: { id: true }
      })
      planProblems = defaultProblems.map(p => p.id)
    } else {
      // 使用用户选择的题目
      planProblems = selectedProblems || []
    }

    if (planProblems.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '没有可用的题目' 
      }, { status: 400 })
    }

    // 创建学习计划
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: session.user.id,
        startDate: new Date(startDate),
        duration,
        intensity,
        planProblems,
        learnedProblems: [],
        status: 'active'
      }
    })

    // 生成每日任务
    await generateDailyTasks(studyPlan.id, planProblems, duration, intensity, new Date(startDate))

    return NextResponse.json({
      success: true,
      plan: studyPlan,
      message: '学习计划创建成功'
    })

  } catch (error) {
    console.error('创建学习计划失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}

// 生成每日任务的函数
async function generateDailyTasks(
  planId: string, 
  problems: string[], 
  duration: number, 
  intensity: string, 
  startDate: Date
) {
  const dailyNewCount = Math.ceil(problems.length / duration)
  const tasks = []

  for (let day = 1; day <= duration; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + day - 1)

    // 计算当天的新题目
    const startIndex = (day - 1) * dailyNewCount
    const endIndex = Math.min(startIndex + dailyNewCount, problems.length)
    const newProblems = problems.slice(startIndex, endIndex)

    // 计算复习题目（简化版艾宾浩斯）
    const reviewProblems = []
    
    // 第2天复习第1天的题目
    if (day === 2) {
      const day1Problems = problems.slice(0, dailyNewCount)
      reviewProblems.push(...day1Problems)
    }
    
    // 第4天复习第1天的题目
    if (day === 4) {
      const day1Problems = problems.slice(0, dailyNewCount)
      reviewProblems.push(...day1Problems)
    }
    
    // 第7天复习第1天的题目
    if (day === 7) {
      const day1Problems = problems.slice(0, dailyNewCount)
      reviewProblems.push(...day1Problems)
    }

    // 第15天复习第1天的题目
    if (day === 15) {
      const day1Problems = problems.slice(0, dailyNewCount)
      reviewProblems.push(...day1Problems)
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
