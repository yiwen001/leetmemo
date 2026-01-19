'use client'

import { useState } from 'react'
import { Github, Code2, ArrowRight, Sparkles } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { message } from 'antd'
import { useRouter } from 'next/navigation'
import styles from './login.module.scss'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const handleGiteeLogin = async () => {
  setIsLoading(true)
  try {
    console.log('开始 Gitee 登录...')
    await signIn('gitee', { callbackUrl: '/' })
  } catch (error) {
    console.error('Gitee 登录错误:', error)
    message.error('Gitee 登录失败')
  } finally {
    setIsLoading(false)
  }
}
  // GitHub 登录
  const handleGithubLogin = async () => {
    try {
      setIsLoading(true)
      console.log('开始GitHub登录...')
      // 在文件开头添加
          console.log('=== NextAuth 环境变量检查 ===')
          console.log('GITHUB_ID:', process.env.GITHUB_ID ? '✅' : '❌')
          console.log('GITHUB_SECRET:', process.env.GITHUB_SECRET ? '✅' : '❌')
  

      const result = await signIn('github', {
        callbackUrl: '/',
        redirect: false 
      })

      console.log('登录结果:', result)

      if (result?.error) {
        console.error('登录错误:', result.error)
        message.error('登录失败，请重试')
      } else if (result?.ok) {
        message.success('登录成功！')
        router.push('/')
      }
    } catch (error) {
      console.error('登录过程中出错:', error)
      message.error('登录过程中出现错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* 居中登录框 */}
      <div className={styles.loginBox}>
        <div className={styles.decoration}>
          <div className={styles.logo}>
            <img src="/lemon.svg" alt="Lemon Logo" className={styles.lemonIcon} style={{ width: 80, height: 80 }} />
            <h1>LeetMemo</h1>
          </div>
          <p className={styles.tagline}>
             保持清醒，高效复习 
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <Sparkles size={16} />
              <span>智能复习</span>
            </div>
            <div className={styles.feature}>
              <Sparkles size={16} />
              <span>清爽笔记</span>
            </div>
            <div className={styles.feature}>
              <Sparkles size={16} />
              <span>进度追踪</span>
            </div>
          </div>
        </div>

        <div className={styles.loginContent}>
          <button 
            className={styles.giteeButton}
            onClick={handleGiteeLogin}
            disabled={isLoading}
          >
            <span style={{ fontSize: '1.5rem' }}>🍋</span>
            <span>{isLoading ? '登录中...' : '使用 Gitee 登录'}</span>
          </button>
        </div>
      </div>
      
    </div>
  )
}