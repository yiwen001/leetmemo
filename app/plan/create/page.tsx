'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Calendar, Target, Clock, BookOpen, Filter, Search, CheckSquare, Square, Zap } from 'lucide-react'
import { message, DatePicker, Select, Slider, Checkbox, Spin, Input, Button } from 'antd'
import dayjs from 'dayjs'
import styles from './page.module.sass'
import { DEFAULT_PLAN_CONFIG } from '@/lib/default-study-plan'

const { Option } = Select

interface LeetCodeProblem {
  id: string
  number: number
  title: string
  titleCn: string
  difficulty: string
  category: string
  tags: string[]
  slug: string
}

export default function CreatePlanPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)

  // 计划基本信息
  const [planName, setPlanName] = useState('')
  const [duration, setDuration] = useState(30)
  const [intensity, setIntensity] = useState('medium')
  const [startDate, setStartDate] = useState(dayjs())
  
  // 题库相关状态
  const [problems, setProblems] = useState<LeetCodeProblem[]>([])
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])
  const [problemsLoading, setProblemsLoading] = useState(false)
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // 预览相关状态
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchProblems()
    }
  }, [status, router])

  // 快速选择30题速成版
  const selectSpeedRunProblems = () => {
    setSelectedProblems(DEFAULT_PLAN_CONFIG.problemSlugs)
    message.success('已选择30题速成版题目')
  }

  const fetchProblems = async () => {
    setProblemsLoading(true)
    try {
      const response = await fetch('/api/leetcode-problems')
      const result = await response.json()
      if (result.success) {
        setProblems(result.problems)
      } else {
        message.error('获取题库失败')
      }
    } catch (error) {
      console.error('获取题库失败:', error)
      message.error('获取题库失败')
    } finally {
      setProblemsLoading(false)
    }
  }

  const toggleProblemSelection = (problemSlug: string) => {
    setSelectedProblems(prev => 
      prev.includes(problemSlug) 
        ? prev.filter(slug => slug !== problemSlug)
        : [...prev, problemSlug]
    )
  }

  const handleSubmit = async () => {
    if (!planName.trim()) {
      message.error('请输入计划名称')
      return
    }

    if (!startDate) {
      message.error('请选择开始日期')
      return
    }

    if (selectedProblems.length === 0) {
      message.error('请至少选择一道题目')
      return
    }

    setLoading(true)
    try {
      const planData = {
        name: planName,
        problemSlugs: selectedProblems,
        duration,
        startDate: startDate.format('YYYY-MM-DD'),
        intensity
      }

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
        router.push('/')
      } else {
        message.error(result.error || '创建失败')
      }
    } catch (error) {
      console.error('创建学习计划失败:', error)
      message.error('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 过滤题目
  const filteredProblems = problems.filter(problem => {
    const matchesSearch = !searchQuery || 
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.titleCn.includes(searchQuery) ||
      problem.number.toString().includes(searchQuery)
    
    const matchesDifficulty = filterDifficulty === 'all' || problem.difficulty === filterDifficulty
    const matchesCategory = filterCategory === 'all' || problem.category === filterCategory
    
    return matchesSearch && matchesDifficulty && matchesCategory
  })

  const categories = [...new Set(problems.map(p => p.category))]

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button 
          type="text" 
          icon={<ArrowLeft />} 
          onClick={() => router.back()}
          className={styles.backButton}
        >
          返回
        </Button>
        <h1 className={styles.title}>创建学习计划</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.formSection}>
          {/* 计划基本信息 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>基本信息</h2>
            
            <div className={styles.field}>
              <label className={styles.label}>
                <BookOpen className={styles.labelIcon} />
                计划名称
              </label>
              <Input
                placeholder="请输入学习计划名称"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Calendar className={styles.labelIcon} />
                  开始日期
                </label>
                <DatePicker
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  className={styles.datePicker}
                  placeholder="选择开始日期"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  <Clock className={styles.labelIcon} />
                  计划天数
                </label>
                <Slider
                  min={7}
                  max={90}
                  value={duration}
                  onChange={(value) => setDuration(value)}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{duration} 天</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                <Target className={styles.labelIcon} />
                学习强度
              </label>
              <Select
                value={intensity}
                onChange={(value) => setIntensity(value)}
                className={styles.select}
              >
                <Option value="easy">轻松 (每天 1-2 题)</Option>
                <Option value="medium">适中 (每天 2-3 题)</Option>
                <Option value="hard">高强度 (每天 3-4 题)</Option>
              </Select>
            </div>
          </div>

          {/* 题目选择 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>选择题目</h2>
              <Button 
                type="primary" 
                icon={<Zap />}
                onClick={selectSpeedRunProblems}
                className={styles.speedRunButton}
              >
                30题速成版
              </Button>
            </div>

            {/* 筛选器 */}
            <div className={styles.filters}>
              <div className={styles.searchBox}>
                <Search className={styles.searchIcon} />
                <Input
                  placeholder="搜索题目名称或编号"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <Select
                value={filterDifficulty}
                onChange={setFilterDifficulty}
                className={styles.filterSelect}
                placeholder="难度"
              >
                <Option value="all">全部难度</Option>
                <Option value="easy">简单</Option>
                <Option value="medium">中等</Option>
                <Option value="hard">困难</Option>
              </Select>

              <Select
                value={filterCategory}
                onChange={setFilterCategory}
                className={styles.filterSelect}
                placeholder="分类"
              >
                <Option value="all">全部分类</Option>
                {categories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>

              <div className={styles.selectedCount}>
                已选择 {selectedProblems.length} 道题目
              </div>
            </div>

            {/* 题目列表 */}
            <div className={styles.problemList}>
              {problemsLoading ? (
                <div className={styles.loading}>
                  <Spin />
                  <span>加载题目中...</span>
                </div>
              ) : (
                <div className={styles.problemsGrid}>
                  {filteredProblems.map(problem => (
                    <div 
                      key={problem.id} 
                      className={`${styles.problemItem} ${selectedProblems.includes(problem.slug) ? styles.selected : ''}`}
                      onClick={() => toggleProblemSelection(problem.slug)}
                    >
                      <div className={styles.problemCheckbox}>
                        {selectedProblems.includes(problem.slug) ? 
                          <CheckSquare className={styles.checkedIcon} /> : 
                          <Square className={styles.uncheckedIcon} />
                        }
                      </div>
                      <div className={styles.problemInfo}>
                        <div className={styles.problemHeader}>
                          <span className={styles.problemNumber}>#{problem.number}</span>
                          <span className={styles.problemTitle}>{problem.titleCn}</span>
                          <span className={`${styles.difficulty} ${styles[problem.difficulty]}`}>
                            {problem.difficulty === 'easy' ? '简单' : 
                             problem.difficulty === 'medium' ? '中等' : '困难'}
                          </span>
                        </div>
                        <div className={styles.problemMeta}>
                          <span className={styles.problemCategory}>{problem.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 选中题目预览 */}
        {selectedProblems.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>已选择题目 ({selectedProblems.length})</h2>
              <Button 
                type="text" 
                onClick={() => setShowPreview(!showPreview)}
                className={styles.togglePreviewButton}
              >
                {showPreview ? '收起' : '展开'}
              </Button>
            </div>
            
            {showPreview && (
              <div className={styles.selectedProblemsGrid}>
                {problems
                  .filter(problem => selectedProblems.includes(problem.slug))
                  .map(problem => (
                    <div key={problem.id} className={styles.selectedProblemItem}>
                      <span className={styles.problemNumber}>#{problem.number}</span>
                      <span className={styles.problemTitle}>{problem.titleCn}</span>
                      <span className={`${styles.difficulty} ${styles[problem.difficulty]}`}>
                        {problem.difficulty === 'easy' ? '简单' : 
                         problem.difficulty === 'medium' ? '中等' : '困难'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 提交按钮 */}
        <div className={styles.submitSection}>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSubmit}
            className={styles.submitButton}
            disabled={!planName.trim() || selectedProblems.length === 0}
          >
            创建学习计划
          </Button>
        </div>
      </div>
    </div>
  )
}
