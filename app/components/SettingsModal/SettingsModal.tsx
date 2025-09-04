'use client'

import { useState, useEffect } from 'react'
import { Modal, Input, Button, message, Avatar } from 'antd'
import { User, Camera } from 'lucide-react'
import styles from './SettingsModal.module.sass'

interface SettingsModalProps {
  visible: boolean
  onClose: () => void
  currentUser: {
    name: string
    email: string
    image?: string
  }
  onUpdate: (data: { name: string; image: string }) => void
}

// 预设头像选项
const AVATAR_OPTIONS = [
  { id: 'emoji-1', type: 'emoji', value: '😊', label: '开心' },
  { id: 'emoji-2', type: 'emoji', value: '🤓', label: '学霸' },
  { id: 'emoji-3', type: 'emoji', value: '😎', label: '酷炫' },
  { id: 'emoji-4', type: 'emoji', value: '🥳', label: '庆祝' },
  { id: 'emoji-5', type: 'emoji', value: '🚀', label: '火箭' },
  { id: 'emoji-6', type: 'emoji', value: '💻', label: '程序员' },
  { id: 'emoji-7', type: 'emoji', value: '🎯', label: '目标' },
  { id: 'emoji-8', type: 'emoji', value: '⚡', label: '闪电' },
  { id: 'color-1', type: 'color', value: '#667eea', label: '紫蓝' },
  { id: 'color-2', type: 'color', value: '#f093fb', label: '粉紫' },
  { id: 'color-3', type: 'color', value: '#4facfe', label: '天蓝' },
  { id: 'color-4', type: 'color', value: '#43e97b', label: '翠绿' },
  { id: 'color-5', type: 'color', value: '#fa709a', label: '粉红' },
  { id: 'color-6', type: 'color', value: '#ffecd2', label: '米黄' },
  { id: 'color-7', type: 'color', value: '#a8edea', label: '薄荷' },
  { id: 'color-8', type: 'color', value: '#d299c2', label: '淡紫' },
]

export default function SettingsModal({ visible, onClose, currentUser, onUpdate }: SettingsModalProps) {
  const [name, setName] = useState(currentUser.name)
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.image || 'emoji-1')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      setName(currentUser.name)
      setSelectedAvatar(currentUser.image || 'emoji-1')
    }
  }, [visible, currentUser])

  const handleSave = async () => {
    if (!name.trim()) {
      message.error('请输入用户名')
      return
    }

    setLoading(true)
    try {
      await onUpdate({
        name: name.trim(),
        image: selectedAvatar
      })
      message.success('设置保存成功')
      onClose()
    } catch (error) {
      console.error('保存设置失败:', error)
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const renderAvatar = (option: typeof AVATAR_OPTIONS[0], size: number = 40) => {
    if (option.type === 'emoji') {
      return (
        <div 
          className={styles.emojiAvatar}
          style={{ 
            width: size, 
            height: size, 
            fontSize: size * 0.6,
            lineHeight: `${size}px`
          }}
        >
          {option.value}
        </div>
      )
    } else {
      return (
        <div 
          className={styles.colorAvatar}
          style={{ 
            width: size, 
            height: size,
            background: `linear-gradient(135deg, ${option.value} 0%, ${option.value}dd 100%)`
          }}
        >
          <User size={size * 0.5} color="white" />
        </div>
      )
    }
  }

  const selectedOption = AVATAR_OPTIONS.find(opt => opt.id === selectedAvatar) || AVATAR_OPTIONS[0]

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <User size={20} />
          <span>个人设置</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      className={styles.settingsModal}
    >
      <div className={styles.modalContent}>
        {/* 用户名设置 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>用户名</h3>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入用户名"
            className={styles.nameInput}
            maxLength={20}
          />
        </div>

        {/* 头像设置 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Camera size={16} />
            选择头像
          </h3>
          
          {/* 当前头像预览 */}
          <div className={styles.currentAvatar}>
            <span className={styles.previewLabel}>当前头像：</span>
            {renderAvatar(selectedOption, 60)}
            <span className={styles.avatarLabel}>{selectedOption.label}</span>
          </div>

          {/* 头像选项 */}
          <div className={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((option) => (
              <div
                key={option.id}
                className={`${styles.avatarOption} ${selectedAvatar === option.id ? styles.selected : ''}`}
                onClick={() => setSelectedAvatar(option.id)}
                title={option.label}
              >
                {renderAvatar(option, 40)}
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Button onClick={onClose} className={styles.cancelButton}>
            取消
          </Button>
          <Button 
            type="primary" 
            onClick={handleSave}
            loading={loading}
            className={styles.saveButton}
          >
            保存设置
          </Button>
        </div>
      </div>
    </Modal>
  )
}
