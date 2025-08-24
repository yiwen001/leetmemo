import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    // GitHub 登录
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    
    // 邮箱密码登录（模拟LeetCode登录）
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 这里添加你的验证逻辑
        // 暂时模拟验证
        if (credentials?.email === "demo@example.com" && credentials?.password === "demo123") {
          return {
            id: "1",
            name: "Demo User",
            email: credentials.email,
          }
        }
        return null
      }
    })
  ],
  
  pages: {
    signIn: '/login',
  },
  
  callbacks: {
    async session({ session, token }) {
      return session
    },
  },
})

export { handler as GET, handler as POST }