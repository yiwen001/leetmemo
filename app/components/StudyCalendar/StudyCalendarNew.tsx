'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Target, CheckCircle, Clock } from 'lucide-react'
import { Modal, message } from 'antd'
import styles from './page.module.sass'

interface Problem {
  id: string
  title: string
  number: number
  difficulty: string
  url: string
  completed: boolean
  notes: string
}

interface CalendarDay {
  day: number
  date: string
  currentDate: string
  newProblems: Problem[]
  reviewProblems: Problem[]
  newProblemsCount: number
  reviewProblemsCount: number
  totalProblems: number
  completedProblems: number
  status: 'pending' | 'completed' | 'partial' | 'overdue'
  taskStatus: string
  completedAt: string | null
}

interface StudyCalendarProps {
  planId: string | null
}

export default function StudyCalendarNew({ planId }: StudyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState<string>('')
  const [statistics, setStatistics] = useState({
    totalDays: 0,
    completedDays: 0,
    partialDays: 0,
    overdueDays: 0,
    completionRate: 0
  })

  // 获取当前日期
  useEffect(() => {
    fetchCurrentDate()
  }, [])

  // 获取日历数据
  useEffect(() => {
    if (planId && currentDate) {
      fetchCalendarData()
    }
  }, [planId, currentDate])

  const fetchCurrentDate = async () => {
    try {
      const response = await fetch('/api/debug/set-mock-date', { method: 'GET' })
      const result = await response.json()
      if (result.success && result.effectiveDate) {
        const date = new Date(result.effectiveDate)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        setCurrentDate(dateStr)
        console.log(`Fetched current date: ${dateStr}`)
      } else {
        // 如果获取失败，使用本地日期
        const date = new Date()
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        setCurrentDate(dateStr)
        console.log(`Using local date: ${dateStr}`)
      }
    } catch (error) {
      console.error('Failed to fetch current date:', error)
      // 如果获取失败，使用本地日期
      const date = new Date()
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      setCurrentDate(dateStr)
    }
  }

  const fetchCalendarData = async () => {
    if (!planId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/study-plans/${planId}/calendar-data`)
      const result = await response.json()

      if (result.success) {
        setCalendarData(result.data.calendar)
        setStatistics(result.data.statistics)
      } else {
        message.error('获取日历数据失败')
      }
    } catch (error) {
      console.error('获取日历数据失败:', error)
      message.error('获取日历数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getMonthDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // 使用从后端获取的当前日期，而不是浏览器本地日期
    const todayStr = currentDate
    
    // 调试信息
    console.log(`Current date from backend: ${todayStr}`)
    console.log(`Calendar data:`, calendarData)
    
    // 格式化日期为 YYYY-MM-DD 格式，避免时区问题
    const formatDate = (year: number, month: number, day: number) => {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    
    // 判断日期是否为过去
    const isPastDate = (dateStr: string) => {
      return dateStr < todayStr
    }
    
    // 添加上个月的日期
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate()
      const day = prevMonthDays - i
      const dateStr = formatDate(prevYear, prevMonth, day)
      
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        plan: null
      })
    }

    // 添加当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day)
      const plan = calendarData.find(p => p.date === dateStr || p.currentDate === dateStr)
      
      // 对于过去的日期，直接使用后端计算的状态，不需要前端重新计算
      let historicalStatus = null
      if (isPastDate(dateStr) && plan) {
        // 直接使用后端已经正确计算的状态
        historicalStatus = plan.status
        // 调试信息
        console.log(`Date: ${dateStr}, isPast: ${isPastDate(dateStr)}, plan exists: ${!!plan}, completed: ${plan.completedProblems}/${plan.totalProblems}, backend status: ${plan.status}`)
      } else if (isPastDate(dateStr)) {
        // 调试信息
        console.log(`Date: ${dateStr}, isPast: ${isPastDate(dateStr)}, no plan found`)
        // 没有计划的过去日期保持 null，不显示任何状态
      }
      
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        plan,
        isPast: isPastDate(dateStr),
        historicalStatus
      })
    }

    // 添加下个月的日期
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      const dateStr = formatDate(nextYear, nextMonth, day)
      
      days.push({
        date: dateStr,
        day: day,
        isCurrentMonth: false,
        plan: null,
        isPast: isPastDate(dateStr),
        historicalStatus: null
      })
    }

    return days
  }

  const handleDateClick = (dateStr: string, plan: CalendarDay | null) => {
    if (plan) {
      setSelectedDate(dateStr)
      setIsModalOpen(true)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#52c41a'
      case 'partial': return '#faad14'
      case 'overdue': return '#f5222d'
      case 'pending': return '#d9d9d9'
      default: return '#f0f0f0'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'partial': return '部分完成'
      case 'overdue': return '已逾期'
      case 'pending': return '待完成'
      default: return '无任务'
    }
  }

  const selectedPlan = calendarData.find(p => p.date === selectedDate || p.currentDate === selectedDate)
  const monthDays = getMonthDays()

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>加载日历数据中...</div>
      </div>
    )
  }

  return (
    <div className={styles.calendarContainer}>
      {/* 统计信息 */}
      <div className={styles.calendarStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>总天数</span>
          <span className={styles.statValue}>{statistics.totalDays}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>已完成</span>
          <span className={styles.statValue} style={{ color: '#52c41a' }}>
            {statistics.completedDays}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>部分完成</span>
          <span className={styles.statValue} style={{ color: '#faad14' }}>
            {statistics.partialDays}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>完成率</span>
          <span className={styles.statValue}>{statistics.completionRate}%</span>
        </div>
      </div>

      {/* 日历头部 */}
      <div className={styles.calendarHeader}>
        <button 
          className={styles.navButton}
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
        >
          <ChevronLeft size={20} />
        </button>
        
        <h3 className={styles.monthTitle}>
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
        </h3>
        
        <button 
          className={styles.navButton}
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 星期标题 */}
      <div className={styles.weekHeader}>
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className={styles.weekDay}>{day}</div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className={styles.calendarGrid}>
        {monthDays.map(({ date, day, isCurrentMonth, plan, isPast, historicalStatus }) => {
          // 对于过去的日期，使用历史完成状态；对于今天及未来，使用计划状态
          const displayStatus = isPast && historicalStatus ? historicalStatus : (plan?.status || null)
          
          return (
            <div
              key={date}
              className={`${styles.calendarDay} ${!isCurrentMonth ? styles.otherMonth : ''} ${plan ? styles.hasTask : ''}`}
              onClick={() => handleDateClick(date, plan)}
              style={{
                backgroundColor: displayStatus ? getStatusColor(displayStatus) : undefined,
                opacity: isCurrentMonth ? 1 : 0.3,
                cursor: plan ? 'pointer' : 'default'
              }}
            >
              <span className={styles.dayNumber}>{day}</span>
              {plan && (
                <div className={styles.taskIndicator}>
                  <div className={styles.taskCount}>
                    {plan.completedProblems}/{plan.totalProblems}
                  </div>
                  {displayStatus === 'completed' && (
                    <CheckCircle size={12} style={{ color: 'white' }} />
                  )}
                  {displayStatus === 'overdue' && (
                    <Clock size={12} style={{ color: 'white' }} />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 图例 */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#52c41a' }}></div>
          <span>已完成</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#faad14' }}></div>
          <span>部分完成</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#f5222d' }}></div>
          <span>已逾期</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#d9d9d9' }}></div>
          <span>待完成</span>
        </div>
      </div>

      {/* 详情弹窗 */}
      <Modal
        title={`${selectedDate} 学习详情`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedPlan && (
          <div className={styles.dayDetail}>
            <div className={styles.detailHeader}>
              <h4>第 {selectedPlan.day} 天</h4>
              <span
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(selectedPlan.status) }}
              >
                {getStatusText(selectedPlan.status)}
              </span>
            </div>

            <div className={styles.detailStats}>
              <div className={styles.detailStat}>
                <Target size={16} />
                <span>新题目: {selectedPlan.newProblemsCount} 道</span>
              </div>
              <div className={styles.detailStat}>
                <Calendar size={16} />
                <span>复习题目: {selectedPlan.reviewProblemsCount} 道</span>
              </div>
              <div className={styles.detailStat}>
                <CheckCircle size={16} />
                <span>完成进度: {selectedPlan.completedProblems}/{selectedPlan.totalProblems}</span>
              </div>
            </div>

            {/* 新题目列表 */}
            {selectedPlan.newProblems.length > 0 && (
              <div className={styles.problemSection}>
                <h5 className={styles.sectionTitle}>
                  <Target size={16} />
                  新题目 ({selectedPlan.newProblems.length} 道)
                </h5>
                <div className={styles.problemList}>
                  {selectedPlan.newProblems.map(problem => (
                    <div key={problem.id} className={styles.problemItem}>
                      <div className={styles.problemHeader}>
                        <span className={styles.problemNumber}>#{problem.number}</span>
                        <span
                          className={styles.difficultyBadge}
                          style={{
                            backgroundColor:
                              problem.difficulty === 'easy' ? '#52c41a' :
                              problem.difficulty === 'medium' ? '#faad14' : '#f5222d'
                          }}
                        >
                          {problem.difficulty === 'easy' ? '简单' :
                           problem.difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                        {problem.completed && (
                          <CheckCircle size={16} style={{ color: '#52c41a' }} />
                        )}
                      </div>
                      <div className={styles.problemTitle}>
                        <a href={problem.url} target="_blank" rel="noopener noreferrer">
                          {problem.title}
                        </a>
                      </div>
                      {problem.notes && (
                        <div className={styles.problemNotes}>
                          <strong>笔记：</strong>{problem.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 复习题目列表 */}
            {selectedPlan.reviewProblems.length > 0 && (
              <div className={styles.problemSection}>
                <h5 className={styles.sectionTitle}>
                  <Calendar size={16} />
                  复习题目 ({selectedPlan.reviewProblems.length} 道)
                </h5>
                <div className={styles.problemList}>
                  {selectedPlan.reviewProblems.map(problem => (
                    <div key={problem.id} className={styles.problemItem}>
                      <div className={styles.problemHeader}>
                        <span className={styles.problemNumber}>#{problem.number}</span>
                        <span
                          className={styles.difficultyBadge}
                          style={{
                            backgroundColor:
                              problem.difficulty === 'easy' ? '#52c41a' :
                              problem.difficulty === 'medium' ? '#faad14' : '#f5222d'
                          }}
                        >
                          {problem.difficulty === 'easy' ? '简单' :
                           problem.difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                        {problem.completed && (
                          <CheckCircle size={16} style={{ color: '#52c41a' }} />
                        )}
                      </div>
                      <div className={styles.problemTitle}>
                        <a href={problem.url} target="_blank" rel="noopener noreferrer">
                          {problem.title}
                        </a>
                      </div>
                      {problem.notes && (
                        <div className={styles.problemNotes}>
                          <strong>笔记：</strong>{problem.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPlan.completedAt && (
              <div className={styles.completedInfo}>
                <CheckCircle size={16} style={{ color: '#52c41a' }} />
                <span>完成时间: {new Date(selectedPlan.completedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
