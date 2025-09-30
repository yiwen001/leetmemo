import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStudyStatus = searchParams.get('includeStudyStatus') === 'true'
    
    const session = await getServerSession(authOptions)
    
    let problems
    
    if (includeStudyStatus && session?.user?.id) {
      // 获取题目和用户的学习状态
      problems = await prisma.leetCodeProblem.findMany({
        orderBy: [
          { difficulty: 'asc' },
          { number: 'asc' }
        ],
        include: {
          studyRecords: {
            where: {
              userId: session.user.id
            },
            select: {
              completed: true,
              reviewCount: true,
              lastReviewDate: true
            }
          }
        }
      })
      
      // 转换数据格式，添加学习状态
      problems = problems.map(problem => ({
        ...problem,
        studyStatus: problem.studyRecords.length > 0 ? {
          hasStudied: true,
          reviewCount: problem.studyRecords[0].reviewCount,
          lastReviewDate: problem.studyRecords[0].lastReviewDate,
          completed: problem.studyRecords[0].completed
        } : {
          hasStudied: false,
          reviewCount: 0,
          completed: false
        },
        studyRecords: undefined // 移除原始数据
      }))
    } else {
      // 只获取题目基本信息
      problems = await prisma.leetCodeProblem.findMany({
        orderBy: [
          { difficulty: 'asc' },
          { number: 'asc' }
        ]
      })
    }

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
    const { slug, url, title, titleCn, difficulty, category, number, tags } = body

    if (!slug || !url) {
      return NextResponse.json({ 
        success: false, 
        error: '题目slug和链接为必填项' 
      }, { status: 400 })
    }

    // 检查slug是否已存在
    const existingProblem = await prisma.leetCodeProblem.findFirst({
      where: { slug: slug.trim() }
    })

    if (existingProblem) {
      return NextResponse.json({ 
        success: false, 
        error: '该题目已存在' 
      }, { status: 400 })
    }

    // 创建新题目
    const newProblem = await prisma.leetCodeProblem.create({
      data: {
        slug: slug.trim(),
        url: url.trim(),
        title: title?.trim() || 'Unknown Title',
        titleCn: titleCn?.trim() || title?.trim() || 'Unknown Title',
        difficulty: difficulty || 'medium',
        category: category || 'Array',
        number: number ? parseInt(number) : null,
        tags: tags || [category || 'Array'],
        isPublic: false,  // 改为私有
        createdBy: session.user.id  // 设置创建者
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
