'use client'

import { useState } from 'react'
import { Github, Code2, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { message } from 'antd'
import { useRouter } from 'next/navigation'
import styles from './login.module.scss'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loginType, setLoginType] = useState<'oauth' | 'email'>('oauth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // GitHub 登录
  const handleGithubLogin = async () => {
    setIsLoading(true)
    try {
      await signIn('github', { callbackUrl: '/' })
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 模拟 LeetCode 登录（实际上是邮箱登录）
  const handleLeetCodeLogin = async () => {
    if (!email || !password) {
      message.warning('请填写邮箱和密码')
      return
    }
    
    setIsLoading(true)
    try {
      // 这里可以改为实际的邮箱登录逻辑
      await signIn('credentials', {
        email,
        password,
        callbackUrl: '/'
      })
    } catch (error) {
      message.error('登录失败，请检查邮箱和密码')
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
            <h2>欢迎回来</h2>
            <p>选择你喜欢的方式登录</p>
          </div>

          {/* 登录方式切换 */}
          <div className={styles.loginTabs}>
            <button 
              className={`${styles.tab} ${loginType === 'oauth' ? styles.activeTab : ''}`}
              onClick={() => setLoginType('oauth')}
            >
              快速登录
            </button>
            <button 
              className={`${styles.tab} ${loginType === 'email' ? styles.activeTab : ''}`}
              onClick={() => setLoginType('email')}
            >
              邮箱登录
            </button>
          </div>

          {loginType === 'oauth' ? (
            <div className={styles.oauthButtons}>
              {/* GitHub 登录 */}
              <button 
                className={styles.githubButton}
                onClick={handleGithubLogin}
                disabled={isLoading}
              >
                <Github size={20} />
                <span>使用 GitHub 登录</span>
                <ArrowRight size={16} className={styles.arrow} />
              </button>

              {/* LeetCode 风格登录按钮 */}
              <button 
                className={styles.leetcodeButton}
                onClick={() => setLoginType('email')}
                disabled={isLoading}
              >
                <div className={styles.leetcodeLogo}>
                  <Code2 size={20} />
                </div>
                <span>使用 LeetCode 账号登录</span>
                <ArrowRight size={16} className={styles.arrow} />
              </button>

              <div className={styles.divider}>
                <span>或</span>
              </div>

              {/* 游客模式 */}
              <button 
                className={styles.guestButton}
                onClick={() => {
                  // 设置游客模式标识
                  localStorage.setItem('guestMode', 'true')
                  localStorage.setItem('guestUser', JSON.stringify({
                    name: '游客用户',
                    email: 'guest@leetmemo.com',
                    isGuest: true
                  }))
                  message.success('已进入游客模式')
                  router.push('/')
                }}
              >
                先随便看看 →
              </button>
            </div>
          ) : (
            <div className={styles.emailForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email">邮箱</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} />
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLeetCodeLogin()}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">密码</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} />
                  <input
                    id="password"
                    type="password"
                    placeholder="输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLeetCodeLogin()}
                  />
                </div>
              </div>

              <button 
                className={styles.submitButton}
                onClick={handleLeetCodeLogin}
                disabled={isLoading}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>

              <div className={styles.formFooter}>
                <a href="#" onClick={(e) => {
                  e.preventDefault()
                  message.info('找回密码功能开发中...')
                }}>
                  忘记密码？
                </a>
                <a href="#" onClick={(e) => {
                  e.preventDefault()
                  message.info('注册功能开发中...')
                }}>
                  注册账号
                </a>
              </div>
            </div>
          )}

          <div className={styles.loginFooter}>
            <p>
              登录即表示你同意我们的
              <a href="#">服务条款</a>
              和
              <a href="#">隐私政策</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}