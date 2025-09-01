import { NextResponse } from 'next/server'

// 全局模拟日期变量
let mockDate: Date | null = null

export function getMockDate(): Date | null {
  return mockDate
}

export function getCurrentDate(): Date {
  return mockDate || new Date()
}

export async function POST(request: Request) {
  try {
    const { date, reset } = await request.json()
    
    if (reset) {
      mockDate = null
      return NextResponse.json({
        success: true,
        message: '已重置为真实时间',
        currentMockDate: null,
        realDate: new Date().toISOString()
      })
    }
    
    if (date) {
      mockDate = new Date(date)
      return NextResponse.json({
        success: true,
        message: `模拟日期已设置为: ${mockDate.toISOString()}`,
        currentMockDate: mockDate.toISOString(),
        realDate: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: false,
      error: '请提供日期或重置标志'
    }, { status: 400 })
    
  } catch (error) {
    console.error('设置模拟日期失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    currentMockDate: mockDate?.toISOString() || null,
    realDate: new Date().toISOString(),
    effectiveDate: getCurrentDate().toISOString()
  })
}
