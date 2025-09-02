import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // 获取用户的活跃学习计划
    const plan = await prisma.studyPlan.findFirst({
      where: {
        userId: session.user.id,
        status: 'active'
      }
    })

    if (!plan) {
      return NextResponse.json({ success: false, error: '没有活跃的学习计划' })
    }

    // 获取所有日常任务和TaskItems的详细信息
    const dailyTasks = await prisma.dailyTask.findMany({
      where: {
        planId: plan.id
      },
      include: {
        taskItems: {
          include: {
            problem: {
              select: {
                title: true,
                titleCn: true,
                number: true
              }
            }
          }
        }
      },
      orderBy: { day: 'asc' }
    })

    // 详细分析每一天的完成情况
    const detailedAnalysis = dailyTasks.map(task => {
      const taskItems = task.taskItems.map(item => ({
        problemId: item.problemId,
        problemTitle: item.problem?.titleCn || item.problem?.title || '未知题目',
        problemNumber: item.problem?.number || 0,
        taskType: item.taskType,
        completed: item.completed,
        completedAt: item.completedAt?.toISOString() || null
      }))

      const totalTasks = taskItems.length
      const completedTasks = taskItems.filter(item => item.completed).length
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        day: task.day,
        date: task.currentDate.toISOString().split('T')[0],
        dailyTaskStatus: task.status,
        dailyTaskCompletedAt: task.completedAt?.toISOString() || null,
        totalTaskItems: totalTasks,
        completedTaskItems: completedTasks,
        completionRate: completionRate,
        taskItems: taskItems
      }
    })

    // 统计总体情况
    const totalDays = dailyTasks.length
    const fullyCompletedDays = detailedAnalysis.filter(day => day.completionRate === 100).length
    const partiallyCompletedDays = detailedAnalysis.filter(day => day.completionRate > 0 && day.completionRate < 100).length
    const notStartedDays = detailedAnalysis.filter(day => day.completionRate === 0).length

    return NextResponse.json({
      success: true,
      planInfo: {
        planId: plan.id,
        startDate: plan.startDate.toISOString().split('T')[0],
        duration: plan.duration,
        status: plan.status
      },
      summary: {
        totalDays,
        fullyCompletedDays,
        partiallyCompletedDays,
        notStartedDays,
        overallCompletionRate: totalDays > 0 ? Math.round((fullyCompletedDays / totalDays) * 100) : 0
      },
      dailyDetails: detailedAnalysis
    })

  } catch (error) {
    console.error('检查任务完成情况失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
