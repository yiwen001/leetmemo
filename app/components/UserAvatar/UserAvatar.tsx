'use client'

import { User } from 'lucide-react'
import styles from './UserAvatar.module.sass'

interface UserAvatarProps {
  image?: string | null
  name?: string | null
  size?: number
  className?: string
}

// 预设头像选项（与SettingsModal保持一致）
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

export default function UserAvatar({ image, name, size = 40, className = '' }: UserAvatarProps) {
  // 如果是传统的URL图片
  if (image && (image.startsWith('http') || image.startsWith('data:'))) {
    return (
      <img 
        src={image} 
        alt={name || 'User'} 
        className={`${styles.avatarImage} ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  // 如果是我们的预设头像ID
  if (image) {
    const option = AVATAR_OPTIONS.find(opt => opt.id === image)
    if (option) {
      if (option.type === 'emoji') {
        return (
          <div 
            className={`${styles.emojiAvatar} ${className}`}
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
            className={`${styles.colorAvatar} ${className}`}
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
  }

  // 默认头像
  return (
    <div 
      className={`${styles.defaultAvatar} ${className}`}
      style={{ width: size, height: size }}
    >
      <User size={size * 0.5} />
    </div>
  )
}
