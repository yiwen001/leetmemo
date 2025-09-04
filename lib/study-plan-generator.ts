// lib/study-plan-generator.ts
import { PrismaClient } from '@prisma/client'

export interface Problem {
    id?: string
    name: string
    url: string
    slug: string
    difficulty?: 'easy' | 'medium' | 'hard'
  }
  
  export interface DailyPlan {
    day: number
    date: string
    dayOfWeek: string
    newProblems: Problem[]
    reviewProblems: Problem[]
    totalCount: number
    estimatedTime: number
  }
  
  export interface StudyPlanConfig {
  problemSlugs: string[]     // 用户选定的题目slug列表
  learnedProblems?: string[] // 已学过的题目slug（重新开始时用）
  duration: number           // 计划天数
  startDate: string         // 开始日期
  intensity: 'easy' | 'medium' | 'hard'
}
  
  export class StudyPlanGenerator {
    private prisma: PrismaClient
    private config = {
      REVIEW_INTERVALS: [1, 3, 7, 15, 30],
      LIMITS: {
        easy: { MAX_DAILY_NEW: 2, MAX_DAILY_TOTAL: 6 },
        medium: { MAX_DAILY_NEW: 3, MAX_DAILY_TOTAL: 8 },
        hard: { MAX_DAILY_NEW: 4, MAX_DAILY_TOTAL: 12 }
      }
    }

    constructor() {
      this.prisma = new PrismaClient()
    }
  
   async generatePlan(config: StudyPlanConfig) {
  const { problemSlugs, learnedProblems = [], duration, startDate, intensity } = config
  
  // 从数据库获取题目信息
  const problems = await this.prisma.leetCodeProblem.findMany({
    where: {
      slug: {
        in: problemSlugs
      }
    }
  })
  
  // 转换为 Problem 格式
  const problemList: Problem[] = problems.map(p => ({
    id: p.id.toString(),
    name: p.title,
    url: `https://leetcode.cn/problems/${p.slug}/`,
    slug: p.slug,
    difficulty: p.difficulty as 'easy' | 'medium' | 'hard'
  }))
  
  // 过滤掉已学过的题目
  const remainingProblems = problemList.filter(p => 
    !learnedProblems.includes(p.slug)
  )
  
  console.log(`总题目: ${problemList.length}, 已学: ${learnedProblems.length}, 剩余: ${remainingProblems.length}`)
  
  if (remainingProblems.length === 0) {
    throw new Error('没有剩余题目可以学习')
  }
  
  // 用剩余题目生成计划
  const dailyPlans = this.createDailyPlans(remainingProblems, duration, startDate, intensity)
  
  return {
    projectInfo: {
      totalProblems: problemList.length,
      remainingProblems: remainingProblems.length,
      learnedProblems: learnedProblems.length,
      duration,
      startDate,
      endDate: this.calculateEndDate(startDate, duration),
      intensity
    },
    dailyPlans,
    statistics: this.generateStats(dailyPlans, remainingProblems.length)
  }
}
  
    private createDailyPlans(problems: Problem[], duration: number, startDate: string, intensity: string): DailyPlan[] {
      const totalProblems = problems.length
      const dailyNewCount = Math.ceil(totalProblems / duration) // 每天新题数量
      
      const plans: DailyPlan[] = []
      const start = new Date(startDate)
      const limits = this.config.LIMITS[intensity as keyof typeof this.config.LIMITS]
      
      // 初始化每日计划
      for (let i = 0; i < duration; i++) {
        const currentDate = new Date(start)
        currentDate.setDate(start.getDate() + i)
        
        plans.push({
          day: i + 1,
          date: currentDate.toISOString().split('T')[0],
          dayOfWeek: currentDate.toLocaleDateString('zh-CN', { weekday: 'long' }),
          newProblems: [],
          reviewProblems: [],
          totalCount: 0,
          estimatedTime: 0
        })
      }
  
      // 分配新题目
      this.distributeNewProblems(plans, problems, limits.MAX_DAILY_NEW)
      
      // 计算复习任务
      this.calculateReviewTasks(plans)
      
      return plans
    }
  
    private distributeNewProblems(plans: DailyPlan[], problems: Problem[], maxDaily: number) {
      let problemIndex = 0
      const totalDays = plans.length
      
      for (let dayIndex = 0; dayIndex < totalDays && problemIndex < problems.length; dayIndex++) {
        const remainingProblems = problems.length - problemIndex
        const remainingDays = totalDays - dayIndex
        
        const dailyNew = Math.min(
          maxDaily,
          Math.ceil(remainingProblems / remainingDays)
        )
        
        const endIndex = Math.min(problemIndex + dailyNew, problems.length)
        plans[dayIndex].newProblems = problems.slice(problemIndex, endIndex).map((problem, index) => ({
          ...problem,
          id: `${dayIndex + 1}-${index + 1}`
        }))
        
        problemIndex = endIndex
      }
    }
  
    private calculateReviewTasks(plans: DailyPlan[]) {
      for (let dayIndex = 0; dayIndex < plans.length; dayIndex++) {
        const currentDay = plans[dayIndex]
        
        // 查找需要复习的题目
        for (let studyDayIndex = 0; studyDayIndex < dayIndex; studyDayIndex++) {
          const studyDay = plans[studyDayIndex]
          const daysSinceStudy = dayIndex - studyDayIndex
          
          // 检查是否到了复习时间
          if (this.config.REVIEW_INTERVALS.includes(daysSinceStudy)) {
            studyDay.newProblems.forEach(problem => {
              currentDay.reviewProblems.push({
                ...problem,
                id: `review-${problem.id}-${dayIndex}`
              })
            })
          }
        }
        
        // 更新总数和预估时间
        currentDay.totalCount = currentDay.newProblems.length + currentDay.reviewProblems.length
        currentDay.estimatedTime = (currentDay.newProblems.length * 45) + (currentDay.reviewProblems.length * 15)
      }
    }
  
    private calculateEndDate(startDate: string, duration: number): string {
      const start = new Date(startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + duration - 1)
      return end.toISOString().split('T')[0]
    }
  
    private generateStats(dailyPlans: DailyPlan[], totalProblems: number) {
      const totalNewAssigned = dailyPlans.reduce((sum, day) => sum + day.newProblems.length, 0)
      const totalReviewTasks = dailyPlans.reduce((sum, day) => sum + day.reviewProblems.length, 0)
      
      return {
        totalProblems,
        assignedProblems: totalNewAssigned,
        totalReviewTasks,
        coverageRate: ((totalNewAssigned / totalProblems) * 100).toFixed(1) + '%'
      }
    }
  
    // 获取今日任务
    getTodayTasks(dailyPlans: DailyPlan[]): DailyPlan | null {
      const today = new Date().toISOString().split('T')[0]
      return dailyPlans.find(day => day.date === today) || null
    }
  }