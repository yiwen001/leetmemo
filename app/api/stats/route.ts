// import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { createClient } from '@supabase/supabase-js'
// import { authOptions } from '../auth/[...nextauth]/route'

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// )

// export async function GET() {
//   try {
//     const session = await getServerSession(authOptions)
    
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: '未登录' }, { status: 401 })
//     }

//     // 根据邮箱查找用户ID
//     const { data: user, error: userError } = await supabase
//       .from('users')
//       .select('id')
//       .eq('email', session.user.email)
//       .single()

//     if (userError || !user) {
//       return NextResponse.json({ error: '用户不存在' }, { status: 404 })
//     }

//     // 获取题目总数
//     const { count: totalProblems, error: problemsError } = await supabase
//       .from('problems')
//       .select('*', { count: 'exact', head: true })
//       .eq('user_id', user.id)

//     if (problemsError) {
//       console.error('获取题目统计错误:', problemsError)
//     }

//     // 获取用户统计（如果存在）
//     const { data: userStats, error: statsError } = await supabase
//       .from('user_stats')
//       .select('*')
//       .eq('user_id', user.id)
//       .single()

//     if (statsError && statsError.code !== 'PGRST116') {
//       console.error('获取用户统计错误:', statsError)
//     }

//     // 返回统计数据
//     const stats = {
//       totalProblems: totalProblems || 0,
//       completedToday: userStats?.total_reviews || 0,
//       streak: userStats?.current_streak || 0,
//       totalReviews: userStats?.total_reviews || 0,
//     }

//     return NextResponse.json(stats)

//   } catch (error) {
//     console.error('API错误:', error)
//     return NextResponse.json({ error: '服务器错误' }, { status: 500 })
//   }
// }