'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight  } from 'lucide-react'
import { Modal } from 'antd'
import styles from './page.module.sass'

interface DailyPlan {
  day: number
  date: string
  dayOfWeek: string
  newProblems: Array<{ name: string; url: string }>
  reviewProblems: Array<{ name: string; url: string }>
  totalCount: number
}

interface StudyCalendarProps {
  dailyPlans: DailyPlan[]
}

export default function StudyCalendar({ dailyPlans }: StudyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getMonthDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // 添加上个月的日期
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        isCurrentMonth: false,
        plan: null
      })
    }

    // 添加当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const plan = dailyPlans.find(p => p.date === dateStr)

      days.push({
        date: dateStr,
        day: day,
        isCurrentMonth: true,
        plan: plan || null
      })
    }

    return days
  }

  const handleDateClick = (dateInfo: any) => {
    if (dateInfo.plan) {
      setSelectedDate(dateInfo.date)
      setIsModalOpen(true)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const selectedPlan = dailyPlans.find(p => p.date === selectedDate)
  const monthDays = getMonthDays()

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button onClick={() => navigateMonth('prev')}>
          <ChevronLeft size={20} />
        </button>
        <h3>
          {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </h3>
        <button onClick={() => navigateMonth('next')}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.weekHeader}>
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className={styles.weekDay}>{day}</div>
        ))}
      </div>

      <div className={styles.monthGrid}>
        {monthDays.map((dayInfo, index) => (
          <div
            key={index}
            className={`${styles.dayCell} ${!dayInfo.isCurrentMonth ? styles.otherMonth : ''} ${dayInfo.plan ? styles.hasPlan : ''}`}
            onClick={() => handleDateClick(dayInfo)}
          >
            <div className={styles.dayNumber}>{dayInfo.day}</div>
            {dayInfo.plan && (
              <div className={styles.taskInfo}>
                <div className={styles.taskCount}>{dayInfo.plan.totalCount}题</div>
                {dayInfo.plan.newProblems.length > 0 && (
                  <div className={styles.newTasks}>{dayInfo.plan.newProblems.length}新</div>
                )}
                {dayInfo.plan.reviewProblems.length > 0 && (
                  <div className={styles.reviewTasks}>{dayInfo.plan.reviewProblems.length}复习</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        title={`${selectedPlan?.date} 学习任务`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedPlan && (
          <div>
            <h4>新题目 ({selectedPlan.newProblems.length})</h4>
            {selectedPlan.newProblems.map((problem, index) => (
              <div key={index} className={styles.problemItem}>
                <a href={problem.url} target="_blank" rel="noopener noreferrer">
                  {problem.name}
                </a>
              </div>
            ))}
            
            {selectedPlan.reviewProblems.length > 0 && (
              <>
                <h4>复习题目 ({selectedPlan.reviewProblems.length})</h4>
                {selectedPlan.reviewProblems.map((problem, index) => (
                  <div key={index} className={styles.problemItem}>
                    <a href={problem.url} target="_blank" rel="noopener noreferrer">
                      {problem.name}
                    </a>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}