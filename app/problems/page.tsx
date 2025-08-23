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

// 模拟所有题目数据
const mockProblems = [
  {
    id: '1',
    number: 1,
    title: '比较版本号',
    url: 'https://leetcode.cn/problems/compare-version-numbers',
    reviewCount: 3,
    lastReviewDate: '2024-01-15',
    addedDate: '2023-12-10',
    notes: '### 关键思路\n\n按点分割字符串，然后逐段比较数字大小。注意处理前导零和长度不同的情况。\n\n**代码要点**:\n- `split(".")`分割\n- `parseInt()`转数字\n- 补齐短的版本号\n\n```java\npublic int compareVersion(String v1, String v2) {\n    String[] a1 = v1.split("\\\\.");\n    String[] a2 = v2.split("\\\\.");\n    \n    int len = Math.max(a1.length, a2.length);\n    \n    for(int i=0; i<len; i++) {\n        int n1 = i < a1.length ? Integer.parseInt(a1[i]) : 0;\n        int n2 = i < a2.length ? Integer.parseInt(a2[i]) : 0;\n        \n        if(n1 < n2) return -1;\n        if(n1 > n2) return 1;\n    }\n    \n    return 0;\n}\n```',
  },
  {
    id: '2', 
    number: 2,
    title: 'LRU Cache',
    url: 'https://leetcode.com/problems/lru-cache/',
    reviewCount: 2,
    lastReviewDate: '2024-01-13',
    addedDate: '2023-12-15',
    notes: '### 实现方法\n\n双向链表 + 哈希表实现。链表维护访问顺序，哈希表提供O(1)查找。\n\n**核心操作**:\n- get: 移到头部\n- put: 添加到头部，超容量删除尾部\n\n#### 复杂度\n- 时间复杂度: O(1)\n- 空间复杂度: O(capacity)',
  },
  {
    id: '3',
    number: 3,
    title: 'Trapping Rain Water',
    url: 'https://leetcode.com/problems/trapping-rain-water/',
    reviewCount: 1,
    lastReviewDate: '2024-01-14',
    addedDate: '2023-12-20',
    notes: '### 双指针法\n\n左右指针向中间移动，维护左右最大高度。\n\n**思路**:\n当前位置能接的雨水 = min(左侧最高, 右侧最高) - 当前高度\n\n![接雨水示意图](https://assets.leetcode.com/uploads/2018/10/22/rainwatertrap.png)',
  },
  {
    id: '4',
    number: 4,
    title: '最长回文子串',
    url: 'https://leetcode.cn/problems/longest-palindromic-substring/',
    reviewCount: 4,
    lastReviewDate: '2024-01-18',
    addedDate: '2023-11-05',
    notes: '### 中心扩展法\n\n从每个位置出发，向两边扩展。需要考虑奇数和偶数长度的回文串。\n\n**复杂度**:\n- 时间复杂度: O(n²)\n- 空间复杂度: O(1)',
  },
  {
    id: '5',
    number: 5,
    title: '合并K个排序链表',
    url: 'https://leetcode.cn/problems/merge-k-sorted-lists/',
    reviewCount: 2,
    lastReviewDate: '2024-01-10',
    addedDate: '2024-01-01',
    notes: '### 优先队列法\n\n使用小顶堆：将所有链表头节点放入堆中，每次取出最小的，并将其下一个节点放入堆中。\n\n**复杂度分析**:\n- 时间复杂度：O(N log k)，其中k是链表数量，N是总节点数\n- 空间复杂度：O(k)',
  },
];

// 排序选项
type SortOption = 'newest' | 'oldest' | 'most-reviewed' | 'least-reviewed' | 'recently-reviewed' | 'title-asc' | 'title-desc';

export default function ProblemsPage() {
  const [problems, setProblems] = useState(mockProblems);
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