'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, BookOpen, ChevronDown, ChevronUp, User, LogOut, Settings, Target, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Modal, message, Dropdown } from 'antd'
import styles from './page.module.sass'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import 'antd/dist/reset.css'

// 导入新组件
import CreatePlanModalNew from './components/CreatePlanModal/CreatePlanModalNew'
import PlanDetailsModal from './components/PlanDetailsModal/PlanDetailsModal'
import ProgressStats from './components/ProgressStats/ProgressStats'
import StudyCalendarNew from './components/StudyCalendar/StudyCalendarNew'

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

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false)
  const [isPlanDetailsModalOpen, setIsPlanDetailsModalOpen] = useState(false)
  const [planDetailsData, setPlanDetailsData] = useState(null)
  const [planDetailsLoading, setPlanDetailsLoading] = useState(false)
  const [createPlanLoading, setCreatePlanLoading] = useState(false)
  const [problems, setProblems] = useState<Problem[]>([])
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [studyPlan, setStudyPlan] = useState<any>(null)

  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true)

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
        if (result.planDestroyed) {
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
  const handleViewPlanDetails = async () => {
    setIsPlanDetailsModalOpen(true)
    
    if (!studyPlan?.id) {
      // 没有计划时显示空状态的详情页
      setPlanDetailsData(null)
      setPlanDetailsLoading(false)
      return
    }

    setPlanDetailsLoading(true)

    try {
      const response = await fetch(`/api/study-plans/${studyPlan.id}/details`)
      const result = await response.json()

      if (result.success) {
        setPlanDetailsData(result.data)
      } else {
        message.error(result.error || '获取计划详情失败')
        setIsPlanDetailsModalOpen(false)
      }
    } catch (error) {
      console.error('获取计划详情失败:', error)
      message.error('获取计划详情失败，请重试')
      setIsPlanDetailsModalOpen(false)
    } finally {
      setPlanDetailsLoading(false)
    }
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

  // 如果未认证，返回 null
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
      onClick: () => message.info('个人资料功能开发中...')
    },
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
      onClick: () => message.info('设置功能开发中...')
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
  const handleCreatePlan = async (planData: any) => {
    setCreatePlanLoading(true)
    try {
      const response = await fetch('/api/study-plans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData)
      })

      const result = await response.json()

      if (result.success) {
        message.success('学习计划创建成功！')
        setIsCreatePlanModalOpen(false)
        // 重新检查计划状态
        await checkExistingPlan()
      } else {
        message.error(result.error || '创建计划失败')
      }
    } catch (error) {
      console.error('创建计划失败:', error)
      message.error('创建计划失败，请重试')
    } finally {
      setCreatePlanLoading(false)
    }
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
          taskId: problem.id.split('-')[0], // 从复合ID中提取taskId
          problemId: problem.id.split('-').slice(2).join('-'), // 从复合ID中提取problemId
          type: problem.reviewCount === 0 ? 'new' : 'review'
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
                  reviewCount: p.reviewCount + 1,
                  completed: true
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
  const totalProblems = studyPlan?.projectInfo?.totalProblems || 0
  const todayTarget = problems.length
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
              onClick={() => handleViewPlanDetails()}
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
        {/* 进度统计 */}
        <ProgressStats
          totalProblems={totalProblems}
          completedProblems={completedProblems}
          todayCompleted={completedProblems}
          todayTarget={todayTarget}
          streak={7} // 临时数据
          loading={dataLoading}
        />

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
                  onClick={() => setIsCreatePlanModalOpen(true)}
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
                                <pre className={styles.noteText}>{problem.notes}</pre>
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

      {/* 创建计划Modal */}
      <CreatePlanModalNew
        open={isCreatePlanModalOpen}
        onCancel={() => setIsCreatePlanModalOpen(false)}
        onSubmit={handleCreatePlan}
        loading={createPlanLoading}
      />

      {/* 计划详情Modal */}
      <PlanDetailsModal
        visible={isPlanDetailsModalOpen}
        onClose={() => {
          setIsPlanDetailsModalOpen(false)
          setPlanDetailsData(null)
        }}
        data={planDetailsData}
        loading={planDetailsLoading}
        onDeletePlan={handleDeletePlan}
        onCreatePlan={() => setIsCreatePlanModalOpen(true)}
      />
    </div>
  )
}