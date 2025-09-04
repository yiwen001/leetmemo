'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Calendar, Target, Clock, BookOpen, Plus, Filter } from 'lucide-react'
import { message, DatePicker, Select, Slider, Radio, Checkbox, Spin, Input, Button } from 'antd'
import dayjs from 'dayjs'
import styles from './page.module.sass'

const { Option } = Select

interface LeetCodeProblem {
  id: string
  number: number
  title: string
  titleCn: string
  difficulty: string
  category: string
  tags: string[]
}

export default function CreatePlanPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)

  // 计划基本信息
  const [planMode, setPlanMode] = useState<'default' | 'custom'>('default')
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
  
  // 手动添加题目相关状态
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProblem, setNewProblem] = useState({
    url: '',
    title: '',
    titleCn: '',
    difficulty: 'medium',
    category: 'Array',
    number: ''
  })
  const [addingProblem, setAddingProblem] = useState(false)
  
  // 预览相关状态
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && planMode === 'custom') {
      fetchProblems()
    }
  }, [status, router, planMode])

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

  // 从URL解析题目标题
  const parseTitle = (url: string) => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const match = pathname.match(/\/problems\/([^\/]+)/)
      if (match) {
        return match[1].split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }
    } catch (e) {
      // 无效URL
    }
    return ''
  }

  // 从URL解析题目slug
  const parseSlug = (url: string) => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const match = pathname.match(/\/problems\/([^\/]+)/)
      if (match) {
        return match[1] // 返回slug，如 "two-sum" 或 "1-two-sum"
      }
    } catch (e) {
      // 无效URL
    }
    return ''
  }

  // 从URL解析题目编号
  const parseNumber = (url: string) => {
    try {
      const slug = parseSlug(url)
      if (slug) {
        // 尝试从slug中提取数字，如果没有则返回null
        const numberMatch = slug.match(/^(\d+)/)
        return numberMatch ? parseInt(numberMatch[1]) : null
      }
    } catch (e) {
      // 无效URL
    }
    return null
  }

  // 处理URL变化
  const handleUrlChange = (url: string) => {
    const parsedNumber = url ? parseNumber(url) : null
    setNewProblem(prev => ({
      ...prev,
      url,
      title: url ? parseTitle(url) : prev.title,
      number: parsedNumber ? parsedNumber.toString() : ''
    }))
  }

  // 手动添加题目
  const handleAddProblem = async () => {
    if (!newProblem.url) {
      message.error('请填写题目链接')
      return
    }

    setAddingProblem(true)
    try {
      const response = await fetch('/api/leetcode-problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slug: parseSlug(newProblem.url),
          url: newProblem.url,
          title: newProblem.title || parseTitle(newProblem.url),
          titleCn: newProblem.titleCn || newProblem.title || parseTitle(newProblem.url),
          difficulty: newProblem.difficulty,
          category: newProblem.category,
          number: newProblem.number ? parseInt(newProblem.number) : null,
          tags: [newProblem.category]
        })
      })

      const result = await response.json()
      if (result.success) {
        message.success('题目添加成功')
        // 重新获取题库数据
        await fetchProblems()
        // 重置表单
        setNewProblem({
          url: '',
          title: '',
          titleCn: '',
          difficulty: 'medium',
          category: 'Array',
          number: ''
        })
        setShowAddForm(false)
      } else {
        message.error(result.error || '添加题目失败')
      }
    } catch (error) {
      console.error('添加题目失败:', error)
      message.error('添加题目失败')
    } finally {
      setAddingProblem(false)
    }
  }

  // 获取选中的题目详情
  const getSelectedProblemsDetails = () => {
    return problems.filter(problem => selectedProblems.includes(problem.id))
  }

  // 过滤题目
  const filteredProblems = problems.filter(problem => {
    const difficultyMatch = filterDifficulty === 'all' || problem.difficulty === filterDifficulty
    const categoryMatch = filterCategory === 'all' || problem.category === filterCategory
    return difficultyMatch && categoryMatch
  })

  // 获取分类列表
  const categories = [...new Set(problems.map(p => p.category))]

  const handleSubmit = async () => {
    if (!planName.trim()) {
      message.error('请输入计划名称')
      return
    }

    if (!startDate) {
      message.error('请选择开始日期')
      return
    }

    if (planMode === 'custom' && selectedProblems.length === 0) {
      message.error('请至少选择一道题目')
      return
    }

    const planData = {
      name: planName,
      mode: planMode,
      duration,
      intensity,
      startDate: startDate.format('YYYY-MM-DD'),
      selectedProblems: planMode === 'custom' ? selectedProblems : []
    }
    
    setLoading(true)
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
        router.push('/')
      } else {
        message.error(result.error || '创建计划失败')
      }
    } catch (error) {
      console.error('创建计划失败:', error)
      message.error('创建计划失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>加载中...</p>
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
        <h1>创建学习计划</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.formSection}>
          {/* 计划模式选择 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Target className={styles.labelIcon} />
              计划模式
            </label>
            <Radio.Group 
              value={planMode} 
              onChange={(e) => setPlanMode(e.target.value)}
              className={styles.radioGroup}
            >
              <Radio value="default">使用默认计划 (精选25道经典题目)</Radio>
              <Radio value="custom">自定义选题 (从题库中选择)</Radio>
            </Radio.Group>
          </div>

          {/* 计划名称 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <BookOpen className={styles.labelIcon} />
              计划名称
            </label>
            <Input
              placeholder="例如：算法基础训练"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* 自定义选题 */}
          {planMode === 'custom' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>选择题目</label>
              <div className={styles.problemSelection}>
                {/* 操作按钮 */}
                <div className={styles.actionButtons}>
                  <Button 
                    type="dashed" 
                    onClick={() => setShowAddForm(!showAddForm)}
                    icon={<Plus size={14} />}
                  >
                    {showAddForm ? '取消添加' : '手动添加题目'}
                  </Button>
                  <Button 
                    type="primary" 
                    ghost
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={selectedProblems.length === 0}
                  >
                    预览选中题目 ({selectedProblems.length})
                  </Button>
                </div>

                {/* 手动添加题目表单 */}
                {showAddForm && (
                  <div className={styles.addForm}>
                    <h4>添加新题目</h4>
                    <div className={styles.addFormGrid}>
                      <Input
                        placeholder="题目链接 (必填，如: https://leetcode.com/problems/two-sum/)"
                        value={newProblem.url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                      />
                      <div className={styles.addFormRow}>
                        <Input
                          placeholder="题目编号 (自动解析)"
                          value={newProblem.number}
                          onChange={(e) => setNewProblem({...newProblem, number: e.target.value})}
                        />
                        <Select
                          value={newProblem.difficulty}
                          onChange={(value) => setNewProblem({...newProblem, difficulty: value})}
                        >
                          <Option value="easy">简单</Option>
                          <Option value="medium">中等</Option>
                          <Option value="hard">困难</Option>
                        </Select>
                      </div>
                      <Input
                        placeholder="题目标题 (自动解析，可修改)"
                        value={newProblem.title}
                        onChange={(e) => setNewProblem({...newProblem, title: e.target.value})}
                      />
                      <Input
                        placeholder="题目标题 (中文，可选)"
                        value={newProblem.titleCn}
                        onChange={(e) => setNewProblem({...newProblem, titleCn: e.target.value})}
                      />
                      <Input
                        placeholder="分类 (如: Array)"
                        value={newProblem.category}
                        onChange={(e) => setNewProblem({...newProblem, category: e.target.value})}
                      />
                      <Button 
                        type="primary" 
                        onClick={handleAddProblem}
                        loading={addingProblem}
                        className={styles.addButton}
                      >
                        添加题目
                      </Button>
                    </div>
                  </div>
                )}

                {/* 预览选中题目 */}
                {showPreview && selectedProblems.length > 0 && (
                  <div className={styles.preview}>
                    <h4>已选择的题目 ({selectedProblems.length} 道)</h4>
                    <div className={styles.previewList}>
                      {getSelectedProblemsDetails().map((problem, index) => (
                        <div key={problem.id} className={styles.previewItem}>
                          <div className={styles.previewInfo}>
                            <span className={styles.previewNumber}>{index + 1}.</span>
                            <span className={`${styles.difficultyBadge} ${styles[problem.difficulty]}`}>
                              {problem.difficulty}
                            </span>
                            <span className={styles.previewTitle}>
                              {problem.titleCn || problem.title}
                            </span>
                            <span className={styles.previewCategory}>{problem.category}</span>
                          </div>
                          <Button 
                            type="text" 
                            size="small"
                            onClick={() => setSelectedProblems(prev => prev.filter(id => id !== problem.id))}
                          >
                            移除
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 筛选器 */}
                <div className={styles.filters}>
                  <Select
                    value={filterDifficulty}
                    onChange={setFilterDifficulty}
                    style={{ width: 120 }}
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
                    style={{ width: 120 }}
                    placeholder="分类"
                  >
                    <Option value="all">全部分类</Option>
                    {categories.map(cat => (
                      <Option key={cat} value={cat}>{cat}</Option>
                    ))}
                  </Select>
                </div>

                {/* 题目列表 */}
                <div className={styles.problemList}>
                  {problemsLoading ? (
                    <div className={styles.problemsLoading}>
                      <Spin />
                    </div>
                  ) : (
                    <div className={styles.problems}>
                      {filteredProblems.map(problem => (
                        <div key={problem.id} className={styles.problemItem}>
                          <Checkbox 
                            checked={selectedProblems.includes(problem.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProblems(prev => [...prev, problem.id])
                              } else {
                                setSelectedProblems(prev => prev.filter(id => id !== problem.id))
                              }
                            }}
                          >
                            <span className={`${styles.difficultyBadge} ${styles[problem.difficulty]}`}>
                              {problem.difficulty}
                            </span>
                            <span className={styles.problemNumber}>#{problem.number}</span>
                            <span className={styles.problemTitle}>
                              {problem.titleCn || problem.title}
                            </span>
                            <span className={styles.problemCategory}>{problem.category}</span>
                          </Checkbox>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.selectionCount}>
                    已选择 {selectedProblems.length} 道题目
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 计划时长 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Calendar className={styles.labelIcon} />
              计划时长
            </label>
            <div className={styles.sliderContainer}>
              <Slider
                min={7}
                max={90}
                value={duration}
                onChange={setDuration}
                marks={{
                  7: '1周',
                  30: '1个月',
                  60: '2个月',
                  90: '3个月'
                }}
              />
              <span className={styles.sliderValue}>{duration} 天</span>
            </div>
          </div>

          {/* 学习强度 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Clock className={styles.labelIcon} />
              学习强度
            </label>
            <Select
              value={intensity}
              onChange={setIntensity}
              className={styles.select}
            >
              <Option value="easy">轻松 (每天1-2题)</Option>
              <Option value="medium">适中 (每天2-3题)</Option>
              <Option value="hard">高强度 (每天3-5题)</Option>
            </Select>
          </div>

          {/* 开始日期 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Calendar className={styles.labelIcon} />
              开始日期
            </label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="选择开始日期"
              className={styles.datePicker}
              format="YYYY-MM-DD"
            />
          </div>

          {/* 提交按钮 */}
          <div className={styles.submitSection}>
            <Button onClick={() => router.push('/')} className={styles.cancelButton}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              className={styles.submitButton}
            >
              创建计划
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
