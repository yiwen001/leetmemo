import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function DELETE(
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

    // 删除计划（会级联删除相关的 DailyTask）
    await prisma.studyPlan.delete({
      where: { id: planId }
    })

    return NextResponse.json({
      success: true,
      message: '学习计划删除成功'
    })

  } catch (error) {
    console.error('删除计划失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
