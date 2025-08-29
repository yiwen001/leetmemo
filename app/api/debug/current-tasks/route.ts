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

    // 获取用户的活跃计划
    const activePlan = await prisma.studyPlan.findFirst({
      where: {
        userId: session.user.id,
        status: 'active'
      },
      include: {
        dailyTasks: {
          orderBy: { day: 'asc' }
        }
      }
    })

    if (!activePlan) {
      return NextResponse.json({
        success: true,
        message: '没有活跃的计划',
        data: null
      })
    }

    // 获取今天的任务
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayTasks = await prisma.dailyTask.findMany({
      where: {
        planId: activePlan.id,
        currentDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        plan: activePlan,
        todayTasks,
        userId: session.user.id
      }
    })

  } catch (error) {
    console.error('调试API错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
