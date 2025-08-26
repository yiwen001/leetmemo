'use client'

import { useState } from 'react'
import { ArrowLeft, Trash2, Edit2, Search, FileText, Calendar, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Modal, Input, message, Popconfirm, Select } from 'antd'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import styles from './problems.module.scss'

import { DEFAULT_PROBLEMS } from '@/lib/default-study-plan';

// 将默认题目转换为应用所需格式
const getDefaultProblems = () => {
  const today = new Date().toISOString().split('T')[0];
  return DEFAULT_PROBLEMS.map((problem, index) => {
    // 从题目名称中提取标题（移除LeetCode和题号）
    const title = problem.name.replace(/^LeetCode \d+\.\s*/, '');
    // 从URL中提取题号
    const numberMatch = problem.url.match(/\/(\d+)[\/-]/);
    const number = numberMatch ? parseInt(numberMatch[1], 10) : index + 1;
    
    return {
      id: `problem-${number}`,
      number,
      title,
      url: problem.url,
      reviewCount: 0, // 初始复习次数为0
      lastReviewDate: today, // 使用今天作为最后复习日期
      addedDate: today, // 使用今天作为添加日期
      notes: '', // 初始没有笔记
    };
  });
};

const defaultProblems = getDefaultProblems();

// 排序选项
type SortOption = 'newest' | 'oldest' | 'most-reviewed' | 'least-reviewed' | 'recently-reviewed' | 'title-asc' | 'title-desc';

export default function ProblemsPage() {
  const [problems, setProblems] = useState(defaultProblems);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // 过滤和排序问题
  const filteredProblems = problems.filter(problem => 
    problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    problem.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 排序
  const sortedProblems = [...filteredProblems].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      case 'oldest':
        return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
      case 'most-reviewed':
        return b.reviewCount - a.reviewCount;
      case 'least-reviewed':
        return a.reviewCount - b.reviewCount;
      case 'recently-reviewed':
        return new Date(b.lastReviewDate).getTime() - new Date(a.lastReviewDate).getTime();
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  // 打开编辑笔记模态框
  const openEditModal = (problemId: string, notes: string) => {
    setCurrentProblemId(problemId);
    setCurrentNotes(notes);
    setIsPreviewMode(false);
    setIsEditModalOpen(true);
  };

  // 保存笔记
  const saveNotes = () => {
    if (!currentProblemId) return;
    
    setProblems(prev => 
      prev.map(problem => 
        problem.id === currentProblemId 
          ? { ...problem, notes: currentNotes }
          : problem
      )
    );
    
    setIsEditModalOpen(false);
    message.success('笔记已更新');
  };

  // 删除题目
  const handleDelete = (problemId: string) => {
    setProblems(prev => prev.filter(problem => problem.id !== problemId));
    message.success('题目已删除');
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
        </div>
        
        <div className={styles.problemCount}>
          共 {problems.length} 道题目，显示 {sortedProblems.length} 道
        </div>

        {/* 卡片布局 */}
        <div className={styles.problemCards}>
          {sortedProblems.length === 0 ? (
            <div className={styles.emptyState}>
              <p>没有找到匹配的题目</p>
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
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.notes}>
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
          <div className={styles.previewPane}>
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