// components/ProgressStats.tsx
'use client'

import { CheckCircle, Target, Calendar, TrendingUp } from 'lucide-react'
import styles from './ProgressStats.module.sass'

interface ProgressStatsProps {
  totalProblems: number
  completedProblems: number
  todayCompleted: number
  todayTarget: number
  streak: number
  loading?: boolean
}

export default function ProgressStats({
  totalProblems,
  completedProblems,
  todayCompleted,
  todayTarget,
  streak,
  loading = false
}: ProgressStatsProps) {
  const overallProgress = totalProblems > 0 ? (completedProblems / totalProblems) * 100 : 0
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
              {completedProblems} / {totalProblems} 题
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
          <span>剩余 {totalProblems - completedProblems} 题</span>
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
              {totalProblems > 0 ? Math.ceil((totalProblems - completedProblems) / 3) : 0}
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