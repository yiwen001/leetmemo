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
      {/* 左侧装饰区域 */}
      <div className={styles.leftPanel}>
        <div className={styles.decoration}>
          <div className={styles.logo}>
            <Code2 size={48} />
            <h1>LeetMemo</h1>
          </div>
          <p className={styles.tagline}>
            使用艾宾浩斯遗忘曲线
            <br />
            高效复习 LeetCode 题目
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <Sparkles size={20} />
              <span>智能复习计划</span>
            </div>
            <div className={styles.feature}>
              <Sparkles size={20} />
              <span>Markdown 笔记</span>
            </div>
            <div className={styles.feature}>
              <Sparkles size={20} />
              <span>进度追踪</span>
            </div>
          </div>
        </div>
        
        {/* 装饰性圆圈 */}
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>

      {/* 右侧登录区域 */}
      <div className={styles.rightPanel}>
        <div className={styles.loginBox}>
          <div className={styles.loginHeader}>
            <h2>欢迎来到 LeetMemo</h2>
            <p>使用 Gitee 账号快速开始</p>
          </div>

          <div className={styles.loginContent}>
            {/* GitHub 登录按钮 */}
            {/* <button 
              className={styles.githubButton}
              onClick={handleGithubLogin}
              disabled={isLoading}
            >
              <Github size={20} />
              <span>{isLoading ? '登录中...' : '使用 GitHub 登录'}</span>
              <ArrowRight size={16} className={styles.arrow} />
            </button> */}
            <button 
  className={styles.giteeButton}
  onClick={handleGiteeLogin}
  disabled={isLoading}
 
>
  <span>🦄</span>
  <span>{isLoading ? '登录中...' : '使用 Gitee 登录'}</span>
</button>

            {/* <div className={styles.divider}>
              <span>或</span>
            </div> */}

            {/* 游客模式 */}
            {/* <button 
              className={styles.guestButton}
              onClick={() => {
                localStorage.setItem('guestMode', 'true')
                localStorage.setItem('guestUser', JSON.stringify({
                  id: 'guest',
                  name: '游客用户',
                  email: 'guest@leetmemo.com',
                  isGuest: true
                }))
                message.success('已进入游客模式')
                router.push('/')
              }}
            >
              先随便看看 →
            </button> */}
          </div>

          {/* <div className={styles.loginFooter}>
            <p className={styles.description}>
              登录后可以同步您的复习进度，享受完整功能
            </p>
            <p className={styles.terms}>
              登录即表示你同意我们的
              <a href="#" onClick={(e) => e.preventDefault()}>服务条款</a>
              和
              <a href="#" onClick={(e) => e.preventDefault()}>隐私政策</a>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  )
}