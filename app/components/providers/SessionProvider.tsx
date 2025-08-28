'use client'

import { SessionProvider } from 'next-auth/react'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // 5分钟刷新一次
      refetchOnWindowFocus={false} // 窗口聚焦时不刷新
    >
      {children}
    </SessionProvider>
  )
}