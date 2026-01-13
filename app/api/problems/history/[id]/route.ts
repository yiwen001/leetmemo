import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const recordId = params.id

    // 检查记录是否存在且属于当前用户
    const studyRecord = await prisma.studyRecord.findFirst({
      where: {
        id: recordId,
        userId: session.user.id
      }
    })

    if (!studyRecord) {
      return NextResponse.json({ error: '学习记录不存在' }, { status: 404 })
    }

    // 删除学习记录
    await prisma.studyRecord.delete({
      where: {
        id: recordId
      }
    })

    return NextResponse.json({
      success: true,
      message: '学习记录已删除'
    })

  } catch (error) {
    console.error('删除学习记录失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除失败'
    }, { status: 500 })
  }
}
