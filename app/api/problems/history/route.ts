import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 构建查询条件
    const whereClause: any = {
      userId: session.user.id,
    }

    // 如果有搜索条件，添加到查询中
    if (search) {
      whereClause.OR = [
        {
          leetcodeProblem: {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          leetcodeProblem: {
            titleCn: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          notes: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // 构建排序条件
    let orderBy: any = { createdAt: 'desc' }
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'most-reviewed':
        orderBy = { reviewCount: 'desc' }
        break
      case 'least-reviewed':
        orderBy = { reviewCount: 'asc' }
        break
      case 'recently-reviewed':
        orderBy = { lastReviewDate: 'desc' }
        break
      case 'title-asc':
        orderBy = { leetcodeProblem: { title: 'asc' } }
        break
      case 'title-desc':
        orderBy = { leetcodeProblem: { title: 'desc' } }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // 获取学习记录和相关的题目信息
    const studyRecords = await prisma.studyRecord.findMany({
      where: whereClause,
      include: {
        leetcodeProblem: true
      },
      orderBy,
      skip: offset,
      take: limit
    })

    // 获取总数
    const totalCount = await prisma.studyRecord.count({
      where: whereClause
    })

    // 转换为前端需要的格式
    const problems = studyRecords.map(record => ({
      id: record.id,
      number: record.leetcodeProblem.number,
      title: record.leetcodeProblem.titleCn || record.leetcodeProblem.title,
      url: record.leetcodeProblem.url,
      reviewCount: record.reviewCount,
      lastReviewDate: record.lastReviewDate?.toISOString().split('T')[0] || record.createdAt.toISOString().split('T')[0],
      addedDate: record.createdAt.toISOString().split('T')[0],
      notes: record.notes || '',
      difficulty: record.leetcodeProblem.difficulty,
      completed: record.completed,
      timeSpent: record.timeSpent
    }))

    return NextResponse.json({
      success: true,
      problems,
      total: totalCount,
      limit,
      offset
    })

  } catch (error) {
    console.error('获取历史题目失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}

// 更新题目笔记
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { recordId, notes } = await request.json()
    
    if (!recordId) {
      return NextResponse.json({ error: '缺少记录ID' }, { status: 400 })
    }

    // 更新学习记录的笔记
    const updatedRecord = await prisma.studyRecord.update({
      where: {
        id: recordId,
        userId: session.user.id // 确保只能更新自己的记录
      },
      data: {
        notes: notes || ''
      },
      include: {
        leetcodeProblem: true
      }
    })

    return NextResponse.json({
      success: true,
      record: updatedRecord
    })

  } catch (error) {
    console.error('更新笔记失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新失败'
    }, { status: 500 })
  }
}
