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
      allProblemIds.push(...task.newProblems, ...task.reviewProblems)
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

    return NextResponse.json({
      success: true,
      data: {
        plan: {
          id: plan.id,
          startDate: plan.startDate.toISOString().split('T')[0],
          duration: plan.duration,
          intensity: plan.intensity,
          status: plan.status,
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString()
        },
        problems: problemDetails.map(problem => ({
          id: problem.id,
          number: problem.number,
          title: problem.titleCn || problem.title,
          difficulty: problem.difficulty,
          category: problem.category,
          url: problem.url,
          learned: plan.learnedProblems.includes(problem.id),
          completed: studyRecords.find(r => r.problemId === problem.id)?.completed || false,
          notes: studyRecords.find(r => r.problemId === problem.id)?.notes || ''
        })),
        statistics: {
          totalDays,
          completedTasks,
          dayProgress,
          totalProblems,
          learnedProblems,
          completedProblems,
          problemProgress,
          averageProblemsPerDay: totalDays > 0 ? Math.round(totalProblems / totalDays * 10) / 10 : 0
        }
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
