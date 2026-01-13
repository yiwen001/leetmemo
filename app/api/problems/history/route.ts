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
    // 移除限制，显示所有题目
    const limit = undefined
    const offset = 0

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
        leetcodeProblem: true,
        userCategory: true
      },
      orderBy
      // 移除skip和take参数，显示所有结果
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
      timeSpent: record.timeSpent,
      categoryId: record.categoryId,
      category: record.userCategory?.name || '未分类'
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

// 创建题目笔记
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { url, title, difficulty } = await request.json()
    
    if (!url || !title) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 检查题目是否已存在
    let leetcodeProblem = await prisma.leetCodeProblem.findFirst({
      where: {
        url: url,
        OR: [
          { isPublic: true },
          { createdBy: session.user.id }
        ]
      }
    })

    // 如果题目不存在，创建新题目
    if (!leetcodeProblem) {
      leetcodeProblem = await prisma.leetCodeProblem.create({
        data: {
          slug: `custom-${Date.now()}`,
          title: title,
          titleCn: title,
          difficulty: difficulty || 'medium',
          url: url,
          tags: [],
          category: '未分类',
          isPublic: false,
          createdBy: session.user.id,
          notes: ''
        }
      })
    }

    // 检查是否已存在学习记录
    let studyRecord = await prisma.studyRecord.findFirst({
      where: {
        userId: session.user.id,
        problemId: leetcodeProblem.id
      }
    })

    // 如果学习记录不存在，创建新记录
    if (!studyRecord) {
      studyRecord = await prisma.studyRecord.create({
        data: {
          userId: session.user.id,
          problemId: leetcodeProblem.id,
          difficulty: leetcodeProblem.difficulty,
          reviewCount: 0,
          completed: false,
          notes: '',
          timeSpent: 0,
          categoryId: null // 使用 categoryId 代替 category
        },
        include: {
          leetcodeProblem: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      record: studyRecord
    })

  } catch (error) {
    console.error('创建题目笔记失败:', error)
    // 提供更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '创建失败'
    console.error('详细错误信息:', JSON.stringify(error, null, 2))
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

// 更新题目分类
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { recordId, categoryId } = await request.json()
    
    if (!recordId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const studyRecord = await prisma.studyRecord.findFirst({
      where: {
        id: recordId,
        userId: session.user.id
      }
    })

    if (!studyRecord) {
      return NextResponse.json({ error: '学习记录不存在' }, { status: 404 })
    }

    const updatedRecord = await prisma.studyRecord.update({
      where: {
        id: recordId
      },
      data: {
        categoryId: categoryId
      },
      include: {
        leetcodeProblem: true,
        userCategory: true
      }
    })

    return NextResponse.json({
      success: true,
      record: updatedRecord
    })

  } catch (error) {
    console.error('更新题目分类失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新失败'
    }, { status: 500 })
  }
}

// 清空所有学习历史
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 删除用户的所有学习记录
    const deletedRecords = await prisma.studyRecord.deleteMany({
      where: {
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: `已清空 ${deletedRecords.count} 条学习记录`,
      deletedCount: deletedRecords.count
    })

  } catch (error) {
    console.error('清空学习历史失败:', error)
    return NextResponse.json({
      success: false,
      error: '清空失败'
    }, { status: 500 })
  }
}
