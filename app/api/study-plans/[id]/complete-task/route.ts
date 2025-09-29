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
    const { taskItemId, completed = true } = body

    if (!taskItemId) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必填参数: taskItemId' 
      }, { status: 400 })
    }

    // 1. 查找TaskItem并验证权限
    const taskItem = await prisma.taskItem.findFirst({
      where: {
        id: taskItemId,
        dailyTask: {
          plan: {
            userId: session.user.id
          }
        }
      },
      include: {
        dailyTask: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!taskItem) {
      return NextResponse.json({ 
        success: false, 
        error: '任务不存在或无权限' 
      }, { status: 404 })
    }

    // 2. 更新TaskItem状态（今日任务完成状态）
    await prisma.taskItem.update({
      where: { id: taskItemId },
      data: { completed }
    })

    // 3. 更新长期学习记录（StudyRecord）- 只在标记完成时更新
    if (completed) {
      const problemId = taskItem.problemId
      const planId = taskItem.dailyTask.planId

      // 如果是新题目，添加到已学习列表
      if (taskItem.taskType === 'new') {
        const plan = taskItem.dailyTask.plan
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

      // 创建或更新StudyRecord
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
            studyPlanId: planId,
            reviewCount: 1,
            lastReviewDate: new Date(),
            completed: true,
            notes: ''
          }
        })
      }
    }

    // 4. 检查DailyTask是否整体完成
    const allTaskItems = await prisma.taskItem.findMany({
      where: { dailyTaskId: taskItem.dailyTaskId }
    })

    const allCompleted = allTaskItems.every(item => item.completed)
    
    // 更新DailyTask状态
    if (allCompleted) {
      await prisma.dailyTask.update({
        where: { id: taskItem.dailyTaskId },
        data: { 
          status: 'completed',
          completedAt: new Date()
        }
      })
    } else {
      // 如果不是全部完成，确保DailyTask状态不是completed
      await prisma.dailyTask.update({
        where: { id: taskItem.dailyTaskId },
        data: { 
          status: 'active',
          completedAt: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: completed ? '任务完成成功' : '已取消完成标记',
      taskCompleted: completed,
      dailyTaskCompleted: allCompleted
    })

  } catch (error) {
    console.error('完成任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
