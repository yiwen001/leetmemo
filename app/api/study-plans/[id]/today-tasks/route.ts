import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const planId = params.id
    
    // 获取今天的日期
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 查找今天应该完成的所有任务
    const todayTasks = await prisma.dailyTask.findMany({
      where: {
        planId: planId,
        currentDate: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { day: 'asc' }
    })

    // 获取所有相关的题目ID
    const allProblemIds: string[] = []
    todayTasks.forEach(task => {
      allProblemIds.push(...task.newProblems, ...task.reviewProblems)
    })

    // 从数据库获取题目详情
    const problemDetails = await prisma.leetCodeProblem.findMany({
      where: {
        id: { in: allProblemIds }
      }
    })

    // 创建题目ID到详情的映射
    const problemMap = new Map()
    problemDetails.forEach(problem => {
      problemMap.set(problem.id, problem)
    })

    // 转换为前端需要的格式
    const tasks = []
    let problemNumber = 1

    for (const task of todayTasks) {
      // 处理新题目
      for (const problemId of task.newProblems) {
        const problemDetail = problemMap.get(problemId)
        if (problemDetail) {
          tasks.push({
            id: `${task.id}-new-${problemId}`,
            number: problemNumber++,
            title: problemDetail.titleCn || problemDetail.title,
            url: problemDetail.url,
            notes: '',
            reviewCount: 0,
            lastReviewDate: today.toISOString(),
            completed: false,
            addedDate: today.toISOString(),
            type: 'new',
            difficulty: problemDetail.difficulty,
            leetcodeNumber: problemDetail.number
          })
        }
      }

      // 处理复习题目
      for (const problemId of task.reviewProblems) {
        const problemDetail = problemMap.get(problemId)
        if (problemDetail) {
          tasks.push({
            id: `${task.id}-review-${problemId}`,
            number: problemNumber++,
            title: `[复习] ${problemDetail.titleCn || problemDetail.title}`,
            url: problemDetail.url,
            notes: '',
            reviewCount: 1,
            lastReviewDate: today.toISOString(),
            completed: false,
            addedDate: today.toISOString(),
            type: 'review',
            difficulty: problemDetail.difficulty,
            leetcodeNumber: problemDetail.number
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      tasks,
      totalTasks: tasks.length
    })

  } catch (error) {
    console.error('获取今日任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}