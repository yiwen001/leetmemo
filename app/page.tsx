'use client'

import { useState } from 'react'
import { Calendar, Plus, BookOpen, CheckCircle, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Modal, message } from 'antd'
import styles from './page.module.sass'
import AddProblemForm from './components/problems/AddProblemForm'

// 引入Ant Design样式
import 'antd/dist/reset.css'

// 简化的Mock数据，添加笔记内容和完成状态
const mockTodayReviews = [
  {
    id: '1',
    number: 1,
    title: '比较版本号',
    url: 'https://leetcode.cn/problems/compare-version-numbers',
    reviewCount: 3,
    lastReviewDate: '2024-01-15',
    completed: false, // 添加完成状态
    notes: '关键思路：按点分割字符串，然后逐段比较数字大小。注意处理前导零和长度不同的情况。\n\n代码要点：\n- split(".")分割\n- parseInt()转数字\n- 补齐短的版本号',
  },
  {
    id: '2', 
    number: 2,
    title: 'LRU Cache',
    url: 'https://leetcode.com/problems/lru-cache/',
    reviewCount: 2,
    lastReviewDate: '2024-01-13',
    completed: false,
    notes: '双向链表 + 哈希表实现。链表维护访问顺序，哈希表提供O(1)查找。\n\n核心操作：\n- get: 移到头部\n- put: 添加到头部，超容量删除尾部',
  },
  {
    id: '3',
    number: 3,
    title: 'Trapping Rain Water',
    url: 'https://leetcode.com/problems/trapping-rain-water/',
    reviewCount: 1,
    lastReviewDate: '2024-01-14',
    completed: false,
    notes: '双指针法：左右指针向中间移动，维护左右最大高度。\n\n思路：当前位置能接的雨水 = min(左侧最高, 右侧最高) - 当前高度',
  },
]

const stats = {
  totalProblems: 45,
  completedToday: 2,
  streak: 7,
  totalReviews: 134,
}

