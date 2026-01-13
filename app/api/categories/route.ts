import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const categories = await prisma.userCategory.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      categories
    })

  } catch (error) {
    console.error('获取分类失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取分类失败'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { name } = await request.json()
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '分类名称不能为空' }, { status: 400 })
    }

    const categoryName = name.trim()

    const existingCategory = await prisma.userCategory.findFirst({
      where: {
        userId: session.user.id,
        name: categoryName
      }
    })

    if (existingCategory) {
      return NextResponse.json({ error: '该分类已存在' }, { status: 400 })
    }

    const category = await prisma.userCategory.create({
      data: {
        userId: session.user.id,
        name: categoryName
      }
    })

    return NextResponse.json({
      success: true,
      category
    })

  } catch (error) {
    console.error('创建分类失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '创建分类失败'
    }, { status: 500 })
  }
}