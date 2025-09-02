import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const planId = params.id
    
    // 后端只使用UTC时间，不做时区转换
    // 支持测试时的模拟日期
    let now = new Date()
    try {
      const mockModule = await import('../../../debug/set-mock-date/route')
      now = mockModule.getCurrentDate()
    } catch (e) {
      // 如果模拟模块不存在，使用真实时间
    }
    const today = new Date(now)
    today.setUTCHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)

    console.log('Date ranges (UTC only):', {
      yesterday: yesterday.toISOString(),
      today: today.toISOString(),
      now: now.toISOString(),
      planId
    })

    // 查找昨天应该完成的任务
    const yesterdayTasks = await prisma.dailyTask.findMany({
      where: {
        planId: planId,
        currentDate: {
          gte: yesterday,
          lt: today
        }
      }
    })

    // 查找所有过期的任务（不管status，我们要重新计算实际完成情况）
    const pendingTasks = await prisma.dailyTask.findMany({
      where: {
        planId: planId,
        currentDate: { lt: today }
      },
      include: {
        taskItems: true
      }
    })

    console.log('Found pending tasks:', pendingTasks.length, pendingTasks.map(t => ({
      id: t.id,
      day: t.day,
      currentDate: t.currentDate.toISOString().split('T')[0],
      taskItemsCount: t.taskItems.length,
      newCount: t.taskItems.filter(item => item.taskType === 'new').length,
      reviewCount: t.taskItems.filter(item => item.taskType === 'review').length,
      status: t.status
    })))

    // 如果没有找到任何过期任务，直接查询所有任务来调试
    if (pendingTasks.length === 0) {
      const allTasks = await prisma.dailyTask.findMany({
        where: { planId: planId },
        include: {
          taskItems: true
        }
      })
      console.log('All tasks for this plan:', allTasks.map(t => ({
        id: t.id,
        day: t.day,
        currentDate: t.currentDate.toISOString().split('T')[0],
        newCount: t.taskItems.filter(item => item.taskType === 'new').length,
        reviewCount: t.taskItems.filter(item => item.taskType === 'review').length,
        status: t.status
      })))
    }

    if (pendingTasks.length === 0) {
      // 查询所有任务来调试
      const allTasks = await prisma.dailyTask.findMany({
        where: { planId: planId },
        include: {
          taskItems: true
        }
      })
      
      return NextResponse.json({
        success: true,
        planDestroyed: false,
        totalPendingProblems: 0,
        postponedTasks: 0,
        debug: {
          dateRanges: {
            yesterday: yesterday.toISOString(),
            today: today.toISOString()
          },
          foundTasks: 0,
          allTasksForPlan: allTasks.map(t => ({
            day: t.day,
            currentDate: t.currentDate.toISOString().split('T')[0],
            newCount: t.taskItems.filter((item: any) => item.taskType === 'new').length,
            reviewCount: t.taskItems.filter((item: any) => item.taskType === 'review').length,
            status: t.status
          }))
        }
      })
    }

    // 计算每个任务的实际完成情况
    let totalPendingProblems = 0
    const tasksToUpdate = []

    for (const task of pendingTasks) {
      const allTaskProblems = task.taskItems.map(item => item.problemId)
      
      // 检查这些题目的完成状态（使用与calendar-data相同的逻辑）
      const completedRecords = await prisma.studyRecord.findMany({
        where: {
          userId: session.user.id,
          problemId: { in: allTaskProblems }
        }
      })

      const completedProblemIds = new Set(completedRecords.filter(r => r.completed).map(r => r.problemId))
      
      // 计算未完成的题目
      const uncompletedNewProblems = task.taskItems
        .filter(item => item.taskType === 'new' && !completedProblemIds.has(item.problemId))
        .map(item => item.problemId)
      const uncompletedReviewProblems = task.taskItems
        .filter(item => item.taskType === 'review' && !completedProblemIds.has(item.problemId))
        .map(item => item.problemId)
      
      const uncompletedCount = uncompletedNewProblems.length + uncompletedReviewProblems.length
      
      console.log(`Task ${task.day} (${task.currentDate.toISOString().split('T')[0]}):`, {
        totalProblems: allTaskProblems.length,
        completedOnDate: completedProblemIds.size,
        uncompletedCount,
        uncompletedNew: uncompletedNewProblems,
        uncompletedReview: uncompletedReviewProblems
      })
      
      if (uncompletedCount > 0) {
        // 有未完成的题目，需要顺延
        totalPendingProblems += uncompletedCount
        tasksToUpdate.push({
          taskId: task.id,
          newProblems: uncompletedNewProblems,
          reviewProblems: uncompletedReviewProblems
        })
      } else {
        // 任务完全完成，标记为已完成
        await prisma.dailyTask.update({
          where: { id: task.id },
          data: { 
            status: 'completed',
            completedAt: new Date()
          }
        })
      }
    }

    console.log('Total pending problems to rollover:', totalPendingProblems)
    console.log('Tasks to update:', tasksToUpdate.length)

    // 检查是否需要销毁计划（积压超过15道题）
    if (totalPendingProblems > 15) {
      // 计算剩余未学习的题目
      const studyPlan = await prisma.studyPlan.findUnique({
        where: { id: planId }
      })
      
      if (studyPlan) {
        const remainingProblems = studyPlan.planProblems.filter(
          problemId => !studyPlan.learnedProblems.includes(problemId)
        )

        return NextResponse.json({
          success: true,
          planOverloaded: true,
          totalPendingProblems,
          remainingProblems: remainingProblems.length,
          planId: planId
        })
      }
    }

    // 顺延未完成的任务到今天
    if (tasksToUpdate.length > 0) {
      // 检查今天是否已有任务
      const todayTask = await prisma.dailyTask.findFirst({
        where: {
          planId: planId,
          currentDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })

      if (todayTask) {
        // 合并到今天的任务中
        const allUncompletedNew = tasksToUpdate.flatMap(t => t.newProblems)
        const allUncompletedReview = tasksToUpdate.flatMap(t => t.reviewProblems)
        
        // 为今天的任务添加未完成的TaskItems
        const newTaskItems = [
          ...allUncompletedNew.map(problemId => ({
            dailyTaskId: todayTask.id,
            problemId,
            taskType: 'new',
            completed: false
          })),
          ...allUncompletedReview.map(problemId => ({
            dailyTaskId: todayTask.id,
            problemId,
            taskType: 'review',
            completed: false
          }))
        ]
        
        await prisma.taskItem.createMany({
          data: newTaskItems
        })

        // 不删除历史任务记录，保留用于日历显示
      } else {
        // 创建新的今日任务
        const allUncompletedNew = tasksToUpdate.flatMap(t => t.newProblems)
        const allUncompletedReview = tasksToUpdate.flatMap(t => t.reviewProblems)
        
        const newDailyTask = await prisma.dailyTask.create({
          data: {
            planId: planId,
            day: 999, // 特殊标记，表示积压任务
            originalDate: today,
            currentDate: today,
            status: 'pending'
          }
        })

        // 为新任务创建TaskItems
        const newTaskItems = [
          ...allUncompletedNew.map(problemId => ({
            dailyTaskId: newDailyTask.id,
            problemId,
            taskType: 'new',
            completed: false
          })),
          ...allUncompletedReview.map(problemId => ({
            dailyTaskId: newDailyTask.id,
            problemId,
            taskType: 'review',
            completed: false
          }))
        ]
        
        await prisma.taskItem.createMany({
          data: newTaskItems
        })

        // 不删除历史任务记录，保留用于日历显示
      }
    }

    return NextResponse.json({
      success: true,
      planDestroyed: false,
      totalPendingProblems,
      postponedTasks: tasksToUpdate.length,
      debug: {
        dateRanges: {
          yesterday: yesterday.toISOString(),
          today: today.toISOString()
        },
        foundTasks: pendingTasks.length,
        tasksToUpdate: tasksToUpdate.length,
        allTasksForPlan: pendingTasks.map(t => ({
          day: t.day,
          currentDate: t.currentDate.toISOString().split('T')[0],
          newCount: t.taskItems.filter((item: any) => item.taskType === 'new').length,
          reviewCount: t.taskItems.filter((item: any) => item.taskType === 'review').length,
          status: t.status
        }))
      }
    })

  } catch (error) {
    console.error('检查昨日任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}