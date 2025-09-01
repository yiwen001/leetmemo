'use client'

import { useState } from 'react'
import { Modal, Button, Select, InputNumber, DatePicker, message } from 'antd'
import { AlertTriangle, RefreshCw, Calendar, Target } from 'lucide-react'
import dayjs from 'dayjs'
import styles from './PlanRecoveryModal.module.scss'

interface PlanRecoveryModalProps {
  visible: boolean
  onClose: () => void
  onRecover: (duration: number, intensity: string, startDate?: string) => void
  loading: boolean
  remainingProblems: number
}

const PlanRecoveryModal: React.FC<PlanRecoveryModalProps> = ({
  visible,
  onClose,
  onRecover,
  loading,
  remainingProblems
}) => {
  const [duration, setDuration] = useState(14)
  const [intensity, setIntensity] = useState('medium')
  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'))

  const handleRecover = () => {
    if (duration < 1 || duration > 90) {
      message.error('计划天数必须在1-90天之间')
      return
    }
    onRecover(duration, intensity, startDate)
  }

  const intensityOptions = [
    { value: 'easy', label: '轻松 (每天1-2题)' },
    { value: 'medium', label: '中等 (每天2-3题)' },
    { value: 'hard', label: '困难 (每天3-4题)' }
  ]

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="#faad14" />
          <span>计划积压过多</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      className={styles.recoveryModal}
    >
      <div className={styles.modalContent}>
        <div className={styles.warningSection}>
          <div className={styles.warningText}>
            <p>您的学习计划积压了过多未完成的任务，系统建议重新制定计划。</p>
            <div className={styles.statsInfo}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>剩余题目：</span>
                <span className={styles.statValue}>{remainingProblems} 道</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.recoverySection}>
          <h4 className={styles.sectionTitle}>
            <RefreshCw size={16} />
            恢复计划设置
          </h4>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Calendar size={14} />
              开始日期
            </label>
            <DatePicker
              value={dayjs(startDate)}
              onChange={(date) => setStartDate(date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'))}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="选择开始日期"
            />
            <span className={styles.hint}>选择恢复计划的开始日期</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Calendar size={14} />
              新计划天数
            </label>
            <InputNumber
              value={duration}
              onChange={(value) => setDuration(value || 14)}
              min={1}
              max={90}
              style={{ width: '100%' }}
              placeholder="输入计划天数"
            />
            <span className={styles.hint}>建议根据剩余题目数量合理安排</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Target size={14} />
              学习强度
            </label>
            <Select
              value={intensity}
              onChange={setIntensity}
              options={intensityOptions}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className={styles.actionButtons}>
          <Button 
            onClick={onClose}
            style={{ marginRight: '12px' }}
          >
            放弃计划
          </Button>
          <Button 
            type="primary"
            onClick={handleRecover}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            恢复计划
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PlanRecoveryModal
