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
    const { problemId, notes } = body

    if (!problemId || typeof notes !== 'string') {
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

    // 查找或创建学习记录
    const existingRecord = await prisma.studyRecord.findFirst({
      where: {
        userId: session.user.id,
        problemId: problemId
      }
    })

    if (existingRecord) {
      // 更新现有记录的笔记
      await prisma.studyRecord.update({
        where: { id: existingRecord.id },
        data: { notes }
      })
    } else {
      // 创建新记录（仅包含笔记）
      await prisma.studyRecord.create({
        data: {
          userId: session.user.id,
          problemId: problemId,
          notes,
          reviewCount: 0,
          completed: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: '笔记保存成功'
    })

  } catch (error) {
    console.error('保存笔记失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
