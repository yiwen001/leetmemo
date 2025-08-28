import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('开始测试用户创建...')
    
    // 测试数据库连接
    await prisma.$connect()
    console.log('数据库连接成功')
    
    // 创建测试用户
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        githubId: 'test-github-id-' + Date.now(),
        provider: 'github',
      }
    })
    
    console.log('测试用户创建成功:', testUser)
    
    return NextResponse.json({
      success: true,
      user: testUser,
      message: '测试用户创建成功'
    })
    
  } catch (error) {
    console.error('创建测试用户失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: '创建测试用户失败'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: '请使用 POST 方法创建测试用户'
  })
}
