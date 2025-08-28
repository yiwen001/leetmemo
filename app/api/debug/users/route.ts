import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('开始查询用户数据...')
    
    // 测试数据库连接
    await prisma.$connect()
    console.log('数据库连接成功')
    
    // 查询所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        githubId: true,
        giteeId: true,
        provider: true,
        createdAt: true,
      }
    })
    
    console.log('查询到的用户数据:', users)
    
    return NextResponse.json({
      success: true,
      count: users.length,
      users: users,
      message: `找到 ${users.length} 个用户`
    })
    
  } catch (error) {
    console.error('查询用户数据失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: '查询用户数据失败'
    }, { status: 500 })
  }
}
