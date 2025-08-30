// components/PlanDetailsModal/PlanDetailsModal.tsx
import React from 'react'
import { Modal, Progress, Tag, Statistic, Row, Col, Table, Empty, Button } from 'antd'
import { Calendar, Target, BookOpen, CheckCircle, Clock, Trash2, Plus } from 'lucide-react'
import styles from './PlanDetailsModal.module.sass'

interface PlanDetailsModalProps {
  visible: boolean
  onClose: () => void
  data: any
  loading?: boolean
  onDeletePlan?: () => void
  onCreatePlan?: () => void
}

const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({
  visible,
  onClose,
  data,
  loading,
  onDeletePlan,
  onCreatePlan
}) => {
  // 处理空状态
  if (!data) {
    return (
      <Modal
        title={
          <div className={styles.modalTitle}>
            <Target size={20} />
            <span>学习计划详情</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {onCreatePlan && (
              <Button 
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  onCreatePlan()
                  onClose()
                }}
              >
                创建学习计划
              </Button>
            )}
            <Button onClick={onClose}>
              关闭
            </Button>
          </div>
        }
        width={600}
        loading={loading}
      >
        <div className={styles.emptyPlanState}>
          <Empty
            image={<Target size={64} color="#ccc" />}
            description={
              <div>
                <h3>还没有学习计划</h3>
                <p>创建一个学习计划开始你的刷题之旅吧！</p>
              </div>
            }
          />
        </div>
      </Modal>
    )
  }

  const { plan, problems, statistics } = data

  // 定义表格列
  const columns = [
    {
      title: '题号',
      dataIndex: 'number',
      key: 'number',
      width: 80,
      render: (num: number) => `#${num}`
    },
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <a href={record.url} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      )
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => {
        const colors: any = {
          'Easy': 'green',
          'Medium': 'orange',
          'Hard': 'red'
        }
        return <Tag color={colors[difficulty]}>{difficulty}</Tag>
      }
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: any, record: any) => (
        <div className={styles.statusCell}>
          {record.learned && (
            <Tag color="blue" icon={<BookOpen size={12} />}>
              已学习
            </Tag>
          )}
          {record.completed && (
            <Tag color="green" icon={<CheckCircle size={12} />}>
              已完成
            </Tag>
          )}
          {!record.learned && !record.completed && (
            <Tag color="default">待学习</Tag>
          )}
        </div>
      )
    }
  ]

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <Target size={20} />
          <span>学习计划详情</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        onDeletePlan ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              type="primary" 
              danger 
              icon={<Trash2 size={16} />}
              onClick={() => {
                onDeletePlan()
                onClose()
              }}
            >
              删除计划
            </Button>
            <Button onClick={onClose}>
              关闭
            </Button>
          </div>
        ) : (
          <Button onClick={onClose}>
            关闭
          </Button>
        )
      }
      width={900}
      loading={loading}
    >
      <div className={styles.modalContent}>
        {/* 计划概览 */}
        <div className={styles.overviewSection}>
          <h3 className={styles.sectionTitle}>计划概览</h3>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Statistic
                title="开始日期"
                value={plan.startDate}
                prefix={<Calendar size={16} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="计划天数"
                value={plan.duration}
                suffix="天"
                prefix={<Clock size={16} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="学习强度"
                value={plan.intensity === 'light' ? '轻松' : 
                       plan.intensity === 'medium' ? '适中' : '高强度'}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="计划状态"
                value={plan.status === 'active' ? '进行中' : 
                       plan.status === 'completed' ? '已完成' : '已暂停'}
                valueStyle={{ 
                  color: plan.status === 'active' ? '#52c41a' : '#666' 
                }}
              />
            </Col>
          </Row>
        </div>

        {/* 进度统计 */}
        <div className={styles.progressSection}>
          <h3 className={styles.sectionTitle}>学习进度</h3>
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>天数进度</span>
                  <span>{statistics.completedTasks} / {statistics.totalDays} 天</span>
                </div>
                <Progress 
                  percent={statistics.dayProgress} 
                  strokeColor="#1890ff"
                />
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>题目进度</span>
                  <span>{statistics.learnedProblems} / {statistics.totalProblems} 题</span>
                </div>
                <Progress 
                  percent={statistics.problemProgress} 
                  strokeColor="#52c41a"
                />
              </div>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col span={8}>
              <Statistic
                title="总题目数"
                value={statistics.totalProblems}
                prefix={<BookOpen size={16} />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="已完成"
                value={statistics.completedProblems}
                prefix={<CheckCircle size={16} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="日均题目"
                value={statistics.averageProblemsPerDay}
                precision={1}
                suffix="题"
              />
            </Col>
          </Row>
        </div>

        {/* 题目列表 */}
        <div className={styles.problemsSection}>
          <h3 className={styles.sectionTitle}>题目列表</h3>
          <Table
            columns={columns}
            dataSource={problems}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 道题目`
            }}
            size="small"
            scroll={{ y: 400 }}
          />
        </div>
      </div>
    </Modal>
  )
}

export default PlanDetailsModal