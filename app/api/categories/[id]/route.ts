import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const categoryId = params.id

    const category = await prisma.userCategory.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id
      }
    })

    if (!category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    await prisma.userCategory.delete({
      where: {
        id: categoryId
      }
    })

    return NextResponse.json({
      success: true,
      message: '分类删除成功'
    })

  } catch (error) {
    console.error('删除分类失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '删除分类失败'
    }, { status: 500 })
  }
}