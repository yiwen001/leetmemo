'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, BookOpen, CheckCircle, Clock, TrendingUp, ChevronDown, ChevronUp, User, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { Modal, message, Dropdown } from 'antd'
import styles from './page.module.sass'
import AddProblemForm from './components/problems/AddProblemForm'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import 'antd/dist/reset.css'

// 定义数据类型
interface Problem {
  id: string
  number: number
  title: string
  url: string
  notes: string
  reviewCount: number
  lastReviewDate: string
  completed: boolean
  addedDate: string
}

interface Stats {
  totalProblems: number
  completedToday: number
  streak: number
  totalReviews: number
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [problems, setProblems] = useState<Problem[]>([])
  const [stats, setStats] = useState<Stats>({
    totalProblems: 0,
    completedToday: 0,
    streak: 0,
    totalReviews: 0,
  })
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  // 使用 useEffect 处理重定向
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

 

  const fetchData = async () => {
    if (!session?.user?.email) return
    
    setDataLoading(true)
    const startTime = Date.now()
    
    try {
      console.log('开始获取数据...')
      
      const response = await fetch('/api/problems/simple', {
        headers: {
          'x-user-email': session.user.email
        }
      })
      
      const fetchTime = Date.now() - startTime
      console.log(`前端请求耗时: ${fetchTime}ms`)
  
      if (response.ok) {
        const data = await response.json()
        console.log('API调试信息:', data.debug)
        
        setProblems(data.reviews || [])
        setStats(data.stats || {
          totalProblems: 0,
          completedToday: 0,
          streak: 0,
          totalReviews: 0,
        })
      } else {
        message.error('获取数据失败')
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error('获取数据失败')
    } finally {
      const totalTime = Date.now() - startTime
      console.log(`前端总耗时: ${totalTime}ms`)
      setDataLoading(false)
    }
  }

   

  // 如果未认证，返回 null（重定向由 useEffect 处理）
  if (status === 'unauthenticated') {
    return null
  }

  // 退出登录
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
    message.success('已退出登录')
  }

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div className={styles.menuItem}>
          <User size={16} />
          <span>个人资料</span>
        </div>
      ),
      onClick: () => {
        message.info('个人资料功能开发中...')
      }
    },
    {
      key: 'settings',
      label: (
        <div className={styles.menuItem}>
          <Settings size={16} />
          <span>设置</span>
        </div>
      ),
      onClick: () => {
        message.info('设置功能开发中...')
      }
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      label: (
        <div className={styles.menuItem}>
          <LogOut size={16} />
          <span>退出登录</span>
        </div>
      ),
      onClick: handleSignOut
    }
  ]

  const handleAddProblem = async (problemData: any) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(problemData),
      })

      const result = await response.json()

      if (response.ok) {
        message.success(`题目"${result.problem.title}"添加成功！`)
        setIsAddModalOpen(false)
        
        // 重新获取数据
        await fetchData()
      } else {
        message.error(result.error || '添加题目失败')
      }
    } catch (error) {
      console.error('添加题目错误:', error)
      message.error('添加题目失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 切换笔记预览
  const toggleNotePreview = (problemId: string) => {
    setExpandedNotes(expandedNotes === problemId ? null : problemId)
  }

  // 标记完成复习（暂时只更新本地状态）
  const handleCompleteReview = (problemId: string) => {
    setProblems(prev => 
      prev.map(problem => 
        problem.id === problemId 
          ? { 
              ...problem, 
              reviewCount: problem.reviewCount + 1,
              completed: true
            }
          : problem
      )
    )
    
    message.success('复习完成！')
    
    if (expandedNotes === problemId) {
      setExpandedNotes(null)
    }
  }

  // 取消标记功能
  const handleUncompleteReview = (problemId: string) => {
    setProblems(prev => 
      prev.map(problem => 
        problem.id === problemId 
          ? { 
              ...problem, 
              reviewCount: Math.max(0, problem.reviewCount - 1),
              completed: false
            }
          : problem
      )
    )
    
    message.success('已取消完成标记')
  }

  // 排序：未完成的在前，已完成的在后
  const sortedProblems = [...problems].sort((a, b) => {
    if (a.completed === b.completed) {
      return a.number - b.number
    }
    return a.completed ? 1 : -1
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
            {/* 用户信息 */}
            <Dropdown 
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className={styles.userProfile}>
                <div className={styles.userAvatar}>
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className={styles.avatarImage}
                    />
                  ) : (
                    <User size={20} />
                  )}   
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>
                    {session?.user?.name || session?.user?.email || 'User'}
                  </div>
                  <ChevronDown size={16} className={styles.dropdownIcon} />
                </div>
              </div>
            </Dropdown>
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
              <p className={styles.statValue}>
                {dataLoading ? '...' : stats.totalProblems}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#F0FDF4' }}>
              <CheckCircle size={16} color="#10B981" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>今日完成</p>
              <p className={styles.statValue}>
                {dataLoading ? '...' : stats.completedToday}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#FEF3C7' }}>
              <TrendingUp size={16} color="#F59E0B" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>连续天数</p>
              <p className={styles.statValue}>
                {dataLoading ? '...' : stats.streak} 天
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#FEE2E2' }}>
              <Clock size={16} color="#EF4444" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>总复习次数</p>
              <p className={styles.statValue}>
                {dataLoading ? '...' : stats.totalReviews}
              </p>
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
            <span className={styles.badge}>
              {dataLoading ? '...' : `${uncompletedCount} 道题`}
            </span>
          </div>

          <div className={styles.reviewList}>
            {dataLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}>加载中...</div>
              </div>
            ) : sortedProblems.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen size={48} color="#ccc" />
                <h3>还没有题目</h3>
                <p>点击"添加题目"开始你的复习计划吧！</p>
                <button 
                  className={styles.addFirstButton}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus size={16} />
                  添加第一道题目
                </button>
              </div>
            ) : (
              sortedProblems.map((problem) => (
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
              ))
            )}
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