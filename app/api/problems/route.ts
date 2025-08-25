import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

// 导入 NextAuth 配置
import { authOptions } from '../auth/[...nextauth]/route'

// 使用 service role key 确保有足够权限
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 改用 service role key
)

export async function POST(request: NextRequest) {
  try {
    // 传入 authOptions 配置
    const session = await getServerSession(authOptions)
    
    console.log('API Session:', session) // 添加调试日志
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 获取请求数据
    const { url, notes } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: '缺少题目链接' }, { status: 400 })
    }

    // 从 URL 提取题目标题
    const extractTitle = (url: string) => {
      try {
        const match = url.match(/problems\/([^\/]+)/)
        if (match) {
          return match[1]
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
        return '未知题目'
      } catch {
        return '未知题目'
      }
    }

    console.log('查找用户，邮箱:', session.user.email) // 调试日志

    // 根据邮箱查找用户ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', session.user.email)
      .single()

    console.log('用户查询结果:', { user, userError }) // 调试日志

    if (userError || !user) {
      console.error('用户查询错误:', userError)
      return NextResponse.json({ 
        error: '用户不存在', 
        debug: { email: session.user.email, userError } 
      }, { status: 404 })
    }

    const title = extractTitle(url)

    // 插入题目
    const { data: problem, error } = await supabase
      .from('problems')
      .insert([
        {
          user_id: user.id,
          title: title,
          url: url,
          notes: notes || ''
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('插入题目错误:', error)
      return NextResponse.json({ error: '添加题目失败', debug: error }, { status: 500 })
    }

    return NextResponse.json({ 
      message: '题目添加成功', 
      problem: problem 
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器错误', debug: error.message }, { status: 500 })
  }
}