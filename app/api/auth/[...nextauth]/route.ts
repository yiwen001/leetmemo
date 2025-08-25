import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { createClient } from '@supabase/supabase-js'

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions ={
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('开始 signIn 回调', { user, account })
  
  if (account?.provider === 'github') {
    try {
      // 检查用户是否已存在
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('github_id', account.providerAccountId)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 是"没有找到记录"的错误，这是正常的
        console.error('查询用户错误:', fetchError)
        // 不要因为查询错误就拒绝登录
        return true
      }

      if (!existingUser) {
        console.log('创建新用户', user)
        
        // 创建新用户
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              github_id: account.providerAccountId,
              provider: 'github',
            }
          ])
          .select()
          .single()

        if (insertError) {
          console.error('创建用户错误:', insertError)
          // 即使创建失败，也允许用户登录
          return true
        }

        try {
          // 创建用户统计记录
          await supabase
            .from('user_stats')
            .insert([{ user_id: newUser.id }])
        } catch (statsError) {
          console.error('创建统计记录错误:', statsError)
          // 统计记录创建失败不应阻止登录
        }

        if (newUser) {
          user.id = newUser.id
        }
      } else {
        console.log('更新现有用户', existingUser)
        
        // 更新现有用户信息
        try {
          await supabase
            .from('users')
            .update({
              name: user.name,
              avatar_url: user.image,
              updated_at: new Date().toISOString(),
            })
            .eq('github_id', account.providerAccountId)
        } catch (updateError) {
          console.error('更新用户错误:', updateError)
          // 更新失败不应阻止登录
        }

        user.id = existingUser.id
      }

      return true
    } catch (error) {
      console.error('SignIn 过程中的错误:', error)
      // 即使出错，也允许用户登录
      return true
    }
  }
  
  // 对于其他提供商，也允许登录
  return true
    },

    async session({ session, token }) {
      if (session?.user && token?.sub) {
        // 从数据库获取用户的完整信息
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('github_id', token.sub)
          .single()

        if (user) {
          session.user.id = user.id
          session.user.name = user.name
          session.user.email = user.email
          session.user.image = user.avatar_url
        }
      }
      return session
    },

    async jwt({ user, token, account }) {
      if (account?.provider === 'github') {
        token.sub = account.providerAccountId
      }
      return token
    },
  },
  
  pages: {
    signIn: '/login',
  },
  
  session: {
    strategy: 'jwt',
  },
}
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }