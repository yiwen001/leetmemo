import { NextResponse } from 'next/server'

// 全局变量存储模拟日期
let mockDate: Date | null = null

export function setMockDate(date: Date) {
  mockDate = date
}

export function getCurrentDate(): Date {
  return mockDate || new Date()
}

export async function GET() {
  const currentDate = getCurrentDate()
  
  return NextResponse.json({
    success: true,
    currentDate: currentDate.toISOString(),
    isMocked: mockDate !== null,
    realDate: new Date().toISOString()
  })
}
