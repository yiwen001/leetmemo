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
          orderBy: { day: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      plan: activePlan
    })

  } catch (error) {
    console.error('获取活跃计划失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}