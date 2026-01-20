'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Trash2, Search, FileText, Calendar, RefreshCw, Loader, BookOpen, Plus, Folder, X, Bold, Italic, Code, Link as LinkIcon, List, Quote, Image, Type, Minus, ChevronRight, Hash } from 'lucide-react'
import Link from 'next/link'
import { Input, message, Popconfirm, Empty } from 'antd'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import styles from './problems.module.scss'

interface Problem {
  id: string
  number: number
  title: string
  url: string
  reviewCount: number
  lastReviewDate: string
  addedDate: string
  notes: string
  difficulty: string
  completed: boolean
  timeSpent: number
  category: string
  categoryId: string | null
  studyPlan?: {
    id: string
    startDate: string
    status: string
  } | null
}

interface Category {
  id: string
  name: string
  count: number
  problems?: Problem[]
  children?: Category[]
}

type SortOption = 'newest' | 'oldest' | 'most-reviewed' | 'least-reviewed' | 'recently-reviewed' | 'title-asc' | 'title-desc'

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  const [editingNotes, setEditingNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  const [isCreateProblemModalOpen, setIsCreateProblemModalOpen] = useState(false)
  const [newProblem, setNewProblem] = useState({
    url: '',
    title: '',
    difficulty: 'medium',
    category: ''
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']))
  
  // 右键菜单相关状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    problem: Problem | null
  }>({ visible: false, x: 0, y: 0, problem: null })
  
  // 重命名分类相关状态
  const [renamingCategory, setRenamingCategory] = useState<{
    id: string
    name: string
  } | null>(null)

  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const [splitPosition, setSplitPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedProblem, setDraggedProblem] = useState<Problem | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const container = document.querySelector(`.${styles.editorContainer}`)
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = (x / rect.width) * 100
      
      if (percentage >= 20 && percentage <= 80) {
        setSplitPosition(percentage)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = editorRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = editingNotes
    const selectedText = text.substring(start, end)
    const prevScrollTop = textarea.scrollTop
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)
    setEditingNotes(newText)
    requestAnimationFrame(() => {
      const t = editorRef.current
      if (!t) return
      t.focus()
      const anchor = start + before.length
      t.setSelectionRange(anchor, anchor + selectedText.length)
      t.scrollTop = prevScrollTop
    })
  }

  const fetchProblems = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy: sortOption,
        limit: '1000'
      })
      
      const response = await fetch(`/api/problems/history?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setProblems(data.problems)
        setTotal(data.total)
      } else {
        message.error('获取题目失败')
      }
    } catch (error) {
      console.error('获取题目失败:', error)
      message.error('获取题目失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
      } else {
        message.error('获取分类失败')
      }
    } catch (error) {
      console.error('获取分类失败:', error)
      message.error('获取分类失败')
    }
  }

  const updateCategoryCounts = (userCategories: Category[]) => {
    const categoryProblemsMap = new Map<string, Problem[]>()
    
    problems.forEach(problem => {
      const categoryId = problem.categoryId
      if (!categoryProblemsMap.has(categoryId || '未分类')) {
        categoryProblemsMap.set(categoryId || '未分类', [])
      }
      categoryProblemsMap.get(categoryId || '未分类')!.push(problem)
    })
    
    const categoryList: Category[] = userCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: categoryProblemsMap.get(cat.id)?.length || 0,
      problems: categoryProblemsMap.get(cat.id) || []
    }))
    
    // 只有当 categoryList 与当前 categories 不同时才更新状态，避免无限循环
    setCategories(prev => {
      const isSame = prev.length === categoryList.length && 
        prev.every((cat, index) => cat.id === categoryList[index].id && cat.count === categoryList[index].count)
      return isSame ? prev : categoryList
    })
  }

  useEffect(() => {
    fetchProblems()
    fetchCategories()
  }, [searchTerm, sortOption])

  useEffect(() => {
    updateCategoryCounts(categories)
  }, [problems, categories])

  useEffect(() => {
    if (searchTerm) {
      const filtered = problems.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.notes.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProblems(filtered)
    } else {
      setFilteredProblems(problems)
    }
  }, [problems, searchTerm])

  useEffect(() => {
    if (selectedProblem) {
      setEditingNotes(selectedProblem.notes || '')
    }
  }, [selectedProblem])

  const handleNotesChange = (value: string) => {
    setEditingNotes(value)
  }

  const saveNotes = async () => {
    if (!selectedProblem?.id) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/problems/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: selectedProblem.id,
          notes: editingNotes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setProblems(prev => 
          prev.map(p => 
            p.id === selectedProblem.id 
              ? { ...p, notes: editingNotes }
              : p
          )
        )
        setSelectedProblem(prev => prev ? { ...prev, notes: editingNotes } : null)
        message.success('笔记已保存')
      } else {
        message.error('保存失败')
      }
    } catch (error) {
      console.error('保存笔记失败:', error)
      message.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      message.error('请输入分类名称')
      return
    }
    
    const existingCategory = categories.find(c => c.name === newCategoryName.trim())
    if (existingCategory) {
      message.error('该分类已存在')
      return
    }
    
    try {
      const categoryName = newCategoryName.trim()
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryName
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        message.success('分类创建成功')
        setIsCreateCategoryModalOpen(false)
        setNewCategoryName('')
        // 直接更新 categories 状态，确保包含 count 和 problems 属性
        const newCategory = data.category
        const newCategoryWithStats = { 
          ...newCategory, 
          count: 0, 
          problems: [] 
        }
        setCategories(prev => [...prev, newCategoryWithStats])
      } else {
        message.error(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建分类失败:', error)
      message.error('创建失败')
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (confirm(`确定要删除分类"${categoryName}"吗？该分类下的题目将移动到"未分类"。`)) {
      try {
        const problemsToUpdate = problems.filter(p => p.categoryId === categoryId)
        const updatePromises = problemsToUpdate.map(problem => 
          fetch('/api/problems/history', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recordId: problem.id,
              categoryId: null
            })
          })
        )
        
        await Promise.all(updatePromises)
        
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE'
        })
        
        const data = await response.json()
        
        if (data.success) {
          message.success('分类删除成功')
          fetchCategories()
          fetchProblems()
        } else {
          message.error(data.error || '删除失败')
        }
      } catch (error) {
        console.error('删除分类失败:', error)
        message.error('删除失败')
      }
    }
  }

  const handleDeleteProblem = async (problemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('确定要删除这条学习记录吗？此操作不可恢复。')) {
      return
    }
    
    try {
      const response = await fetch(`/api/problems/history/${problemId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        message.success('删除成功')
        if (selectedProblem?.id === problemId) {
          setSelectedProblem(null)
        }
        fetchProblems()
        fetchCategories()
      } else {
        message.error(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除学习记录失败:', error)
      message.error('删除失败')
    }
  }
  
  // 右键菜单处理函数
  const handleContextMenu = (e: React.MouseEvent, problem: Problem) => {
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      problem
    })
  }
  
  const handleCloseContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      problem: null
    })
  }
  
  const handleMoveToCategory = async (categoryId: string | null, categoryName: string) => {
    if (!contextMenu.problem) return
    
    try {
      const response = await fetch('/api/problems/history', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: contextMenu.problem.id,
          categoryId: categoryId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        message.success(`已移动到"${categoryName}"`)
        handleCloseContextMenu()
        fetchProblems()
        fetchCategories()
      } else {
        message.error(data.error || '移动失败')
      }
    } catch (error) {
      console.error('移动题目失败:', error)
      message.error('移动失败')
    }
  }
  
  // 重命名分类处理函数
  const handleStartRenameCategory = (categoryId: string, categoryName: string) => {
    setRenamingCategory({ id: categoryId, name: categoryName })
  }
  
  const handleRenameCategory = async () => {
    if (!renamingCategory?.name.trim()) {
      message.error('分类名称不能为空')
      return
    }
    
    // 检查是否已存在同名分类
    const existingCategory = categories.find(
      c => c.name === renamingCategory.name.trim() && c.id !== renamingCategory.id
    )
    
    if (existingCategory) {
      message.error('该分类名称已存在')
      return
    }
    
    try {
      const response = await fetch(`/api/categories/${renamingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: renamingCategory.name.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        message.success('分类重命名成功')
        setRenamingCategory(null)
        fetchCategories()
        fetchProblems()
      } else {
        message.error(data.error || '重命名失败')
      }
    } catch (error) {
      console.error('重命名分类失败:', error)
      message.error('重命名失败')
    }
  }
  
  const handleCancelRenameCategory = () => {
    setRenamingCategory(null)
  }

  const handleDragStart = (problem: Problem) => {
    setDraggedProblem(problem)
  }

  const handleDragEnd = () => {
    setDraggedProblem(null)
    setDragOverCategory(null)
  }

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCategory(categoryId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCategory(null)
  }

  const handleDrop = async (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedProblem) {
      setDragOverCategory(null)
      return
    }

    const targetCategoryId = categoryId === 'all' ? null : categoryId
    const categoryName = categoryId === 'all' ? '未分类' : categories.find(c => c.id === categoryId)?.name || '未分类'
    
    try {
      const response = await fetch('/api/problems/history', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: draggedProblem.id,
          categoryId: targetCategoryId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        message.success(`已移动到"${categoryName}"`)
        fetchProblems()
        fetchCategories()
      } else {
        message.error(data.error || '移动失败')
      }
    } catch (error) {
      console.error('移动题目失败:', error)
      message.error('移动失败')
    } finally {
      setDraggedProblem(null)
      setDragOverCategory(null)
    }
  }

  const handleCreateProblem = async () => {
    if (!newProblem.url.trim()) {
      message.error('请输入题目链接')
      return
    }
    
    if (!newProblem.title.trim()) {
      message.error('请输入题目标题')
      return
    }
    
    try {
      const response = await fetch('/api/problems/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: newProblem.url,
          title: newProblem.title,
          difficulty: newProblem.difficulty
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        message.success('题目创建成功')
        setIsCreateProblemModalOpen(false)
        setNewProblem({
          url: '',
          title: '',
          difficulty: 'medium',
          category: '未分类'
        })
        fetchProblems()
        fetchCategories()
      } else {
        message.error('创建失败')
      }
    } catch (error) {
      console.error('创建题目失败:', error)
      message.error('创建失败')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          <span>返回首页</span>
        </Link>
        <h1 className={styles.title}>学习笔记</h1>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="搜索题目..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.sidebarActions}>
              <button 
                className={styles.actionButton}
                onClick={() => setIsCreateCategoryModalOpen(true)}
                title="新建分类"
              >
                <Folder size={14} />
              </button>
              <button 
                className={styles.actionButton}
                onClick={() => setIsCreateProblemModalOpen(true)}
                title="新建题目"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className={styles.categories}>
            <div 
              className={`${styles.categoryItem} ${dragOverCategory === 'all' ? styles.dragOver : ''}`}
              onDragOver={(e) => handleDragOver(e, 'all')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'all')}
            >
              <div 
                className={`${styles.categoryContent} ${expandedCategories.has('all') ? styles.expanded : ''}`}
                onClick={() => {
                  const newExpanded = new Set(expandedCategories)
                  if (newExpanded.has('all')) {
                    newExpanded.delete('all')
                  } else {
                    newExpanded.add('all')
                  }
                  setExpandedCategories(newExpanded)
                }}
              >
                <ChevronRight size={12} className={styles.chevron} />
                <BookOpen size={14} />
                <span>全部题目</span>
                <span className={styles.count}>{total}</span>
              </div>
            </div>
            
            {expandedCategories.has('all') && (
              <div className={styles.problemList}>
                {problems.map(problem => (
                  <div 
                    key={problem.id}
                    className={`${styles.problemItem} ${selectedProblem?.id === problem.id ? styles.active : ''} ${draggedProblem?.id === problem.id ? styles.dragging : ''}`}
                    onClick={() => setSelectedProblem(problem)}
                    draggable
                    onDragStart={() => handleDragStart(problem)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleContextMenu(e, problem)}
                  >
                    <div className={styles.problemHeader}>
                      <span className={styles.problemNumber}>#{problem.number}</span>
                      <span className={styles.problemTitle}>{problem.title}</span>
                    </div>
                    <div className={styles.problemMeta}>
                      <span className={`${styles.difficulty} ${styles[problem.difficulty]}`}>
                        {problem.difficulty === 'easy' ? '简单' : problem.difficulty === 'medium' ? '中等' : '困难'}
                      </span>
                      <span className={styles.review}>
                        <RefreshCw size={10} />
                        {problem.reviewCount}
                      </span>
                      <button 
                        className={styles.deleteProblemButton}
                        onClick={(e) => handleDeleteProblem(problem.id, e)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                        title="删除学习记录"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {categories.map(category => (
              <div key={category.id}>
                <div 
                  className={`${styles.categoryItem} ${dragOverCategory === category.id ? styles.dragOver : ''}`}
                  onDragOver={(e) => handleDragOver(e, category.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, category.id)}
                >
                  <div 
                    className={`${styles.categoryContent} ${expandedCategories.has(category.id) ? styles.expanded : ''}`}
                    onClick={() => {
                      const newExpanded = new Set(expandedCategories)
                      if (newExpanded.has(category.id)) {
                        newExpanded.delete(category.id)
                      } else {
                        newExpanded.add(category.id)
                      }
                      setExpandedCategories(newExpanded)
                    }}
                  >
                    <ChevronRight size={12} className={styles.chevron} />
                    <Folder size={14} />
                    {renamingCategory?.id === category.id ? (
                      <div className={styles.renameCategoryInputWrapper}>
                        <Input
                          value={renamingCategory.name}
                          onChange={(e) => setRenamingCategory({ ...renamingCategory, name: e.target.value })}
                          onPressEnter={handleRenameCategory}
                          onBlur={handleRenameCategory}
                          autoFocus
                          size="small"
                          className={styles.renameCategoryInput}
                        />
                        <button 
                          className={styles.renameConfirmButton}
                          onClick={handleRenameCategory}
                          title="确认重命名"
                        >
                          ✔
                        </button>
                        <button 
                          className={styles.renameCancelButton}
                          onClick={handleCancelRenameCategory}
                          title="取消重命名"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className={styles.categoryName}
                          onDoubleClick={() => handleStartRenameCategory(category.id, category.name)}
                        >
                          {category.name}
                        </span>
                        <span className={styles.count}>{category.count}</span>
                      </>
                    )}
                  </div>
                  <button 
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category.id, category.name)
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
                
                {expandedCategories.has(category.id) && category.problems && (
                  <div className={styles.problemList}>
                    {category.problems.map(problem => (
                      <div 
                        key={problem.id}
                        className={`${styles.problemItem} ${selectedProblem?.id === problem.id ? styles.active : ''} ${draggedProblem?.id === problem.id ? styles.dragging : ''}`}
                        onClick={() => setSelectedProblem(problem)}
                        draggable
                        onDragStart={() => handleDragStart(problem)}
                        onDragEnd={handleDragEnd}
                        onContextMenu={(e) => handleContextMenu(e, problem)}
                      >
                        <div className={styles.problemHeader}>
                          <span className={styles.problemNumber}>#{problem.number}</span>
                          <span className={styles.problemTitle}>{problem.title}</span>
                        </div>
                        <div className={styles.problemMeta}>
                          <span className={`${styles.difficulty} ${styles[problem.difficulty]}`}>
                            {problem.difficulty === 'easy' ? '简单' : problem.difficulty === 'medium' ? '中等' : '困难'}
                          </span>
                          <span className={styles.review}>
                            <RefreshCw size={10} />
                            {problem.reviewCount}
                          </span>
                          <button 
                            className={styles.deleteProblemButton}
                            onClick={(e) => handleDeleteProblem(problem.id, e)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDragStart={(e) => e.preventDefault()}
                            title="删除学习记录"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className={styles.main}>
          {selectedProblem ? (
            <>
              <div className={styles.problemInfo}>
                <div className={styles.problemHeader}>
                  <div className={styles.problemTitleSection}>
                    <span className={styles.problemNumber}>#{selectedProblem.number}</span>
                    <a 
                      href={selectedProblem.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.problemTitleLink}
                    >
                      {selectedProblem.title}
                    </a>
                    <span className={`${styles.difficulty} ${styles[selectedProblem.difficulty]}`}>
                      {selectedProblem.difficulty === 'easy' ? '简单' : selectedProblem.difficulty === 'medium' ? '中等' : '困难'}
                    </span>
                    <span className={styles.metaItem}>
                      <Folder size={12} />
                      {selectedProblem.category || '未分类'}
                    </span>
                    <span className={styles.metaItem}>
                      <RefreshCw size={12} />
                      {selectedProblem.reviewCount}
                    </span>
                  </div>
                  <div className={styles.problemActions}>
                    <button 
                      className={styles.saveButton}
                      onClick={saveNotes}
                      disabled={isSaving}
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                    <Popconfirm
                      title="删除题目"
                      description="确定要删除这道题目吗？此操作不可撤销。"
                      onConfirm={() => handleDeleteProblem(selectedProblem.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <button className={styles.deleteButton}>
                        <Trash2 size={14} />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              </div>

              <div className={styles.editorContainer}>
                <div className={styles.editorPane} style={{ width: `${splitPosition}%` }}>
                  <div className={styles.paneHeader}>
                    <FileText size={14} />
                    <span>编辑</span>
                  </div>
                  <div className={styles.toolbar}>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('# ', '')}
                      title="标题 1"
                    >
                      <Hash size={14} />
                      <span>1</span>
                    </button>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('## ', '')}
                      title="标题 2"
                    >
                      <Hash size={14} />
                      <span>2</span>
                    </button>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('### ', '')}
                      title="标题 3"
                    >
                      <Hash size={14} />
                      <span>3</span>
                    </button>
                    <div className={styles.toolbarDivider}></div>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('**', '**')}
                      title="粗体"
                    >
                      <Bold size={14} />
                    </button>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('*', '*')}
                      title="斜体"
                    >
                      <Italic size={14} />
                    </button>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('~~', '~~')}
                      title="删除线"
                    >
                      <Minus size={14} />
                    </button>
                    <div className={styles.toolbarDivider}></div>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('`', '`')}
                      title="行内代码"
                    >
                      <Code size={14} />
                    </button>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('\n```\n', '\n```\n')}
                      title="代码块"
                    >
                      <Code size={14} />
                      <span>{'{}'}</span>
                    </button>
                    <div className={styles.toolbarDivider}></div>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('[', '](url)')}
                      title="链接"
                    >
                      <LinkIcon size={14} />
                    </button>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('![alt](', ')')}
                      title="图片"
                    >
                      <Image size={14} />
                    </button>
                    <div className={styles.toolbarDivider}></div>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('- ', '')}
                      title="无序列表"
                    >
                      <List size={14} />
                    </button>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('1. ', '')}
                      title="有序列表"
                    >
                      <List size={14} />
                      <span>1.</span>
                    </button>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('> ', '')}
                      title="引用"
                    >
                      <Quote size={14} />
                    </button>
                    <div className={styles.toolbarDivider}></div>
                    <button 
                      className={styles.toolbarButton}
                      onClick={() => insertMarkdown('---', '')}
                      title="分割线"
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                  <textarea
                    ref={editorRef}
                    value={editingNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="开始编写你的笔记..."
                    className={styles.editor}
                    spellCheck={false}
                  />
                </div>
                <div 
                  className={styles.resizer}
                  onMouseDown={handleMouseDown}
                >
                  <div className={styles.resizerHandle}></div>
                </div>
                <div className={styles.previewPane} style={{ width: `${100 - splitPosition}%` }}>
                  <div className={styles.paneHeader}>
                    <FileText size={14} />
                    <span>预览</span>
                  </div>
                  <div className={styles.preview}>
                    {editingNotes.trim() ? (
                      <ReactMarkdown
                        rehypePlugins={[rehypeSanitize, rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                      >
                        {editingNotes}
                      </ReactMarkdown>
                    ) : (
                      <div className={styles.emptyPreview}>在左侧输入内容，此处将实时预览</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <BookOpen size={48} />
              <h3>选择一个题目查看详情</h3>
              <p>从左侧列表中选择一个题目，或创建新的笔记</p>
              <button 
                className={styles.createButton}
                onClick={() => setIsCreateProblemModalOpen(true)}
              >
                <Plus size={14} />
                创建新笔记
              </button>
            </div>
          )}
        </main>
      </div>

      {isCreateCategoryModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateCategoryModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>新建分类</h3>
            <Input
              placeholder="请输入分类名称"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onPressEnter={handleCreateCategory}
            />
            <div className={styles.modalActions}>
              <button onClick={() => setIsCreateCategoryModalOpen(false)}>取消</button>
              <button onClick={handleCreateCategory}>确定</button>
            </div>
          </div>
        </div>
      )}

      {isCreateProblemModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateProblemModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>新建题目</h3>
            <div className={styles.formGroup}>
              <label>题目链接</label>
              <Input
                placeholder="https://leetcode.com/problems/..."
                value={newProblem.url}
                onChange={(e) => setNewProblem({ ...newProblem, url: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>题目标题</label>
              <Input
                placeholder="请输入题目标题"
                value={newProblem.title}
                onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>难度</label>
              <select 
                value={newProblem.difficulty}
                onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setIsCreateProblemModalOpen(false)}>取消</button>
              <button onClick={handleCreateProblem}>确定</button>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu.visible && contextMenu.problem && (
        <div 
          className={styles.contextMenu}
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={handleCloseContextMenu}
        >
          <div className={styles.contextMenuTitle}>
            <span className={styles.contextMenuProblemTitle}>{contextMenu.problem.title}</span>
          </div>
          <div className={styles.contextMenuDivider}></div>
          <div className={styles.contextMenuSectionTitle}>移动到分类</div>
          <div 
            className={styles.contextMenuItem}
            onClick={() => handleMoveToCategory(null, '未分类')}
          >
            <Folder size={12} />
            <span>未分类</span>
          </div>
          {categories.map(category => (
            <div 
              key={category.id}
              className={styles.contextMenuItem}
              onClick={() => handleMoveToCategory(category.id, category.name)}
            >
              <Folder size={12} />
              <span>{category.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
