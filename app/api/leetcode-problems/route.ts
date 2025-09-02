import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET() {
  try {
    const problems = await prisma.leetCodeProblem.findMany({
      orderBy: [
        { difficulty: 'asc' },
        { number: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      problems,
      count: problems.length
    })

  } catch (error) {
    console.error('获取题库失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { url, title, titleCn, difficulty, category, number, tags } = body

    if (!url) {
      return NextResponse.json({ 
        success: false, 
        error: '题目链接为必填项' 
      }, { status: 400 })
    }

    // 检查URL是否已存在
    const existingProblem = await prisma.leetCodeProblem.findFirst({
      where: { url: url.trim() }
    })

    if (existingProblem) {
      return NextResponse.json({ 
        success: false, 
        error: '该题目链接已存在' 
      }, { status: 400 })
    }

    // 创建新题目
    const newProblem = await prisma.leetCodeProblem.create({
      data: {
        url: url.trim(),
        title: title?.trim() || 'Unknown Title',
        titleCn: titleCn?.trim() || title?.trim() || 'Unknown Title',
        difficulty: difficulty || 'medium',
        category: category || 'Array',
        number: number ? parseInt(number) : 0, // 使用0作为默认值而不是null
        tags: tags || [category || 'Array']
      }
    })

    return NextResponse.json({
      success: true,
      problem: newProblem,
      message: '题目添加成功'
    })

  } catch (error) {
    console.error('添加题目失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
