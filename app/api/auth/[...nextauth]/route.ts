import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GiteeProvider from '@/lib/gitee-provider'
import { prisma } from '@/lib/prisma'

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GiteeProvider({
      clientId: process.env.GITEE_ID!,
      clientSecret: process.env.GITEE_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('=== SignIn 回调开始 ===')
      console.log('Provider:', account?.provider)
      console.log('User:', user)
      
      if (account?.provider === 'github' || account?.provider === 'gitee') {
        try {
          // 根据提供商查找用户
          let existingUser
          if (account.provider === 'github') {
            existingUser = await prisma.user.findUnique({
              where: { githubId: account.providerAccountId }
            })
          } else if (account.provider === 'gitee') {
            existingUser = await prisma.user.findUnique({
              where: { giteeId: account.providerAccountId }
            })
          }

          if (!existingUser) {
            console.log('创建新用户...')
            
            const userData: any = {
              email: user.email!,
              name: user.name!,
              avatarUrl: user.image,
              provider: account.provider,
            }
            
            // 根据提供商设置对应的ID字段
            if (account.provider === 'github') {
              userData.githubId = account.providerAccountId
            } else if (account.provider === 'gitee') {
              userData.giteeId = account.providerAccountId
            }

            existingUser = await prisma.user.create({
              data: userData
            })

            console.log('新用户创建成功:', existingUser.id)
          } else {
            console.log('使用现有用户:', existingUser.id)
          }

          user.id = existingUser.id
          return true
          
        } catch (error) {
          console.error('SignIn 回调失败:', error)
          return true
        }
      }
      
      return true
    },

    async session({ session, token }) {
      // 将用户ID添加到session中，并从数据库获取最新用户信息
      if (session?.user && token?.userId) {
        session.user.id = token.userId
        
        try {
          // 从数据库获取最新的用户信息
          const user = await prisma.user.findUnique({
            where: { id: token.userId },
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          })
          
          if (user) {
            session.user.name = user.name
            session.user.email = user.email
            session.user.image = user.avatarUrl
          }
        } catch (error) {
          console.error('获取用户信息失败:', error)
        }
      }
      console.log('Session回调 - 最终session:', session)
      return session
    },

    async jwt({ user, token, account }) {
      if (account?.provider === 'github' || account?.provider === 'gitee') {
        token.sub = account.providerAccountId
        token.provider = account.provider
      }

      // 在首次登录时保存用户ID到token
      if (user?.id) {
        token.userId = user.id
        console.log('JWT回调 - 保存用户ID到token:', user.id)
      }

      return token
    },
  },
  
  pages: {
    signIn: '/login',
  },
  
  debug: false,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }