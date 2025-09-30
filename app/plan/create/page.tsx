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

// 分类中英文映射
const CATEGORY_TRANSLATIONS: { [key: string]: string } = {
  'Array': '数组',
  'String': '字符串',
  'Hash Table': '哈希表',
  'Dynamic Programming': '动态规划',
  'Math': '数学',
  'Two Pointers': '双指针',
  'Greedy': '贪心算法',
  'Sorting': '排序',
  'Bit Manipulation': '位运算',
  'Tree': '树',
  'Depth-First Search': '深度优先搜索',
  'Binary Search': '二分查找',
  'Matrix': '矩阵',
  'Breadth-First Search': '广度优先搜索',
  'Sliding Window': '滑动窗口',
  'Recursion': '递归',
  'Binary Tree': '二叉树',
  'Heap (Priority Queue)': '堆（优先队列）',
  'Stack': '栈',
  'Graph': '图',
  'Design': '设计',
  'Backtracking': '回溯',
  'Simulation': '模拟',
  'Counting': '计数',
  'Linked List': '链表',
  'Prefix Sum': '前缀和',
  'Binary Search Tree': '二叉搜索树',
  'Ordered Set': '有序集合',
  'Queue': '队列',
  'Memoization': '记忆化搜索',
  'Geometry': '几何',
  'Topological Sort': '拓扑排序',
  'Union Find': '并查集',
  'Trie': '字典树',
  'Divide and Conquer': '分治',
  'Bitmask': '状态压缩',
  'Monotonic Stack': '单调栈',
  'Database': '数据库',
  'Interactive': '交互',
  'Data Stream': '数据流',
  'Rolling Hash': '滚动哈希',
  'Shortest Path': '最短路径',
  'Game Theory': '博弈论',
  'Combinatorics': '组合数学',
  'Randomized': '随机化',
  'Monotonic Queue': '单调队列',
  'Merge Sort': '归并排序',
  'Iterator': '迭代器',
  'Concurrency': '并发',
  'Doubly-Linked List': '双向链表',
  'Probability and Statistics': '概率与统计',
  'Quickselect': '快速选择',
  'Bucket Sort': '桶排序',
  'Suffix Array': '后缀数组',
  'Minimum Spanning Tree': '最小生成树',
  'Eulerian Circuit': '欧拉回路',
  'Line Sweep': '扫描线',
  'Hash Function': '哈希函数',
  'Number Theory': '数论',
  'Bipartite Graph': '二分图',
  'Strongly Connected Component': '强连通分量',
  'Rejection Sampling': '拒绝采样',
  'Reservoir Sampling': '蓄水池抽样'
}

// 获取分类的中文名称
const getCategoryDisplayName = (category: string): string => {
  return CATEGORY_TRANSLATIONS[category] || category
}

// 反向查找：从中文获取英文分类名
const getCategoryEnglishName = (chineseName: string): string => {
  const entry = Object.entries(CATEGORY_TRANSLATIONS).find(([_, chinese]) => chinese === chineseName)
  return entry ? entry[0] : chineseName
}

interface LeetCodeProblem {
  id: string
  number: number
  title: string
  titleCn: string
  difficulty: string
  category: string
  tags: string[]
  slug: string
  // 学习状态信息
  studyStatus?: {
    hasStudied: boolean
    reviewCount: number
    lastReviewDate?: string
    completed: boolean
  }
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
  const [filterStudyStatus, setFilterStudyStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // 预览相关状态
  const [showPreview, setShowPreview] = useState(false)
  
  // 手动添加题目相关状态
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingProblem, setAddingProblem] = useState(false)
  
