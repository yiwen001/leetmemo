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

    // 获取所有日常任务
    const dailyTasks = await prisma.dailyTask.findMany({
      where: {
        planId: plan.id
      },
      include: {
        taskItems: true
      },
      orderBy: { day: 'asc' }
    })

    // 格式化输出
    const taskSummary = dailyTasks.map(task => ({
      day: task.day,
      date: task.currentDate.toISOString().split('T')[0],
      taskItemCount: task.taskItems.length,
      newTasks: task.taskItems.filter(item => item.taskType === 'new').length,
      reviewTasks: task.taskItems.filter(item => item.taskType === 'review').length,
      completedTasks: task.taskItems.filter(item => item.completed).length,
      status: task.status
    }))

    return NextResponse.json({
      success: true,
      planId: plan.id,
      planStartDate: plan.startDate.toISOString().split('T')[0],
      planDuration: plan.duration,
      totalDailyTasks: dailyTasks.length,
      taskSummary
    })

  } catch (error) {
    console.error('检查日常任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
