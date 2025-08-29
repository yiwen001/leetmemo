import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, problemId, type } = body // type: 'new' | 'review'

    if (!taskId || !problemId || !type) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必填参数' 
      }, { status: 400 })
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

    // 如果是新题目，添加到已学习列表
    if (type === 'new') {
      const currentLearned = plan.learnedProblems || []
      if (!currentLearned.includes(problemId)) {
        await prisma.studyPlan.update({
          where: { id: planId },
          data: {
            learnedProblems: [...currentLearned, problemId]
          }
        })
      }
    }

    // 创建或更新学习记录
    const existingRecord = await prisma.studyRecord.findFirst({
      where: {
        userId: session.user.id,
        problemId: problemId
      }
    })

    if (existingRecord) {
      // 更新现有记录
      await prisma.studyRecord.update({
        where: { id: existingRecord.id },
        data: {
          reviewCount: existingRecord.reviewCount + 1,
          lastReviewDate: new Date(),
          completed: true
        }
      })
    } else {
      // 创建新记录
      await prisma.studyRecord.create({
        data: {
          userId: session.user.id,
          problemId: problemId,
          reviewCount: 1,
          lastReviewDate: new Date(),
          completed: true,
          notes: ''
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: '题目标记完成成功'
    })

  } catch (error) {
    console.error('标记完成失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
