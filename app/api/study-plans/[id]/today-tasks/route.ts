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
    
    console.log('Looking for tasks on or before UTC date:', now.toISOString().split('T')[0])

    // 查找今天及之前应该完成的所有任务（未完成的会自动显示）
    const allRelevantTasks = await prisma.dailyTask.findMany({
      where: {
        planId: planId,
        currentDate: {
          lte: now  // 小于等于当前UTC时间的所有任务
        }
      },
      include: {
        taskItems: true
      },
      orderBy: { day: 'asc' }
    })

    console.log('Found tasks on or before today:', allRelevantTasks.length, allRelevantTasks.map(t => ({ 
      day: t.day, 
      currentDate: t.currentDate.toISOString().split('T')[0],
      taskItemsCount: t.taskItems.length
    })))

    // 获取所有相关的题目ID
    const allProblemIds: string[] = []
    allRelevantTasks.forEach(task => {
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

    // 获取今天已完成的任务记录 - 使用UTC时间
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayEndForCompletion = new Date()
    todayEndForCompletion.setUTCHours(23, 59, 59, 999)
    
    const todayCompletedRecords = await prisma.studyRecord.findMany({
      where: {
        userId: session.user.id,
        problemId: { in: allProblemIds },
        lastReviewDate: {
          gte: todayStart,
          lte: todayEndForCompletion
        },
        completed: true
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

    // 创建今天已完成任务的映射
    const todayCompletedMap = new Set()
    todayCompletedRecords.forEach(record => {
      todayCompletedMap.add(record.problemId)
    })

    // 转换为前端需要的格式
    const tasks = []
    let problemNumber = 1

    for (const task of allRelevantTasks) {
      // 处理所有TaskItems
      for (const taskItem of task.taskItems) {
        const problemDetail = problemMap.get(taskItem.problemId)
        const studyRecord = recordMap.get(taskItem.problemId)
        const completedToday = todayCompletedMap.has(taskItem.problemId)

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
            lastReviewDate: studyRecord?.lastReviewDate?.toISOString() || todayStart.toISOString(),
            completed: completedToday,
            addedDate: todayStart.toISOString(),
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