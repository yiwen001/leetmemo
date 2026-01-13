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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const categoryId = params.id
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '分类名称不能为空' }, { status: 400 })
    }

    const categoryName = name.trim()

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.userCategory.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    // 检查是否已存在同名分类
    const sameNameCategory = await prisma.userCategory.findFirst({
      where: {
        userId: session.user.id,
        name: categoryName,
        id: { not: categoryId }
      }
    })

    if (sameNameCategory) {
      return NextResponse.json({ error: '该分类名称已存在' }, { status: 400 })
    }

    // 更新分类名称
    const updatedCategory = await prisma.userCategory.update({
      where: {
        id: categoryId
      },
      data: {
        name: categoryName
      }
    })

    return NextResponse.json({
      success: true,
      category: updatedCategory
    })

  } catch (error) {
    console.error('更新分类失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新分类失败'
    }, { status: 500 })
  }
}