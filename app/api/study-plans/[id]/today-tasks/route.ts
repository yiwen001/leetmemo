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
    
    // 计算今天的UTC日期范围
    const today = new Date(now)
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    
    console.log('Looking for today tasks (UTC):', {
      today: today.toISOString().split('T')[0],
      now: now.toISOString().split('T')[0]
    })

    // 只查找今天的任务，不包含历史任务
    const todayTasks = await prisma.dailyTask.findMany({
      where: {
        planId: planId,
        currentDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        taskItems: true
      },
      orderBy: { day: 'asc' }
    })

    console.log('Found today tasks:', todayTasks.length, todayTasks.map(t => ({ 
      day: t.day, 
      currentDate: t.currentDate.toISOString().split('T')[0],
      taskItemsCount: t.taskItems.length
    })))

    // 获取所有相关的题目ID
    const allProblemIds: string[] = []
    todayTasks.forEach(task => {
      const problemIds = task.taskItems.map(item => item.problemId)
      allProblemIds.push(...problemIds)
    })

    // 从数据库获取题目详情
    const problemDetails = await prisma.leetCodeProblem.findMany({
      where: {
        id: { in: allProblemIds }
      }
    })

    // 获取用户的学习记录
    const studyRecords = await prisma.studyRecord.findMany({
      where: {
        userId: session.user.id,
        problemId: { in: allProblemIds }
      }
    })

    // 创建题目ID到详情的映射
    const problemMap = new Map()
    problemDetails.forEach(problem => {
      problemMap.set(problem.id, problem)
    })

    // 创建题目ID到学习记录的映射
    const recordMap = new Map()
    studyRecords.forEach(record => {
      recordMap.set(record.problemId, record)
    })

    // 转换为前端需要的格式
    const tasks = []
    let problemNumber = 1

    for (const task of todayTasks) {
      // 处理所有TaskItems
      for (const taskItem of task.taskItems) {
        const problemDetail = problemMap.get(taskItem.problemId)
        const studyRecord = recordMap.get(taskItem.problemId)
        // 使用TaskItem的completion状态，而不是StudyRecord的状态
        const completedToday = taskItem.completed

        if (problemDetail) {
          const isNewTask = taskItem.taskType === 'new'
          tasks.push({
            id: `${task.id}-${taskItem.taskType}-${taskItem.problemId}`,
            taskItemId: taskItem.id, // 添加taskItemId字段
            number: problemNumber++,
            title: isNewTask ? 
              (problemDetail.titleCn || problemDetail.title) : 
              `[复习] ${problemDetail.titleCn || problemDetail.title}`,
            url: problemDetail.url,
            notes: studyRecord?.notes || '',
            reviewCount: isNewTask ? 
              (studyRecord?.reviewCount || 0) : 
              (studyRecord?.reviewCount || 0) + 1,
            lastReviewDate: studyRecord?.lastReviewDate?.toISOString() || task.currentDate.toISOString(),
            completed: completedToday,
            addedDate: task.currentDate.toISOString(),
            type: taskItem.taskType,
            difficulty: problemDetail.difficulty,
            leetcodeNumber: problemDetail.number
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      tasks,
      totalTasks: tasks.length
    })

  } catch (error) {
    console.error('获取今日任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}