  // 批量导入相关状态
  const [showBatchImport, setShowBatchImport] = useState(false)
  const [batchImportData, setBatchImportData] = useState('')
  const [batchImporting, setBatchImporting] = useState(false)
  const [newProblem, setNewProblem] = useState({
    url: '',
    title: '',
    titleCn: '',
    difficulty: 'medium',
    category: getCategoryDisplayName('Array'),
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
      // 获取题库数据，包含学习状态
      const response = await fetch('/api/leetcode-problems?includeStudyStatus=true')
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
          category: getCategoryDisplayName(data.category || '')
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
          category: getCategoryDisplayName('Array')
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
        category: getCategoryDisplayName('Array')
      }))
      
      message.warning('网络错误，已进行基本解析')
    } finally {
      setAddingProblem(false)
    }
  }

  // 生成示例模板数据
  const generateSampleData = () => {
    const sampleData = [
      {
        "url": "https://leetcode.com/problems/two-sum/",
        "title": "Two Sum",
        "titleCn": "两数之和",
        "difficulty": "easy",
        "category": "数组",
        "number": 1,
        "tags": ["数组", "哈希表"]
      },
      {
        "url": "https://leetcode.com/problems/add-two-numbers/",
        "title": "Add Two Numbers",
        "titleCn": "两数相加", 
        "difficulty": "medium",
        "category": "链表",
        "tags": ["链表", "数学"]
      },
      {
        "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        "title": "Longest Substring Without Repeating Characters",
        "titleCn": "无重复字符的最长子串",
        "difficulty": "medium",
        "category": "字符串",
        "tags": ["字符串", "滑动窗口"]
      }
    ]
    
    setBatchImportData(JSON.stringify(sampleData, null, 2))
    message.success('已生成示例数据，您可以修改后导入')
  }

  // 批量导入题目
  const handleBatchImport = async () => {
    if (!batchImportData.trim()) {
      message.error('请输入要导入的题目数据')
      return
    }

    setBatchImporting(true)
    try {
      // 解析JSON数据
      let problemsData
      try {
        problemsData = JSON.parse(batchImportData)
      } catch (error) {
        message.error('JSON格式错误，请检查数据格式')
        return
      }

      // 验证数据格式
      if (!Array.isArray(problemsData)) {
        message.error('数据必须是数组格式')
        return
      }

      // 验证每个题目的必要字段
      const validProblems = []
      const errors = []

      for (let i = 0; i < problemsData.length; i++) {
        const problem = problemsData[i]
        
        if (!problem.url || !problem.title) {
          errors.push(`第${i + 1}个题目缺少必要字段 (url, title)`)
          continue
        }

        // 解析slug和number
        const slug = parseSlug(problem.url)
        const number = parseNumber(problem.url) || problem.number

        if (!slug) {
          errors.push(`第${i + 1}个题目URL格式无效: ${problem.url}`)
          continue
        }

        validProblems.push({
          slug,
          url: problem.url,
          title: problem.title,
          titleCn: problem.titleCn || problem.title,
          difficulty: problem.difficulty || 'medium',
          category: getCategoryEnglishName(problem.category || '数组'),
          number: number || 0,
          tags: Array.isArray(problem.tags) ? problem.tags : [getCategoryEnglishName(problem.category || '数组')]
        })
      }

      if (errors.length > 0) {
        message.error(`发现 ${errors.length} 个错误:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`)
        return
      }

      if (validProblems.length === 0) {
        message.error('没有有效的题目数据')
        return
      }

      // 批量提交到后端
      const response = await fetch('/api/leetcode-problems/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problems: validProblems
        })
      })

      const result = await response.json()
      if (result.success) {
        message.success(`成功导入 ${result.imported} 道题目，跳过 ${result.skipped} 道重复题目`)
        
        // 重新获取题库数据
        await fetchProblems()
        
        // 自动选中所有导入的题目（包括新导入和已存在的）
        if (result.importedSlugs && result.importedSlugs.length > 0) {
          setSelectedProblems(prev => {
            const newSelected = Array.from(new Set([...prev, ...result.importedSlugs]))
            message.info(`已自动选中 ${result.importedSlugs.length} 道导入的题目，可使用"取消选中"按钮取消选择`)
            return newSelected
          })
        }
        
        // 清空输入框但保持表单打开，方便用户使用"取消选中"功能
        setBatchImportData('')
      } else {
        message.error(result.error || '批量导入失败')
      }
    } catch (error) {
      console.error('批量导入失败:', error)
      message.error('批量导入失败')
    } finally {
      setBatchImporting(false)
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
        category: getCategoryDisplayName('Array')
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
          category: getCategoryEnglishName(newProblem.category),
          number: newProblem.number ? parseInt(newProblem.number) : null,
          tags: [getCategoryEnglishName(newProblem.category)]
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
          category: getCategoryDisplayName('Array'),
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

  // 筛选题目
  const filteredProblems = problems.filter(problem => {
    const matchesSearch = searchQuery === '' || 
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.titleCn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (problem.number &&problem.number.toString().includes(searchQuery))
    
    const matchesDifficulty = filterDifficulty === 'all' || problem.difficulty === filterDifficulty
    const matchesCategory = filterCategory === 'all' ||problem.category === filterCategory
    
    const matchesStudyStatus = filterStudyStatus === 'all' || 
      (filterStudyStatus === 'studied' && problem.studyStatus?.hasStudied) ||
      (filterStudyStatus === 'unstudied' && !problem.studyStatus?.hasStudied) ||
      (filterStudyStatus === 'completed' &&problem.studyStatus?.completed) ||
      (filterStudyStatus === 'uncompleted' &&problem.studyStatus?.hasStudied && !problem.studyStatus?.completed)
    
    return matchesSearch && matchesDifficulty && matchesCategory && matchesStudyStatus
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
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={styles.addProblemButton}
                >
                  {showAddForm ? '取消添加' : '手动添加题目'}
                </Button>
                <Button 
                  onClick={() => setShowBatchImport(true)}
                  className={styles.batchImportButton}
                >
                  批量导入题目
                </Button>
                <Button 
                  onClick={() => {
                    const currentPageSlugs = filteredProblems.map(p => p.slug)
                    setSelectedProblems(prev => Array.from(new Set([...prev, ...currentPageSlugs])))
                    message.success(`已选中当前页面的 ${currentPageSlugs.length} 道题目`)
                  }}
                  className={styles.selectAllButton}
                >
                  全选当前页
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
                  <Option key={category} value={category}>{getCategoryDisplayName(category)}</Option>
                ))}
              </Select>

              <Select
                value={filterStudyStatus}
                onChange={setFilterStudyStatus}
                className={styles.filterSelect}
                placeholder="学习状态"
              >
                <Option value="all">全部状态</Option>
                <Option value="unstudied">未学习</Option>
                <Option value="studied">已学习</Option>
                <Option value="uncompleted">学习中</Option>
                <Option value="completed">已掌握</Option>
              </Select>

              <div className={styles.statsArea}>
                <div className={styles.selectedCountArea}>
                  <div className={styles.selectedCount}>
                    已选择 {selectedProblems.length} 道题目
                  </div>
                  {selectedProblems.length > 0 && (
                    <Button 
                      size="small"
                      onClick={() => {
                        setSelectedProblems([])
                        message.success('已取消选中所有题目')
                      }}
                      className={styles.clearSelectedButton}
                    >
                      取消选中
                    </Button>
                  )}
                </div>
                <div className={styles.studyStats}>
                  {(() => {
                    const studiedCount = filteredProblems.filter(p => p.studyStatus?.hasStudied).length
                    const completedCount = filteredProblems.filter(p => p.studyStatus?.completed).length
                    return (
                      <span className={styles.studyStatsText}>
                        📚 已学习: {studiedCount} | ✅ 已掌握: {completedCount}
                      </span>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* 批量导入题目表单 */}
            {showBatchImport && (
              <div className={styles.batchImportForm}>
                <h4 className={styles.batchImportTitle}>批量导入题目</h4>
                <div className={styles.batchImportHint}>
                  💡 支持JSON格式批量导入，请按照以下模板格式准备数据
                </div>
                
                {/* JSON模板展示 */}
                <div className={styles.templateSection}>
                  <h5 className={styles.templateTitle}>📋 JSON模板格式</h5>
                  <div className={styles.templateCode}>
                    <pre>{`[
  {
    "url": "https://leetcode.com/problems/two-sum/",
    "title": "Two Sum",
    "titleCn": "两数之和",
    "difficulty": "easy",
    "category": "数组",
    "number": 1,
    "tags": ["数组", "哈希表"]
  },
  {
    "url": "https://leetcode.com/problems/add-two-numbers/",
    "title": "Add Two Numbers", 
    "titleCn": "两数相加",
    "difficulty": "medium",
    "category": "链表"
  }
]`}</pre>
                  </div>
                  
                  <div className={styles.templateNotes}>
                    <h6>📝 字段说明：</h6>
                    <ul>
                      <li><strong>url</strong> (必填): LeetCode题目链接</li>
                      <li><strong>title</strong> (必填): 英文题目名称</li>
                      <li><strong>titleCn</strong> (可选): 中文题目名称，不填则使用title</li>
                      <li><strong>difficulty</strong> (可选): 难度 (easy/medium/hard)，默认medium</li>
                      <li><strong>category</strong> (可选): 分类，支持中文，默认"数组"</li>
                      <li><strong>number</strong> (可选): 题目编号，会自动从URL解析</li>
                      <li><strong>tags</strong> (可选): 标签数组，默认使用category</li>
                    </ul>
                  </div>
                </div>

                {/* 数据输入区域 */}
                <div className={styles.dataInputSection}>
                  <div className={styles.inputHeader}>
                    <h5 className={styles.inputTitle}>📥 粘贴JSON数据</h5>
                    <Button 
                      size="small"
                      onClick={generateSampleData}
                      className={styles.sampleButton}
                    >
                      生成示例数据
                    </Button>
                  </div>
                  <Input.TextArea
                    placeholder="请粘贴符合上述格式的JSON数据..."
                    value={batchImportData}
                    onChange={(e) => setBatchImportData(e.target.value)}
                    className={styles.batchImportTextarea}
                    rows={12}
                    disabled={batchImporting}
                  />
                </div>

                {/* 操作按钮 */}
                <div className={styles.batchImportActions}>
                  <Button 
                    onClick={() => {
                      setBatchImportData('')
                      setShowBatchImport(false)
                    }}
                    disabled={batchImporting}
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={() => {
                      setBatchImportData('')
                      message.success('已清空输入内容')
                    }}
                    disabled={batchImporting || !batchImportData.trim()}
                    className={styles.clearInputButton}
                  >
                    清空输入
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={handleBatchImport}
                    loading={batchImporting}
                    disabled={!batchImportData.trim()}
                  >
                    {batchImporting ? '导入中...' : '开始导入'}
                  </Button>
                </div>
              </div>
            )}

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
                      placeholder="分类 (自动解析，如: 数组、字符串)"
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
            <div className={styles.problemsList}>
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
                      className={`${styles.problemItem} ${selectedProblems.includes(problem.slug) ? styles.selected : ''} ${problem.studyStatus?.hasStudied ? styles.studied : ''}`}
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
                          {/* 学习状态标记 */}
                          {problem.studyStatus?.hasStudied && (
                            <div className={styles.studyStatusBadges}>
                              {problem.studyStatus.completed && (
                                <span className={styles.completedBadge} title="已完成">✅</span>
                              )}
                              {problem.studyStatus.reviewCount > 0 && (
                                <span className={styles.reviewBadge} title={`已复习 ${problem.studyStatus.reviewCount} 次`}>
                                  🔄{problem.studyStatus.reviewCount}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={styles.problemMeta}>
                          <span className={styles.problemCategory}>{getCategoryDisplayName(problem.category)}</span>
                          {/* 学习状态文字提示 */}
                          {problem.studyStatus?.hasStudied && (
                            <span className={styles.studyStatusText}>
                              {problem.studyStatus.completed ? '已掌握' : '已学习'}
                              {problem.studyStatus.lastReviewDate && (
                                <span className={styles.lastReviewDate}>
                                  · {new Date(problem.studyStatus.lastReviewDate).toLocaleDateString('zh-CN')}
                                </span>
                              )}
                            </span>
                          )}
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
