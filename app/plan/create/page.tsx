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
  
  // 手动添加题目相关状态
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingProblem, setAddingProblem] = useState(false)
  const [newProblem, setNewProblem] = useState({
    url: '',
    title: '',
    titleCn: '',
    difficulty: 'medium',
    category: 'Array',
    number: ''
  })

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

  // 从URL解析题目标题
  const parseTitle = (url: string) => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const match = pathname.match(/\/problems\/([^\/]+)/)
      if (match) {
        const slug = match[1]
        // 将slug转换为标题格式，如 "two-sum" -> "Two Sum"
        return slug.split('-').map(word => 
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

  // 防抖函数
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // 实际的解析函数
  const parseUrlInfo = async (url: string) => {
    // 显示加载状态
    setAddingProblem(true)
    
    try {
      // 调用解析API
      const response = await fetch(`/api/leetcode-problems/parse?url=${encodeURIComponent(url)}`)
      const result = await response.json()

      if (result.success) {
        const { data, source } = result
        
        setNewProblem(prev => ({
          ...prev,
          number: data.number ? data.number.toString() : '',
          title: data.title || '',
          titleCn: data.titleCn || '',
          difficulty: data.difficulty || 'medium',
          category: data.category || ''
        }))

        // 根据数据源显示不同的提示
        if (source === 'database') {
          message.success('从题库中找到题目信息')
        } else if (source === 'leetcode_api') {
          message.success('从LeetCode获取题目信息成功')
        } else {
          message.info('已解析URL，请确认题目信息')
        }
      } else {
        // 解析失败，回退到基本URL解析
        const parsedNumber = parseNumber(url)
        const parsedTitle = parseTitle(url)
        
        setNewProblem(prev => ({
          ...prev,
          number: parsedNumber ? parsedNumber.toString() : '',
          title: parsedTitle || '',
          titleCn: '',
          difficulty: 'medium',
          category: ''
        }))
        
        message.warning('自动解析失败，请手动填写题目信息')
      }
    } catch (error) {
      console.error('解析题目信息失败:', error)
      
      // 出错时回退到基本解析
      const parsedNumber = parseNumber(url)
      const parsedTitle = parseTitle(url)
      
      setNewProblem(prev => ({
        ...prev,
        number: parsedNumber ? parsedNumber.toString() : '',
        title: parsedTitle || '',
        titleCn: '',
        difficulty: 'medium',
        category: ''
      }))
      
      message.warning('网络错误，已进行基本解析')
    } finally {
      setAddingProblem(false)
    }
  }

  // 防抖的解析函数
  const debouncedParseUrl = debounce(parseUrlInfo, 1000)

  // 处理URL变化 - 增强版自动解析
  const handleUrlChange = (url: string) => {
    setNewProblem(prev => ({
      ...prev,
      url,
    }))

    // 如果URL为空，清空其他字段
    if (!url.trim()) {
      setNewProblem(prev => ({
        ...prev,
        number: '',
        title: '',
        titleCn: '',
        difficulty: 'medium',
        category: ''
      }))
      return
    }

    // 防抖调用解析函数
    debouncedParseUrl(url)
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
    (problem.number && problem.number.toString().includes(searchQuery))
    
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
              <div className={styles.headerButtons}>
                <Button 
                  type="primary" 
                  icon={<Zap />}
                  onClick={selectSpeedRunProblems}
                  className={styles.speedRunButton}
                >
                  30题速成版
                </Button>
                <Button 
                  type="dashed" 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={styles.addProblemButton}
                >
                  {showAddForm ? '取消添加' : '手动添加题目'}
                </Button>
              </div>
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

            {/* 手动添加题目表单 */}
            {showAddForm && (
              <div className={styles.addForm}>
                <h4 className={styles.addFormTitle}>添加新题目</h4>
                <div className={styles.addFormHint}>
                  💡 粘贴LeetCode题目链接，系统将自动解析题目编号、标题、难度和分类
                </div>
                <div className={styles.addFormContent}>
                  <div className={styles.addFormRow}>
                    <Input
                      placeholder="题目链接 (必填，如: https://leetcode.com/problems/two-sum/)"
                      value={newProblem.url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className={styles.addFormInput}
                      suffix={addingProblem ? <span style={{ color: '#1890ff' }}>解析中...</span> : null}
                    />
                  </div>
                  <div className={styles.addFormRow}>
                    <Input
                      placeholder="题目编号 (自动解析)"
                      value={newProblem.number}
                      onChange={(e) => setNewProblem({...newProblem, number: e.target.value})}
                      className={styles.addFormInputSmall}
                      disabled={addingProblem}
                    />
                    <Select
                      value={newProblem.difficulty}
                      onChange={(value) => setNewProblem({...newProblem, difficulty: value})}
                      className={styles.addFormSelect}
                      disabled={addingProblem}
                      placeholder="难度 (自动解析)"
                    >
                      <Option value="easy">简单</Option>
                      <Option value="medium">中等</Option>
                      <Option value="hard">困难</Option>
                    </Select>
                  </div>
                  <div className={styles.addFormRow}>
                    <Input
                      placeholder="题目标题 (自动解析，可修改)"
                      value={newProblem.title}
                      onChange={(e) => setNewProblem({...newProblem, title: e.target.value})}
                      className={styles.addFormInput}
                      disabled={addingProblem}
                    />
                  </div>
                  <div className={styles.addFormRow}>
                    <Input
                      placeholder="中文标题 (可选，手动填写)"
                      value={newProblem.titleCn}
                      onChange={(e) => setNewProblem({...newProblem, titleCn: e.target.value})}
                      className={styles.addFormInput}
                      disabled={addingProblem}
                    />
                  </div>
                  <div className={styles.addFormRow}>
                    <Input
                      placeholder="分类 (自动解析，如: Array)"
                      value={newProblem.category}
                      onChange={(e) => setNewProblem({...newProblem, category: e.target.value})}
                      className={styles.addFormInput}
                      disabled={addingProblem}
                    />
                  </div>
                  <div className={styles.addFormActions}>
                    <Button 
                      type="primary" 
                      onClick={handleAddProblem}
                      loading={addingProblem}
                      className={styles.addFormSubmit}
                    >
                      添加题目
                    </Button>
                  </div>
                </div>
              </div>
            )}

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
