import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const startTime = Date.now()
  
  try {
    // 测试简单查询
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    return NextResponse.json({
      duration: `${duration}ms`,
      success: !error,
      error: error?.message,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    return NextResponse.json({
      duration: `${duration}ms`,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}