export default function HomePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [problems, setProblems] = useState(mockTodayReviews)
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)

  // 从URL提取题目标题的简单函数
  const extractTitleFromUrl = (url: string) => {
    try {
      const match = url.match(/problems\/([^\/]+)/)
      if (match) {
        return match[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
      return `题目 ${stats.totalProblems + 1}`
    } catch {
      return `题目 ${stats.totalProblems + 1}`
    }
  }

  const handleAddProblem = async (problemData: any) => {
    setLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const title = extractTitleFromUrl(problemData.url)
      
      const newProblem = {
        id: Date.now().toString(),
        number: stats.totalProblems + 1,
        title: title,
        url: problemData.url,
        reviewCount: 0,
        lastReviewDate: new Date().toISOString().split('T')[0],
        completed: false,
        notes: problemData.notes || '',
      }
      
      setProblems(prev => [...prev, newProblem])
      stats.totalProblems += 1
      
      setIsAddModalOpen(false)
      message.success(`题目"${title}"添加成功！`)
    } catch (error) {
      message.error('添加题目失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 切换笔记预览
  const toggleNotePreview = (problemId: string) => {
    setExpandedNotes(expandedNotes === problemId ? null : problemId)
  }

  // 标记完成复习
  const handleCompleteReview = (problemId: string) => {
    setProblems(prev => 
      prev.map(problem => 
        problem.id === problemId 
          ? { 
              ...problem, 
              reviewCount: problem.reviewCount + 1,
              completed: true // 标记为已完成
            }
          : problem
      )
    )
    
    // 更新今日完成数量
    stats.completedToday += 1
    
    message.success('复习完成！')
    
    // 如果笔记是展开状态，收起来
    if (expandedNotes === problemId) {
      setExpandedNotes(null)
    }
  }
  // 添加取消标记功能
const handleUncompleteReview = (problemId: string) => {
  setProblems(prev => 
    prev.map(problem => 
      problem.id === problemId 
        ? { 
            ...problem, 
            reviewCount: Math.max(0, problem.reviewCount - 1), // 复习次数减1，但不能小于0
            completed: false
          }
        : problem
    )
  )
  
  stats.completedToday = Math.max(0, stats.completedToday - 1) // 今日完成数减1
  message.success('已取消完成标记')
}

  // 排序：未完成的在前，已完成的在后
  const sortedProblems = [...problems].sort((a, b) => {
    if (a.completed === b.completed) {
      return a.number - b.number // 相同状态按编号排序
    }
    return a.completed ? 1 : -1 // 未完成的排在前面
  })

  // 计算未完成的题目数量
  const uncompletedCount = problems.filter(p => !p.completed).length

  return (
    <div className={styles.container}>
      {/* 导航栏 */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <h1 className={styles.logo}>📚 LeetMemo</h1>
          <div className={styles.navRight}>
            <button 
              className={styles.addButton}
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={18} />
              添加题目
            </button>
            <Link href="/problems" className={styles.navLink}>
              所有题目
            </Link>
       
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className={styles.main}>
        {/* 统计卡片 */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#EEF2FF' }}>
              <BookOpen size={16} color="#4F46E5" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>总题目</p>
              <p className={styles.statValue}>{stats.totalProblems}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#F0FDF4' }}>
              <CheckCircle size={16} color="#10B981" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>今日完成</p>
              <p className={styles.statValue}>{stats.completedToday}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#FEF3C7' }}>
              <TrendingUp size={16} color="#F59E0B" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>连续天数</p>
              <p className={styles.statValue}>{stats.streak} 天</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#FEE2E2' }}>
              <Clock size={16} color="#EF4444" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>总复习次数</p>
              <p className={styles.statValue}>{stats.totalReviews}</p>
            </div>
          </div>
        </div>

        {/* 今日复习列表 */}
        <div className={styles.reviewSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Calendar size={24} />
              今日待复习
            </h2>
            <span className={styles.badge}>{uncompletedCount} 道题</span>
          </div>

          <div className={styles.reviewList}>
          {sortedProblems.map((problem) => (
  <div 
    key={problem.id} 
    className={`${styles.reviewCard} ${expandedNotes === problem.id ? styles.expanded : ''} ${problem.completed ? styles.completed : ''}`}
  >
    {/* 主要内容区域 */}
    <div className={styles.cardMain}>
      <div className={styles.problemInfo}>
        <span className={styles.problemNumber}>#{problem.number}</span>
        <div className={styles.problemDetails}>
          <h3 className={styles.problemTitle}>
            <a href={problem.url} target="_blank" rel="noopener noreferrer">
              {problem.title}
            </a>
          </h3>
          <div className={styles.problemMeta}>
            <span className={styles.reviewInfo}>
              第 {problem.reviewCount} 次复习
            </span>
            {problem.completed && (
              <span className={styles.completedBadge}>
                ✓ 已完成
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.cardActions}>
        <button 
          className={styles.noteButton}
          onClick={() => toggleNotePreview(problem.id)}
        >
          <BookOpen size={14} />
          预览笔记
          {expandedNotes === problem.id ? 
            <ChevronUp size={14} /> : 
            <ChevronDown size={14} />
          }
        </button>
        
        {!problem.completed ? (
          <button 
            className={styles.completeButton}
            onClick={() => handleCompleteReview(problem.id)}
          >
            <CheckCircle size={14} />
            标记完成
          </button>
        ) : (
          <button 
            className={styles.uncompleteButton}
            onClick={() => handleUncompleteReview(problem.id)}
          >
            <CheckCircle size={14} />
            取消标记
          </button>
        )}
      </div>
    </div>

    {/* 笔记预览区域 */}
    {expandedNotes === problem.id && (
      <div className={styles.notePreview}>
        <div className={styles.noteContent}>
          {problem.notes ? (
            <pre className={styles.noteText}>{problem.notes}</pre>
          ) : (
            <p className={styles.noNotes}>暂无笔记</p>
          )}
        </div>
      </div>
    )}
  </div>
))}
          </div>
        </div>
      </main>

      {/* 添加题目Modal */}
      <Modal
        title="添加新题目"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        width={500}
      >
        <AddProblemForm
          onSubmit={handleAddProblem}
          onCancel={() => setIsAddModalOpen(false)}
          loading={loading}
        />
      </Modal>
    </div>
  )
}