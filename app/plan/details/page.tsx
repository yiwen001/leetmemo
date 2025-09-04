'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Calendar, Target, Clock, BookOpen, Trash2, Plus, ExternalLink } from 'lucide-react'
import { message, Modal, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import styles from './page.module.sass'

interface PlanDetailsData {
  plan: {
    id: string
    name: string
    duration: number
    intensity: string
    startDate: string
    status: string
    createdAt: string
  }
  totalProblems: number
  completedProblems: number
  remainingProblems: number
  progress: number
  dailyTarget: number
  estimatedCompletion: string
  problems: Array<{
    id: string
    number: number
    title: string
    difficulty: string
    category: string
    url: string
    completed: boolean
    reviewCount: number
    lastReviewDate: string | null
    notes: string
  }>
  dailySchedule: Array<{
    day: number
    date: string
    status: string
    newProblems: Array<{
      id: string
      number: number
      title: string
      difficulty: string
      url: string
      completed: boolean
      notes: string
    }>
    reviewProblems: Array<{
      id: string
      number: number
      title: string
      difficulty: string
      url: string
      completed: boolean
      reviewCount: number
      notes: string
    }>
    totalProblems: number
    completedProblems: number
  }>
}

export default function PlanDetailsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [data, setData] = useState<PlanDetailsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchPlanDetails()
    }
  }, [status, router])

  const fetchPlanDetails = async () => {
    setLoading(true)
    try {
      // 先获取活跃计划
      const activeResponse = await fetch('/api/study-plans/active')
      const activeResult = await activeResponse.json()

      if (!activeResult.success || !activeResult.plan) {
        // 没有活跃计划
        setData(null)
        setLoading(false)
        return
      }

      // 获取计划详情
      const detailsResponse = await fetch(`/api/study-plans/${activeResult.plan.id}/details`)
      const detailsResult = await detailsResponse.json()

      if (detailsResult.success) {
        setData(detailsResult.data)
      } else {
        message.error(detailsResult.error || '获取计划详情失败')
      }
    } catch (error) {
      console.error('获取计划详情失败:', error)
      message.error('获取计划详情失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlan = () => {
    if (!data?.plan?.id) {
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
          const response = await fetch(`/api/study-plans/${data.plan.id}/delete`, {
            method: 'DELETE'
          })

          const result = await response.json()

          if (result.success) {
            message.success('学习计划删除成功')
            router.push('/')
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

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => router.push('/')}
          >
            <ArrowLeft size={20} />
            返回首页
          </button>
          <h1>计划详情</h1>
        </div>

        <div className={styles.emptyState}>
          <Target size={64} color="#ccc" />
          <h2>暂无学习计划</h2>
          <p>您还没有创建学习计划，立即创建一个开始学习吧！</p>
          <button 
            className={styles.createButton}
            onClick={() => router.push('/plan/create')}
          >
            <Plus size={16} />
            创建学习计划
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
        >
          <ArrowLeft size={20} />
          返回首页
        </button>
        <h1>计划详情</h1>
        <button 
          className={styles.deleteButton}
          onClick={handleDeletePlan}
        >
          <Trash2 size={16} />
          删除计划
        </button>
      </div>

      <div className={styles.content}>
        {/* 计划基本信息 */}
        <div className={styles.planInfo}>
          <div className={styles.planHeader}>
            <h2>{data.plan.name}</h2>
            <span className={`${styles.statusBadge} ${styles[data.plan.status]}`}>
              {data.plan.status === 'active' ? '进行中' : 
               data.plan.status === 'completed' ? '已完成' : '已暂停'}
            </span>
          </div>
          
          <div className={styles.planMeta}>
            <div className={styles.metaItem}>
              <Calendar size={16} />
              <span>开始日期: {new Date(data.plan.startDate).toLocaleDateString()}</span>
            </div>
            <div className={styles.metaItem}>
              <Clock size={16} />
              <span>计划时长: {data.plan.duration} 天</span>
            </div>
            <div className={styles.metaItem}>
              <Target size={16} />
              <span>学习强度: {
                data.plan.intensity === 'easy' ? '轻松' :
                data.plan.intensity === 'medium' ? '适中' : '高强度'
              }</span>
            </div>
          </div>
        </div>

        {/* 进度统计 */}
        <div className={styles.progressSection}>
          <h3>学习进度</h3>
          {/* <div className={styles.progressStats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{data.completedProblems}</div>
              <div className={styles.statLabel}>已完成</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{data.remainingProblems}</div>
              <div className={styles.statLabel}>剩余题目</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{data.totalProblems}</div>
              <div className={styles.statLabel}>总题目</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{(data.progress || 0).toFixed(1)}%</div>
              <div className={styles.statLabel}>完成率</div>
            </div>
          </div> */}

          <div className={styles.progressBar}>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressFill}
                style={{ width: `${data.progress || 0}%` }}
              ></div>
            </div>
            <div className={styles.progressText}>
              {data.completedProblems} / {data.totalProblems} 题已完成
            </div>
          </div>
        </div>

        {/* 学习计划表 */}
        <div className={styles.problemsSection}>
          <h3>学习计划表</h3>
          <Table
            dataSource={data.dailySchedule || []}
            rowKey="day"
            pagination={{ pageSize: 15, showSizeChanger: true, showQuickJumper: true }}
            scroll={{ x: 1200 }}
            columns={[
              {
                title: '日期',
                dataIndex: 'date',
                key: 'date',
                width: 120,
                fixed: 'left',
                sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                render: (date, record) => (
                  <div style={{ fontWeight: 500 }}>
                    <div>{new Date(date).toLocaleDateString()}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>第{record.day}天</div>
                  </div>
                )
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 100,
                filters: [
                  { text: '已完成', value: 'completed' },
                  { text: '部分完成', value: 'partial' },
                  { text: '待完成', value: 'pending' },
                  { text: '已逾期', value: 'overdue' }
                ],
                onFilter: (value, record) => record.status === value,
                render: (status) => {
                  const statusMap = {
                    'completed': { color: 'success', text: '已完成' },
                    'partial': { color: 'warning', text: '部分完成' },
                    'pending': { color: 'default', text: '待完成' },
                    'overdue': { color: 'error', text: '已逾期' }
                  }
                  const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
                  return <Tag color={config.color}>{config.text}</Tag>
                }
              },
              {
                title: '进度',
                key: 'progress',
                width: 100,
                render: (_, record) => (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 500 }}>
                      {record.completedProblems}/{record.totalProblems}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {record.totalProblems > 0 ? Math.round((record.completedProblems / record.totalProblems) * 100) : 0}%
                    </div>
                  </div>
                )
              },
              {
                title: '新题目',
                dataIndex: 'newProblems',
                key: 'newProblems',
                width: 300,
                render: (problems) => (
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {problems.map((problem: any, index: number) => (
                      <div key={problem.id} style={{ 
                        marginBottom: '4px', 
                        padding: '2px 0',
                        borderBottom: index < problems.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <a 
                          href={problem.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: problem.completed ? '#059669' : '#1f2937',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>#{problem.number}</span>
                          <span>{problem.title}</span>
                          <ExternalLink size={10} />
                          {problem.completed && <span style={{ color: '#059669' }}>✓</span>}
                        </a>
                        <Tag 
                          color={
                            problem.difficulty === 'easy' ? 'green' :
                            problem.difficulty === 'medium' ? 'orange' : 'red'
                          }
                          style={{ fontSize: '10px', marginTop: '2px' }}
                        >
                          {problem.difficulty === 'easy' ? '简单' :
                           problem.difficulty === 'medium' ? '中等' : '困难'}
                        </Tag>
                      </div>
                    ))}
                    {problems.length === 0 && <span style={{ color: '#9ca3af' }}>无新题目</span>}
                  </div>
                )
              },
              {
                title: '复习题目',
                dataIndex: 'reviewProblems',
                key: 'reviewProblems',
                width: 300,
                render: (problems) => (
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {problems.map((problem: any, index: number) => (
                      <div key={problem.id} style={{ 
                        marginBottom: '4px', 
                        padding: '2px 0',
                        borderBottom: index < problems.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <a 
                          href={problem.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: problem.completed ? '#059669' : '#1f2937',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>#{problem.number}</span>
                          <span>{problem.title}</span>
                          <ExternalLink size={10} />
                          {problem.completed && <span style={{ color: '#059669' }}>✓</span>}
                        </a>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                          <Tag 
                            color={
                              problem.difficulty === 'easy' ? 'green' :
                              problem.difficulty === 'medium' ? 'orange' : 'red'
                            }
                            style={{ fontSize: '10px' }}
                          >
                            {problem.difficulty === 'easy' ? '简单' :
                             problem.difficulty === 'medium' ? '中等' : '困难'}
                          </Tag>
                          <Tag color="blue" style={{ fontSize: '10px' }}>
                            复习{problem.reviewCount || 0}次
                          </Tag>
                        </div>
                      </div>
                    ))}
                    {problems.length === 0 && <span style={{ color: '#9ca3af' }}>无复习题目</span>}
                  </div>
                )
              }
            ] as ColumnsType<any>}
            rowClassName={(record) => {
              if (record.status === 'completed') return styles.completedRow
              if (record.status === 'overdue') return styles.overdueRow
              return ''
            }}
          />
        </div>

        {/* 学习建议 */}
        {/* <div className={styles.suggestionsSection}>
          <h3>学习建议</h3>
          <div className={styles.suggestions}>
            <div className={styles.suggestionItem}>
              <BookOpen size={16} />
              <span>每日目标: {data.dailyTarget || 0} 道题</span>
            </div>
            <div className={styles.suggestionItem}>
              <Calendar size={16} />
              <span>预计完成: {data.estimatedCompletion || '未知'}</span>
            </div>
            {(data.progress || 0) < 30 && (
              <div className={styles.suggestionItem}>
                <Target size={16} />
                <span>建议: 保持每日学习节奏，养成良好习惯</span>
              </div>
            )}
            {(data.progress || 0) >= 30 && (data.progress || 0) < 70 && (
              <div className={styles.suggestionItem}>
                <Target size={16} />
                <span>建议: 进度良好，可以适当增加复习频率</span>
              </div>
            )}
            {(data.progress || 0) >= 70 && (
              <div className={styles.suggestionItem}>
                <Target size={16} />
                <span>建议: 即将完成，坚持到底！</span>
              </div>
            )}
          </div>
        </div> */}
      </div>
    </div>
  )
}
