'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Calendar, Target, Clock, BookOpen, User, Settings, LogOut, Plus, Trash2, Eye, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { message, Dropdown, Spin, Modal } from 'antd'
import type { MenuProps } from 'antd'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import 'antd/dist/reset.css'
import styles from './page.module.sass'
import SettingsModal from './components/SettingsModal/SettingsModal'
import UserAvatar from './components/UserAvatar/UserAvatar'

// 导入新组件
import StudyCalendarNew from './components/StudyCalendar/StudyCalendarNew'
import PlanRecoveryModal from './components/PlanRecoveryModal/PlanRecoveryModal'

// 定义数据类型
interface Problem {
  id: string
  taskItemId: string
  number: number
  title: string
  url: string
  notes: string
  reviewCount: number
  lastReviewDate: string
  completed: boolean
  addedDate: string
  type: string
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [problems, setProblems] = useState<Problem[]>([])
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [studyPlan, setStudyPlan] = useState<any>(null)

  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true)
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false)
  const [recoveryData, setRecoveryData] = useState<any>(null)
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // 使用 useEffect 处理重定向
  useEffect(() => {
    if (status === 'loading') {
      // 认证状态加载中，不做任何操作
      return
    }

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      checkExistingPlan()
    }
  }, [status, router])

  // 检查现有计划
  const checkExistingPlan = async () => {
    setDataLoading(true)
    try {
      // 1. 从数据库查询用户是否有活跃的计划
      const response = await fetch('/api/study-plans/active')
      const result = await response.json()

      if (result.success && result.plan) {
        // 2. 有计划 -> 检查昨日任务完成情况并调整
        await checkYesterdayAndAdjust(result.plan)
      } else {
        // 3. 没有计划 -> 显示空状态，等待用户创建
        setStudyPlan(null)
        setProblems([])
        console.log('用户暂无活跃的学习计划')
      }
    } catch (error) {
      console.error('检查计划失败:', error)
      message.error('加载学习计划失败')
      setStudyPlan(null)
      setProblems([])
    } finally {
      setDataLoading(false)
    }
  }

  // 检查昨日任务并调整计划
  const checkYesterdayAndAdjust = async (plan: any) => {
    try {
      // 检查昨日任务完成情况
      const response = await fetch(`/api/study-plans/${plan.id}/check-yesterday`)
      const result = await response.json()

      if (result.success) {
        if (result.planOverloaded) {
          // 计划积压过多，询问是否恢复
          setRecoveryData({
            planId: result.planId,
            totalPendingProblems: result.totalPendingProblems,
            remainingProblems: result.remainingProblems
          })
          setIsRecoveryModalOpen(true)
          setStudyPlan(plan) // 保持计划状态，等待用户决定
          setProblems([]) // 清空任务列表
        } else if (result.planDestroyed) {
          // 计划被销毁
          setStudyPlan(null)
          setProblems([])
          message.warning('计划积压过多已自动重置，请重新制定计划')
        } else {
          // 获取今日任务
          const todayResponse = await fetch(`/api/study-plans/${plan.id}/today-tasks`)
          const todayResult = await todayResponse.json()

          // 无论今日是否有任务，都设置计划存在
          setStudyPlan(plan)
          if (todayResult.success) {
            setProblems(todayResult.tasks || [])
          } else {
            setProblems([])
          }
        }
      }
    } catch (error) {
      console.error('检查昨日任务失败:', error)
      message.error('检查任务状态失败')
    }
  }

  // 查看计划详情
  const handleViewPlanDetails = () => {
    router.push('/plan/details')
  }

  // 删除当前计划
  const handleDeletePlan = () => {
    if (!studyPlan?.id) {
      message.warning('当前没有活跃的学习计划')
      return
    }

    Modal.confirm({
      title: '确认删除学习计划',
      content: (
        <div>
          <p>确定要删除当前的学习计划吗？</p>
          <p style={{ color: '#ff4d4f', fontSize: '14px' }}>
            ⚠️ 此操作不可撤销，将删除所有相关的学习记录和进度数据。
          </p>
        </div>
      ),
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`/api/study-plans/${studyPlan.id}/delete`, {
            method: 'DELETE'
          })

          const result = await response.json()

          if (result.success) {
            message.success('学习计划删除成功')
            // 重置状态
            setStudyPlan(null)
            setProblems([])
          } else {
            message.error(result.error || '删除失败')
          }
        } catch (error) {
          console.error('删除计划失败:', error)
          message.error('删除失败，请重试')
        }
      }
    })
  }

  // 恢复计划
  const handleRecoverPlan = async (duration: number, intensity: string, startDate?: string) => {
    if (!recoveryData?.planId) return

    setRecoveryLoading(true)
    try {
      const response = await fetch(`/api/study-plans/${recoveryData.planId}/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration,
          intensity,
          startDate
        })
      })

      const result = await response.json()

      if (result.success) {
        message.success('计划恢复成功！')
        setIsRecoveryModalOpen(false)
        setRecoveryData(null)
        // 重新检查计划状态并刷新日历
        await checkExistingPlan()
        // 强制刷新页面数据
        window.location.reload()
      } else {
        message.error(result.error || '恢复计划失败')
      }
    } catch (error) {
      console.error('恢复计划失败:', error)
      message.error('恢复计划失败，请重试')
    } finally {
      setRecoveryLoading(false)
    }
  }

  // 放弃恢复，删除计划
  const handleAbandonPlan = async () => {
    if (!recoveryData?.planId) return

    try {
      const response = await fetch(`/api/study-plans/${recoveryData.planId}/delete`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        message.success('计划已删除')
        setIsRecoveryModalOpen(false)
        setRecoveryData(null)
        setStudyPlan(null)
        setProblems([])
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除计划失败:', error)
      message.error('删除失败，请重试')
    }
  }

  // 如果未认证，返回 null
  if (status === 'unauthenticated') {
    return null
  }

  // 退出登录
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
    message.success('已退出登录')
  }

  // 处理设置更新
  const handleSettingsUpdate = async (data: { name: string; image: string }) => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        // 更新成功后强制刷新session
        await fetch('/api/auth/session?update')
        window.location.reload()
      } else {
        throw new Error(result.error || '更新失败')
      }
    } catch (error) {
      console.error('更新设置失败:', error)
      throw error
    }
  }

  // 用户下拉菜单
  const userMenuItems = [
    // {
    //   key: 'profile',
    //   label: (
    //     <div className={styles.menuItem}>
    //       <User size={16} />
    //       <span>个人资料</span>
    //     </div>
    //   ),
    //   onClick: () => message.info('个人资料功能开发中...')
    // },
    {
      type: 'divider' as const
    },
    {
      key: 'settings',
      label: (
        <div className={styles.menuItem}>
          <Settings size={16} />
          <span>设置</span>
        </div>
      ),
      onClick: () => setIsSettingsModalOpen(true)
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

  // 创建新计划
  const handleCreatePlan = () => {
    router.push('/plan/create')
  }

  // 切换笔记预览
  const toggleNotePreview = (problemId: string) => {
    setExpandedNotes(expandedNotes === problemId ? null : problemId)
    setEditingNotes(null) // 关闭编辑模式
  }

  // 开始编辑笔记
  const startEditingNotes = (problemId: string, currentNotes: string) => {
    setEditingNotes(problemId)
    setNoteText(currentNotes)
  }

  // 保存笔记
  const saveNotes = async (problemId: string) => {
    if (!studyPlan?.id) return

    try {
      const response = await fetch(`/api/study-plans/${studyPlan.id}/update-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemId: problemId.split('-').slice(2).join('-'), // 从复合ID中提取problemId
          notes: noteText
        })
      })

      const result = await response.json()

      if (result.success) {
        // 更新本地状态
        setProblems(prev =>
          prev.map(p =>
            p.id === problemId ? { ...p, notes: noteText } : p
          )
        )

        message.success('笔记保存成功！')
        setEditingNotes(null)
      } else {
        message.error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存笔记失败:', error)
      message.error('保存失败，请重试')
    }
  }

  // 标记完成复习
  const handleCompleteReview = async (problemId: string) => {
    if (!studyPlan?.id) return

    const problem = problems.find(p => p.id === problemId)
    if (!problem) return

    try {
      const response = await fetch(`/api/study-plans/${studyPlan.id}/complete-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskItemId: problem.taskItemId
        })
      })

      const result = await response.json()

      if (result.success) {
        // 更新本地状态 - 只修改今日任务完成状态，不影响学习历史
        setProblems(prev =>
          prev.map(p =>
            p.id === problemId
              ? {
                  ...p,
                  completed: true  // 只标记今日任务完成，reviewCount由后端管理
                }
              : p
          )
        )

        message.success('复习完成！')

        if (expandedNotes === problemId) {
          setExpandedNotes(null)
        }
      } else {
        message.error(result.error || '标记失败')
      }
    } catch (error) {
      console.error('标记完成失败:', error)
      message.error('标记失败，请重试')
    }
  }

  // 取消标记功能
  const handleUncompleteReview = async (problemId: string) => {
    if (!studyPlan?.id) return

    const problem = problems.find(p => p.id === problemId)
    if (!problem) return

    try {
      const response = await fetch(`/api/study-plans/${studyPlan.id}/complete-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskItemId: problem.taskItemId,
          completed: false  // 取消完成标记
        })
      })

      const result = await response.json()

      if (result.success) {
        // 更新本地状态
        setProblems(prev => 
          prev.map(p => 
            p.id === problemId 
              ? { 
                  ...p, 
                  completed: false
                }
              : p
          )
        )

        message.success('已取消完成标记')
      } else {
        message.error(result.error || '取消标记失败')
      }
    } catch (error) {
      console.error('取消标记失败:', error)
      message.error('取消标记失败，请重试')
    }
  }

  // 排序：未完成的在前，已完成的在后
  const sortedProblems = [...problems].sort((a, b) => {
    if (a.completed === b.completed) {
      return a.number - b.number
    }
    return a.completed ? 1 : -1
  })

  // 如果正在加载认证状态或未认证，显示加载页面
  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        正在加载...
      </div>
    )
  }

  // 计算统计数据
  const completedProblems = problems.filter(p => p.completed).length
  const totalProblems = studyPlan?.planProblems?.length || 0
  const todayTarget = problems.length
  const uncompletedCount = problems.filter(p => !p.completed).length

  // 基于天数的进度数据
  const totalDays = studyPlan?.totalDays || 0
  const completedDays = studyPlan?.completedDays || 0
  const dayBasedProgress = studyPlan?.dayBasedProgress || 0

  return (
    <div className={styles.container}>
      {/* 导航栏 */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <h1 className={styles.logo}><img src="/lemon4.svg" style={{ width: 28, height: 28, marginRight: 8, verticalAlign: 'middle' }} /> LeetMemo</h1>
          <div className={styles.navRight}>
            <button 
              className={styles.addButton}
              onClick={handleViewPlanDetails}
            >
              <Target size={18} />
              计划详情
            </button>
            <Link href="/problems" className={styles.navLink}>
              学习历史
            </Link>
            {/* 用户信息 */}
            <Dropdown 
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className={styles.userProfile}>
                <UserAvatar
                  image={session?.user?.image}
                  name={session?.user?.name}
                  size={40}
                  className={styles.userAvatar}
                />
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
        {/* 进度统计 */}
        {/* 简化的进度显示 */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>学习进度</h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '12px'
          }}>
            <div style={{
              flex: 1,
              height: '8px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#10b981',
                width: `${dayBasedProgress}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#374151',
              minWidth: '80px'
            }}>
              {completedDays} / {totalDays} 天
            </span>
          </div>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            已完成 {dayBasedProgress.toFixed(1)}%
          </p>
        </div>

        {/* 学习日历 - 可折叠 */}
        {studyPlan && (
          <div className={`${styles.calendarSection} ${!isCalendarExpanded ? styles.collapsed : ''}`}>
            <div 
              className={styles.sectionHeader} 
              onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
              style={{ cursor: 'pointer' }}
            >
              <h2 className={styles.sectionTitle}>
                <Calendar size={24} />
                学习日历
              </h2>
              <div className={styles.sectionMeta}>
                <span className={styles.calendarDescription}>
                  点击展开/收起
                </span>
                {isCalendarExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>
            
            {isCalendarExpanded && <StudyCalendarNew planId={studyPlan?.id || null} />}
          </div>
        )}

        {/* 今日复习列表 */}
        <div className={styles.reviewSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Calendar size={24} />
              今日学习任务
            </h2>
            <div className={styles.sectionMeta}>
              <span className={styles.badge}>
                {dataLoading ? '...' : studyPlan ? `${uncompletedCount} 道待完成` : '暂无计划'}
              </span>
              {studyPlan && (
                <span className={styles.planInfo}>
                  {studyPlan.duration}天学习计划
                </span>
              )}
            </div>
    
          </div>

          <div className={styles.reviewList}>
            {dataLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}>加载中...</div>
              </div>
            ) : !studyPlan ? (
              <div className={styles.emptyState}>
                <Target size={48} color="#ccc" />
                <h3>还没有学习计划</h3>
                <p>创建一个学习计划开始你的刷题之旅吧！</p>
                <button 
                  className={styles.addFirstButton}
                  onClick={handleCreatePlan}
                >
                  <Plus size={16} />
                  创建第一个计划
                </button>
              </div>
            ) : sortedProblems.length === 0 ? (
              <div className={styles.emptyState}>
                <Calendar size={48} color="#52c41a" />
                <h3>今日暂无学习任务</h3>
                <p>休息一下，明天继续加油！</p>
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
                            {problem.reviewCount === 0 ? '新题目' : `第 ${problem.reviewCount} 次复习`}
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
                        {problem.notes ? '查看笔记' : '添加笔记'}
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
                        {editingNotes === problem.id ? (
                          // 编辑模式
                          <div>
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="在这里记录你的解题思路、遇到的问题、学到的知识点..."
                              style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                              }}
                            />
                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => saveNotes(problem.id)}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: '#1890ff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingNotes(null)}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: '#f5f5f5',
                                  color: '#666',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          // 预览模式
                          <>
                            {problem.notes ? (
                              <div>
                                <div className={`  ${styles.notesMarkdown}`}>
                                  <ReactMarkdown
                                    rehypePlugins={[rehypeSanitize, rehypeRaw]}
                                    remarkPlugins={[remarkGfm]}
                                  >
                                    {problem.notes}
                                  </ReactMarkdown>
                                </div>
                                <button
                                  onClick={() => startEditingNotes(problem.id, problem.notes)}
                                  style={{
                                    marginTop: '8px',
                                    padding: '4px 12px',
                                    backgroundColor: '#f5f5f5',
                                    color: '#666',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  编辑笔记
                                </button>
                              </div>
                            ) : (
                              <div className={styles.noNotes}>
                                <p>暂无笔记</p>
                                <button
                                  className={styles.addNoteButton}
                                  onClick={() => startEditingNotes(problem.id, '')}
                                >
                                  <Plus size={14} />
                                  添加学习笔记
                                </button>
                              </div>
                            )}
                          </>
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


      {/* 计划恢复Modal */}
      <PlanRecoveryModal
        visible={isRecoveryModalOpen}
        onClose={handleAbandonPlan}
        onRecover={handleRecoverPlan}
        loading={recoveryLoading}
        remainingProblems={recoveryData?.remainingProblems || 0}
      />

      {/* 设置弹窗 */}
      <SettingsModal
        visible={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={{
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          image: session?.user?.image || ''
        }}
        onUpdate={handleSettingsUpdate}
      />
    </div>
  )
}
