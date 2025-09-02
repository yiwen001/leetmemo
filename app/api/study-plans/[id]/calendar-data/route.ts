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

    // 验证计划属于当前用户
    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id
      }
    })

    if (!plan) {
      return NextResponse.json({ 
        success: false, 
        error: '计划不存在或无权限' 
      }, { status: 404 })
    }

    // 获取所有日常任务及其TaskItems
    const dailyTasks = await prisma.dailyTask.findMany({
      where: {
        planId: planId
      },
      include: {
        taskItems: true
      },
      orderBy: { day: 'asc' }
    })

    // 获取所有相关的题目ID
    const allProblemIds: string[] = []
    dailyTasks.forEach(task => {
      const problemIds = task.taskItems.map(item => item.problemId)
      allProblemIds.push(...problemIds)
    })

    // 获取题目详情
    const problemDetails = await prisma.leetCodeProblem.findMany({
      where: {
        id: { in: allProblemIds }
      }
    })

    // 获取用户的学习记录
    const studyRecords = await prisma.studyRecord.findMany({
      where: {
        userId: session.user.id,
        problemId: { in: allProblemIds }
      }
    })

    // 创建题目ID到详情的映射
    const problemMap = new Map()
    problemDetails.forEach(problem => {
      problemMap.set(problem.id, problem)
    })

    // 创建题目ID到学习记录的映射
    const recordMap = new Map()
    studyRecords.forEach(record => {
      recordMap.set(record.problemId, record)
    })

    // 构建日历数据
    const calendarData = dailyTasks.map(task => {
      // 构建新题目列表
      const newProblems = task.taskItems
        .filter(item => item.taskType === 'new')
        .map(item => {
          const problemDetail = problemMap.get(item.problemId)
          const studyRecord = recordMap.get(item.problemId)
          return {
            id: item.problemId,
            title: problemDetail?.titleCn || problemDetail?.title || '未知题目',
            number: problemDetail?.number || 0,
            difficulty: problemDetail?.difficulty || 'unknown',
            url: problemDetail?.url || '',
            completed: studyRecord?.completed || false,
            notes: studyRecord?.notes || ''
          }
        })

      // 构建复习题目列表
      const reviewProblems = task.taskItems
        .filter(item => item.taskType === 'review')
        .map(item => {
          const problemDetail = problemMap.get(item.problemId)
          const studyRecord = recordMap.get(item.problemId)
          return {
            id: item.problemId,
            title: problemDetail?.titleCn || problemDetail?.title || '未知题目',
            number: problemDetail?.number || 0,
            difficulty: problemDetail?.difficulty || 'unknown',
            url: problemDetail?.url || '',
            completed: studyRecord?.completed || false,
            notes: studyRecord?.notes || ''
          }
        })

      // 计算当天的完成情况
      const allProblems = [...newProblems, ...reviewProblems]
      const completedProblems = allProblems.filter(problem => problem.completed)

      // 判断任务状态
      let status = 'pending' // pending, completed, partial, overdue
      if (completedProblems.length === allProblems.length && allProblems.length > 0) {
        status = 'completed'
      } else if (completedProblems.length > 0) {
        status = 'partial'
      } else {
        // 检查是否过期
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (task.currentDate < today) {
          status = 'overdue'
        }
      }

      return {
        day: task.day,
        date: task.currentDate.toISOString().split('T')[0], // 使用currentDate作为显示日期
        currentDate: task.currentDate.toISOString().split('T')[0],
        newProblems,
        reviewProblems,
        newProblemsCount: newProblems.length,
        reviewProblemsCount: reviewProblems.length,
        totalProblems: allProblems.length,
        completedProblems: completedProblems.length,
        status,
        taskStatus: task.status,
        completedAt: task.completedAt?.toISOString() || null
      }
    })

    // 计算整体统计
    const totalDays = dailyTasks.length
    const completedDays = calendarData.filter(day => day.status === 'completed').length
    const partialDays = calendarData.filter(day => day.status === 'partial').length
    const overdueDays = calendarData.filter(day => day.status === 'overdue').length

    return NextResponse.json({
      success: true,
      data: {
        plan: {
          id: plan.id,
          startDate: plan.startDate.toISOString().split('T')[0],
          duration: plan.duration,
          intensity: plan.intensity
        },
        calendar: calendarData,
        statistics: {
          totalDays,
          completedDays,
          partialDays,
          overdueDays,
          completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
        }
      }
    })

  } catch (error) {
    console.error('获取日历数据失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
