'use client'

import { useState, useEffect } from 'react'
import { Modal, Input, Select, DatePicker, Button, message, Slider, Radio, Checkbox, Spin } from 'antd'
import { CalendarOutlined, BookOutlined, ClockCircleOutlined, AppstoreOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

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

interface CreatePlanModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (planData: any) => void
  loading: boolean
}

export default function CreatePlanModalNew({ open, onCancel, onSubmit, loading }: CreatePlanModalProps) {
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

  // 获取题库数据
  useEffect(() => {
    if (open && planMode === 'custom') {
      fetchProblems()
    }
  }, [open, planMode])

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
    
    await onSubmit(planData)
    
    // 重置表单
    setPlanName('')
    setDuration(30)
    setIntensity('medium')
    setStartDate(dayjs())
    setPlanMode('default')
    setSelectedProblems([])
    onCancel()
  }

  const handleCancel = () => {
    // 重置表单
    setPlanName('')
    setDuration(30)
    setIntensity('medium')
    setStartDate(dayjs())
    setPlanMode('default')
    setSelectedProblems([])
    onCancel()
  }

  return (
    <Modal
      title="创建学习计划"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      style={{ maxHeight: '80vh' }}
    >
      <div style={{ padding: '20px 0' }}>
        {/* 计划模式选择 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            <AppstoreOutlined style={{ marginRight: '8px' }} />
            计划模式
          </label>
          <Radio.Group 
            value={planMode} 
            onChange={(e) => setPlanMode(e.target.value)}
          >
            <Radio value="default">使用默认计划 (精选19道经典题目)</Radio>
            <Radio value="custom">自定义选题 (从题库中选择)</Radio>
          </Radio.Group>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            <BookOutlined style={{ marginRight: '8px' }} />
            计划名称
          </label>
          <Input
            placeholder="例如：算法基础训练"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
          />
        </div>

        {/* 自定义选题 */}
        {planMode === 'custom' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>选择题目</label>
            <div>
              {/* 操作按钮 */}
              <div style={{ marginBottom: '12px' }}>
                <Button 
                  type="dashed" 
                  onClick={() => setShowAddForm(!showAddForm)}
                  style={{ marginRight: 8 }}
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
                <div style={{ 
                  marginBottom: '16px', 
                  padding: '16px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px',
                  backgroundColor: '#fafafa'
                }}>
                  <h4 style={{ marginBottom: '12px' }}>添加新题目</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <Input
                      placeholder="题目链接 (必填，如: https://leetcode.com/problems/two-sum/)"
                      value={newProblem.url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
                  <div style={{ marginBottom: '12px' }}>
                    <Input
                      placeholder="题目标题 (自动解析，可修改)"
                      value={newProblem.title}
                      onChange={(e) => setNewProblem({...newProblem, title: e.target.value})}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <Input
                      placeholder="题目标题 (中文，可选)"
                      value={newProblem.titleCn}
                      onChange={(e) => setNewProblem({...newProblem, titleCn: e.target.value})}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <Input
                      placeholder="分类 (如: Array)"
                      value={newProblem.category}
                      onChange={(e) => setNewProblem({...newProblem, category: e.target.value})}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Button 
                      type="primary" 
                      onClick={handleAddProblem}
                      loading={addingProblem}
                    >
                      添加题目
                    </Button>
                  </div>
                </div>
              )}

              {/* 预览选中题目 */}
              {showPreview && selectedProblems.length > 0 && (
                <div style={{ 
                  marginBottom: '16px', 
                  padding: '16px', 
                  border: '1px solid #1890ff', 
                  borderRadius: '6px',
                  backgroundColor: '#f6ffed'
                }}>
                  <h4 style={{ marginBottom: '12px', color: '#1890ff' }}>已选择的题目 ({selectedProblems.length} 道)</h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {getSelectedProblemsDetails().map((problem, index) => (
                      <div key={problem.id} style={{ 
                        marginBottom: '8px', 
                        padding: '8px 12px', 
                        backgroundColor: 'white',
                        border: '1px solid #e8f4fd',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <span style={{ marginRight: '8px', fontWeight: 'bold' }}>
                            {index + 1}.
                          </span>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '2px 6px', 
                            borderRadius: '3px', 
                            fontSize: '12px',
                            marginRight: '8px',
                            backgroundColor: problem.difficulty === 'easy' ? '#52c41a' : problem.difficulty === 'medium' ? '#faad14' : '#f5222d',
                            color: 'white'
                          }}>
                            {problem.difficulty}
                          </span>
                          <span style={{ marginRight: '8px', color: '#666' }}>#{problem.number}</span>
                          <span style={{ marginRight: '8px', fontWeight: '500' }}>
                            {problem.titleCn || problem.title}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>{problem.category}</span>
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
              <div style={{ marginBottom: '12px' }}>
                <Select
                  value={filterDifficulty}
                  onChange={setFilterDifficulty}
                  style={{ width: 120, marginRight: 8 }}
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
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '6px', padding: '12px' }}>
                {problemsLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin />
                  </div>
                ) : (
                  <div style={{ width: '100%' }}>
                    {filteredProblems.map(problem => (
                      <div key={problem.id} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
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
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '2px 6px', 
                            borderRadius: '3px', 
                            fontSize: '12px',
                            marginRight: '8px',
                            backgroundColor: problem.difficulty === 'easy' ? '#52c41a' : problem.difficulty === 'medium' ? '#faad14' : '#f5222d',
                            color: 'white'
                          }}>
                            {problem.difficulty}
                          </span>
                          <span style={{ marginRight: '8px', color: '#666' }}>#{problem.number}</span>
                          <span style={{ marginRight: '8px' }}>
                            {problem.titleCn || problem.title}
                          </span>
                          <span style={{ color: '#999', fontSize: '12px' }}>{problem.category}</span>
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '8px', color: '#666' }}>
                已选择 {selectedProblems.length} 道题目
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            <CalendarOutlined style={{ marginRight: '8px' }} />
            计划时长
          </label>
          <div>
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
            <span style={{ marginTop: '8px', display: 'block' }}>{duration} 天</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            <ClockCircleOutlined style={{ marginRight: '8px' }} />
            学习强度
          </label>
          <Select
            value={intensity}
            onChange={setIntensity}
            style={{ width: '100%' }}
          >
            <Option value="easy">轻松 (每天1-2题)</Option>
            <Option value="medium">适中 (每天2-3题)</Option>
            <Option value="hard">高强度 (每天3-5题)</Option>
          </Select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            <CalendarOutlined style={{ marginRight: '8px' }} />
            开始日期
          </label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="选择开始日期"
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </div>

        <div style={{ textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
          <Button onClick={handleCancel} style={{ marginRight: '8px' }}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            创建计划
          </Button>
        </div>
      </div>
    </Modal>
  )
}
