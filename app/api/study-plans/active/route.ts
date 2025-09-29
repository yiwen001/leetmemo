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

    // 查找用户的活跃计划
    const activePlan = await prisma.studyPlan.findFirst({
      where: {
        userId: session.user.id,
        status: 'active'
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

    if (!activePlan) {
      return NextResponse.json({
        success: true,
        plan: null
      })
    }

    // 计算基于天数的进度
    const totalDays = activePlan.dailyTasks.length
    let totalDayProgress = 0
    let completedDaysCount = 0
    
    activePlan.dailyTasks.forEach(task => {
      const totalTaskItems = task.taskItems.length
      const completedTaskItems = task.taskItems.filter(item => item.completed).length
      
      if (totalTaskItems > 0) {
        const dayCompletionRate = completedTaskItems / totalTaskItems
        totalDayProgress += dayCompletionRate
        
        // 如果当天完成度达到100%，计为完成的天数
        if (dayCompletionRate === 1) {
          completedDaysCount++
        }
      }
    })
    
    // 总体进度 = 所有天数完成度的平均值
    const dayBasedProgress = totalDays > 0 ? (totalDayProgress / totalDays) * 100 : 0

    return NextResponse.json({
      success: true,
      plan: {
        ...activePlan,
        // 添加基于天数的进度信息
        totalDays,
        completedDays: completedDaysCount,
        dayBasedProgress: Math.round(dayBasedProgress)
      }
    })

  } catch (error) {
    console.error('获取活跃计划失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}