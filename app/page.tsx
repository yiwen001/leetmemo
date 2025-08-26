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
import CreatePlanModal from './components/CreatePlanModal/page'
import ProgressStats from './components/ProgressStats/ProgressStats'
import { StudyPlanGenerator } from '../lib/study-plan-generator'
import { DEFAULT_PLAN_CONFIG } from '../lib/default-study-plan'
import StudyCalendar from './components/StudyCalendar/page'

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
  const [loading, setLoading] = useState(false)
  const [problems, setProblems] = useState<Problem[]>([])
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [studyPlan, setStudyPlan] = useState<any>(null)
  const [generator] = useState(new StudyPlanGenerator())

  // 使用 useEffect 处理重定向
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      initializeDefaultPlan()
    }
  }, [status, router])

  // 初始化默认学习计划
  const initializeDefaultPlan = () => {
    setDataLoading(true)
    try {
      // 生成默认的30天19题计划
      const plan = generator.generatePlan(DEFAULT_PLAN_CONFIG)
      setStudyPlan(plan)
      
      // 获取今日任务
      const todayTasks = generator.getTodayTasks(plan.dailyPlans)
      if (todayTasks) {
        // 转换为旧格式以兼容现有组件
        const todayProblems = [
          ...todayTasks.newProblems.map((p, index) => ({
            id: p.id || `new-${index}`,
            number: index + 1,
            title: p.name,
            url: p.url,
            notes: '',
            reviewCount: 0,
            lastReviewDate: todayTasks.date,
            completed: false,
            addedDate: todayTasks.date
          })),
          ...todayTasks.reviewProblems.map((p, index) => ({
            id: p.id || `review-${index}`,
            number: todayTasks.newProblems.length + index + 1,
            title: p.name,
            url: p.url,
            notes: '',
            reviewCount: 1,
            lastReviewDate: todayTasks.date,
            completed: false,
            addedDate: todayTasks.date
          }))
        ]
        setProblems(todayProblems)
      }
    } catch (error) {
      console.error('初始化学习计划失败:', error)
      message.error('初始化学习计划失败')
    } finally {
      setDataLoading(false)
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

   // 创建新计划
   const handleCreatePlan = async (planData: any) => {
    setLoading(true)
    try {
      // 生成新的学习计划
      const newPlan = generator.generatePlan({
        problems: planData.problems,
        duration: planData.duration,
        startDate: planData.startDate,
        intensity: planData.intensity
      })
      
      setStudyPlan(newPlan)
      
      // 获取今日任务
      const todayTasks = generator.getTodayTasks(newPlan.dailyPlans)
      if (todayTasks) {
        const todayProblems = [
          ...todayTasks.newProblems.map((p, index) => ({
            id: p.id || `new-${index}`,
            number: index + 1,
            title: p.name,
            url: p.url,
            notes: '',
            reviewCount: 0,
            lastReviewDate: todayTasks.date,
            completed: false,
            addedDate: todayTasks.date
          })),
          ...todayTasks.reviewProblems.map((p, index) => ({
            id: p.id || `review-${index}`,
            number: todayTasks.newProblems.length + index + 1,
            title: p.name,
            url: p.url,
            notes: '',
            reviewCount: 1,
            lastReviewDate: todayTasks.date,
            completed: false,
            addedDate: todayTasks.date
          }))
        ]
        setProblems(todayProblems)
      }
      
      setIsCreatePlanModalOpen(false)
      message.success(`学习计划"${planData.name}"创建成功！`)
      
    } catch (error) {
      console.error('创建计划错误:', error)
      message.error('创建计划失败，请重试')
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
              onClick={() => setIsCreatePlanModalOpen(true)}
            >
              <Target size={18} />
              新建计划
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
        {/* 进度统计 */}
        <ProgressStats
          totalProblems={totalProblems}
          completedProblems={completedProblems}
          todayCompleted={completedProblems}
          todayTarget={todayTarget}
          streak={7} // 临时数据
          loading={dataLoading}
        />

        {/* 今日复习列表 */}
        <div className={styles.reviewSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Calendar size={24} />
              今日学习任务
            </h2>
            <div className={styles.sectionMeta}>
              <span className={styles.badge}>
                {dataLoading ? '...' : `${uncompletedCount} 道待完成`}
              </span>
              {studyPlan && (
                <span className={styles.planInfo}>
                  {studyPlan.projectInfo.intensity === 'easy' && '轻松模式'}
                  {studyPlan.projectInfo.intensity === 'medium' && '中等强度'}
                  {studyPlan.projectInfo.intensity === 'hard' && '高强度'}
                  · {studyPlan.projectInfo.duration}天计划
                </span>
              )}
            </div>
    
          </div>

          <div className={styles.reviewList}>
            {dataLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}>加载中...</div>
              </div>
            ) : sortedProblems.length === 0 ? (
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
                        {problem.notes ? (
                          <pre className={styles.noteText}>{problem.notes}</pre>
                        ) : (
                          <div className={styles.noNotes}>
                            <p>暂无笔记</p>
                            <button className={styles.addNoteButton}>
                              <Plus size={14} />
                              添加学习笔记
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
          {/* 学习日历 - 新添加的部分 */}
          {studyPlan && (
          <div className={styles.calendarSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Calendar size={24} />
                学习日历
              </h2>
              <span className={styles.calendarDescription}>
                点击日期查看详细学习任务
              </span>
            </div>
            
            <StudyCalendar dailyPlans={studyPlan.dailyPlans} />
          </div>
        )}
      </main>

      {/* 创建计划Modal */}
      <CreatePlanModal
        open={isCreatePlanModalOpen}
        onCancel={() => setIsCreatePlanModalOpen(false)}
        onSubmit={handleCreatePlan}
        loading={loading}
      />
    </div>
  )
}