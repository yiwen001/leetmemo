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
    
    // 计算昨天的日期
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 查找昨天应该完成的任务
    const yesterdayTasks = await prisma.dailyTask.findMany({
      where: {
        planId: planId,
        currentDate: {
          gte: yesterday,
          lt: today
        }
      }
    })

    // 查找所有未完成的任务（积压任务）
    const pendingTasks = await prisma.dailyTask.findMany({
      where: {
        planId: planId,
        status: 'pending',
        currentDate: { lt: today }
      }
    })

    // 计算积压的题目总数
    let totalPendingProblems = 0
    pendingTasks.forEach(task => {
      totalPendingProblems += task.newProblems.length + task.reviewProblems.length
    })

    // 检查是否需要销毁计划
    if (totalPendingProblems > 20) {
      // 销毁计划，但保留已学习的题目
      const plan = await prisma.studyPlan.findUnique({
        where: { id: planId }
      })

      if (plan) {
        await prisma.studyPlan.update({
          where: { id: planId },
          data: { status: 'destroyed' }
        })
      }

      return NextResponse.json({
        success: true,
        planDestroyed: true,
        totalPendingProblems
      })
    }

    // 顺延未完成的任务到今天
    if (pendingTasks.length > 0) {
      await prisma.dailyTask.updateMany({
        where: {
          planId: planId,
          status: 'pending',
          currentDate: { lt: today }
        },
        data: {
          currentDate: today
        }
      })
    }

    return NextResponse.json({
      success: true,
      planDestroyed: false,
      totalPendingProblems,
      postponedTasks: pendingTasks.length
    })

  } catch (error) {
    console.error('检查昨日任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}