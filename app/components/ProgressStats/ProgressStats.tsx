// components/ProgressStats.tsx
'use client'

import { CheckCircle, Target, Calendar, TrendingUp } from 'lucide-react'
import styles from './ProgressStats.module.sass'

interface ProgressStatsProps {
  // 基于天数的进度数据
  totalDays: number
  completedDays: number
  dayBasedProgress: number
  // 今日任务数据
  todayCompleted: number
  todayTarget: number
  // 其他数据
  totalProblems: number
  streak: number
  loading?: boolean
}

export default function ProgressStats({
  totalDays,
  completedDays,
  dayBasedProgress,
  todayCompleted,
  todayTarget,
  totalProblems,
  streak,
  loading = false
}: ProgressStatsProps) {
  // 使用基于天数的进度
  const overallProgress = dayBasedProgress
  const todayProgress = todayTarget > 0 ? (todayCompleted / todayTarget) * 100 : 0

  if (loading) {
    return (
      <div className={styles.progressStats}>
        <div className={styles.loadingState}>
          <div className={styles.skeleton}></div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.progressStats}>
      {/* 总体进度 */}
      <div className={styles.mainProgress}>
        <div className={styles.progressHeader}>
          <div className={styles.progressInfo}>
            <h3>学习进度</h3>
            <span className={styles.progressText}>
              {completedDays} / {totalDays} 天
            </span>
          </div>
          <div className={styles.progressPercentage}>
            {overallProgress.toFixed(1)}%
          </div>
        </div>
        
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          ></div>
        </div>
        
        <div className={styles.progressLabels}>
          <span>已完成</span>
          <span>剩余 {totalDays - completedDays} 天</span>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#F0FDF4' }}>
            <CheckCircle size={20} color="#10B981" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{todayCompleted}</div>
            <div className={styles.statLabel}>今日完成</div>
            <div className={styles.statProgress}>
              <div className={styles.miniProgressBar}>
                <div 
                  className={styles.miniProgressFill}
                  style={{ 
                    width: `${Math.min(todayProgress, 100)}%`,
                    backgroundColor: '#10B981'
                  }}
                ></div>
              </div>
              <span className={styles.miniProgressText}>
                {todayCompleted}/{todayTarget}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#EEF2FF' }}>
            <Target size={20} color="#4F46E5" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalProblems}</div>
            <div className={styles.statLabel}>总题目</div>
            <div className={styles.statSubtext}>
              计划用时 {Math.ceil(totalProblems * 45 / 60)} 小时
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#FEF3C7' }}>
            <TrendingUp size={20} color="#F59E0B" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{streak}</div>
            <div className={styles.statLabel}>连续天数</div>
            <div className={styles.statSubtext}>
              {streak > 0 ? '保持良好习惯！' : '开始你的学习之旅'}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#FEE2E2' }}>
            <Calendar size={20} color="#EF4444" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {totalDays - completedDays}
            </div>
            <div className={styles.statLabel}>预计剩余天数</div>
            <div className={styles.statSubtext}>
              按当前进度计算
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}