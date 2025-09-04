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

    // 获取计划详情
    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id
      },
      include: {
        dailyTasks: {
          include: {
            taskItems: true
          },
          orderBy: { day: 'asc' }
        }
      }
    })

    if (!plan) {
      return NextResponse.json({ 
        success: false, 
        error: '计划不存在或无权限' 
      }, { status: 404 })
    }

    // 获取所有题目ID
    const allProblemIds: string[] = []
    plan.dailyTasks.forEach(task => {
      const problemIds = task.taskItems.map(item => item.problemId)
      allProblemIds.push(...problemIds)
    })

    // 获取题目详情
    const problemDetails = await prisma.leetCodeProblem.findMany({
      where: {
        id: { in: plan.planProblems }
      }
    })

    // 获取学习记录
    const studyRecords = await prisma.studyRecord.findMany({
      where: {
        userId: session.user.id,
        problemId: { in: allProblemIds }
      }
    })

    // 计算统计信息
    const totalDays = plan.dailyTasks.length
    const completedTasks = plan.dailyTasks.filter(task => task.status === 'completed').length
    const totalProblems = plan.planProblems.length
    const learnedProblems = plan.learnedProblems.length
    const completedProblems = studyRecords.filter(record => record.completed).length

    // 计算进度
    const dayProgress = totalDays > 0 ? Math.round((completedTasks / totalDays) * 100) : 0
    const problemProgress = totalProblems > 0 ? Math.round((learnedProblems / totalProblems) * 100) : 0

    // 计算预计完成时间
    const remainingProblems = totalProblems - completedProblems
    const averagePerDay = totalDays > 0 ? totalProblems / totalDays : 1
    const remainingDays = Math.ceil(remainingProblems / averagePerDay)
    const estimatedCompletion = new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000).toLocaleDateString()

    // 构建题目列表
    const problems = problemDetails.map(problem => {
      const studyRecord = studyRecords.find(r => r.problemId === problem.id)
      return {
        id: problem.id,
        number: problem.number,
        title: problem.titleCn || problem.title,
        difficulty: problem.difficulty,
        category: problem.category,
        url: problem.url,
        completed: studyRecord?.completed || false,
        reviewCount: studyRecord?.reviewCount || 0,
        lastReviewDate: studyRecord?.lastReviewDate?.toISOString() || null,
        notes: studyRecord?.notes || ''
      }
    })

    // 构建每日任务数据
    const dailySchedule = plan.dailyTasks.map(task => {
      const taskDate = new Date(plan.startDate)
      taskDate.setDate(taskDate.getDate() + task.day - 1)
      
      const newProblems = task.taskItems
        .filter(item => item.taskType === 'new')
        .map(item => {
          const problem = problemDetails.find(p => p.id === item.problemId)
          const studyRecord = studyRecords.find(r => r.problemId === item.problemId)
          return problem ? {
            id: problem.id,
            number: problem.number,
            title: problem.titleCn || problem.title,
            difficulty: problem.difficulty,
            url: problem.url,
            completed: item.completed,
            notes: studyRecord?.notes || ''
          } : null
        })
        .filter(Boolean)

      const reviewProblems = task.taskItems
        .filter(item => item.taskType === 'review')
        .map(item => {
          const problem = problemDetails.find(p => p.id === item.problemId)
          const studyRecord = studyRecords.find(r => r.problemId === item.problemId)
          return problem ? {
            id: problem.id,
            number: problem.number,
            title: problem.titleCn || problem.title,
            difficulty: problem.difficulty,
            url: problem.url,
            completed: item.completed,
            reviewCount: studyRecord?.reviewCount || 0,
            notes: studyRecord?.notes || ''
          } : null
        })
        .filter(Boolean)

      return {
        day: task.day,
        date: taskDate.toISOString().split('T')[0],
        status: task.status,
        newProblems,
        reviewProblems,
        totalProblems: newProblems.length + reviewProblems.length,
        completedProblems: task.taskItems.filter(item => item.completed).length
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        plan: {
          id: plan.id,
          name: plan.name || '学习计划',
          startDate: plan.startDate.toISOString().split('T')[0],
          duration: plan.duration,
          intensity: plan.intensity,
          status: plan.status,
          createdAt: plan.createdAt.toISOString()
        },
        totalProblems,
        completedProblems,
        remainingProblems: totalProblems - completedProblems,
        progress: totalProblems > 0 ? (completedProblems / totalProblems) * 100 : 0,
        dailyTarget: Math.ceil(totalProblems / plan.duration),
        estimatedCompletion,
        problems,
        dailySchedule
      }
    })

  } catch (error) {
    console.error('获取计划详情失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
