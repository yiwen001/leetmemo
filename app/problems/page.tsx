'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Trash2, Edit2, Search, FileText, Calendar, RefreshCw, Loader, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Modal, Input, message, Popconfirm, Select } from 'antd'
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
  studyPlan?: {
    id: string
    startDate: string
    status: string
  } | null
}

// 排序选项
type SortOption = 'newest' | 'oldest' | 'most-reviewed' | 'least-reviewed' | 'recently-reviewed' | 'title-asc' | 'title-desc';

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // 从API获取历史题目数据
  const fetchProblems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy: sortOption,
        limit: '100' // 获取更多数据
      });
      
      const response = await fetch(`/api/problems/history?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProblems(data.problems);
        setTotal(data.total);
      } else {
        message.error('获取题目失败');
      }
    } catch (error) {
      console.error('获取题目失败:', error);
      message.error('获取题目失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和搜索/排序变化时重新获取
  useEffect(() => {
    fetchProblems();
  }, [searchTerm, sortOption]);

  const sortedProblems = problems; // API已经处理了排序

  // 打开编辑笔记模态框
  const openEditModal = (problemId: string, notes: string) => {
    setCurrentProblemId(problemId);
    setCurrentNotes(notes);
    setIsPreviewMode(false);
    setIsEditModalOpen(true);
  };

  // 保存笔记
  const saveNotes = async () => {
    if (!currentProblemId) return;
    
    try {
      const response = await fetch('/api/problems/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: currentProblemId,
          notes: currentNotes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 更新本地状态
        setProblems((prev: Problem[]) => 
          prev.map((problem: Problem) => 
            problem.id === currentProblemId 
              ? { ...problem, notes: currentNotes }
              : problem
          )
        );
        setIsEditModalOpen(false);
        message.success('笔记已更新');
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      console.error('更新笔记失败:', error);
      message.error('更新失败');
    }
  };

  // 删除题目功能暂时禁用，因为这是历史记录
  const handleDelete = (problemId: string) => {
    message.info('历史记录不支持删除，如需管理题目请在学习计划中操作');
  };

  // 清空所有学习历史
  const handleClearAllHistory = async () => {
    try {
      const response = await fetch('/api/problems/history', {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setProblems([]);
        setTotal(0);
        message.success(data.message);
      } else {
        message.error('清空失败');
      }
    } catch (error) {
      console.error('清空学习历史失败:', error);
      message.error('清空失败');
    }
  };

  // 切换编辑/预览模式
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <div className={styles.container}>
      {/* 导航栏 */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={20} />
            返回首页
          </Link>
          <h1 className={styles.pageTitle}>所有题目</h1>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className={styles.main}>
        <div className={styles.toolBar}>
          <div className={styles.searchArea}>
            <Input 
              prefix={<Search size={14} />} 
              placeholder="搜索题目或笔记内容" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              className={styles.searchInput}
            />
          </div>
          <div className={styles.toolBarRight}>
            <div className={styles.sortArea}>
              <span className={styles.sortLabel}>排序: </span>
              <Select 
                value={sortOption}
                onChange={(value: SortOption) => setSortOption(value)}
                className={styles.sortSelect}
                options={[
                  { value: 'newest', label: '最近添加' },
                  { value: 'oldest', label: '最早添加' },
                  { value: 'most-reviewed', label: '复习次数最多' },
                  { value: 'least-reviewed', label: '复习次数最少' },
                  { value: 'recently-reviewed', label: '最近复习' },
                  { value: 'title-asc', label: '题目名称 A-Z' },
                  { value: 'title-desc', label: '题目名称 Z-A' },
                ]}
              />
            </div>
            <Popconfirm
              title="清空学习历史"
              description={
                <div>
                  <p>确定要清空所有学习历史吗？</p>
                  <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                    ⚠️ 此操作不可撤销，将删除所有学习记录和笔记
                  </p>
                </div>
              }
              onConfirm={handleClearAllHistory}
              okText="确定清空"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              icon={<AlertTriangle size={16} />}
            >
              <button className={styles.clearAllButton} disabled={loading || total === 0}>
                <AlertTriangle size={16} />
                清空历史
              </button>
            </Popconfirm>
          </div>
        </div>
        
        <div className={styles.problemCount}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader className={styles.spinner} size={16} />
              <span>加载中...</span>
            </div>
          ) : (
            `共 ${total} 道题目，显示 ${sortedProblems.length} 道`
          )}
        </div>

        {/* 卡片布局 */}
        <div className={styles.problemCards}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader className={styles.spinner} size={24} />
              <p>正在加载历史题目...</p>
            </div>
          ) : sortedProblems.length === 0 ? (
            <div className={styles.emptyState}>
              <p>没有找到匹配的题目</p>
              <p className={styles.emptyHint}>开始学习计划后，完成的题目会在这里显示</p>
            </div>
          ) : (
            sortedProblems.map(problem => (
              <div key={problem.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.problemInfo}>
                    <span className={styles.problemNumber}>#{problem.number}</span>
                    <a 
                      href={problem.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.problemTitle}
                    >
                      {problem.title}
                    </a>
                  </div>
                  <div className={styles.cardActions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => openEditModal(problem.id, problem.notes)}
                      title="编辑笔记"
                    >
                      <Edit2 size={16} />
                    </button>
                    <Popconfirm
                      title="删除题目"
                      description="确定要删除这道题目吗？此操作不可撤销。"
                      onConfirm={() => handleDelete(problem.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <button 
                        className={styles.deleteButton}
                        title="删除题目"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <RefreshCw size={14} />
                    <span>复习 {problem.reviewCount} 次</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Calendar size={14} />
                    <span>最近: {problem.lastReviewDate}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <FileText size={14} />
                    <span>添加: {problem.addedDate}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={`${styles.difficultyBadge} ${styles[problem.difficulty]}`}>
                      {problem.difficulty === 'easy' ? '简单' : 
                       problem.difficulty === 'medium' ? '中等' : '困难'}
                    </span>
                  </div>
                  {problem.completed && (
                    <div className={styles.metaItem}>
                      <span className={styles.completedBadge}>已完成</span>
                    </div>
                  )}
                </div>
                <div className={styles.cardContent}>
                  <div className={`${styles.notes} ${styles.markdown}`}>
                    <ReactMarkdown
                      rehypePlugins={[rehypeSanitize, rehypeRaw]}
                      remarkPlugins={[remarkGfm]}
                    >
                      {problem.notes || '*暂无笔记*'}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 编辑笔记模态框 */}
      <Modal
        title="编辑笔记"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={saveNotes}
        width={800}
        okText="保存"
        cancelText="取消"
        bodyStyle={{ padding: '20px' }}
        className={styles.notesModal}
      >
        <div className={styles.modalTabs}>
          <button 
            className={`${styles.tabButton} ${!isPreviewMode ? styles.activeTab : ''}`}
            onClick={() => setIsPreviewMode(false)}
          >
            编辑
          </button>
          <button 
            className={`${styles.tabButton} ${isPreviewMode ? styles.activeTab : ''}`}
            onClick={() => setIsPreviewMode(true)}
          >
            预览
          </button>
        </div>
        
        {isPreviewMode ? (
          <div className={`${styles.previewPane} ${styles.markdown}`}>
            <ReactMarkdown
              rehypePlugins={[rehypeSanitize, rehypeRaw]}
              remarkPlugins={[remarkGfm]}
            >
              {currentNotes || '*暂无内容*'}
            </ReactMarkdown>
          </div>
        ) : (
          <Input.TextArea
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            rows={15}
            placeholder="支持 Markdown 格式，例如：\n# 标题\n## 子标题\n- 列表项\n\n```java\n// 代码块\n```"
            className={styles.notesTextarea}
          />
        )}
        
        <div className={styles.markdownHelp}>
          <p>支持 Markdown 语法: <code>#</code> 标题, <code>**粗体**</code>, <code>*斜体*</code>, <code>```代码块```</code>, <code>- 列表</code></p>
        </div>
      </Modal>
    </div>
  );
}