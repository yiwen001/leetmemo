import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const problems = await prisma.leetCodeProblem.findMany({
      orderBy: [
        { difficulty: 'asc' },
        { number: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      problems,
      count: problems.length
    })

  } catch (error) {
    console.error('获取题库失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
