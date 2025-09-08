// import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { createClient } from '@supabase/supabase-js'
// import { authOptions } from '../../auth/[...nextauth]/route'

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

//     // 获取今天需要复习的题目
//     // 这里我们先简单返回用户的所有题目，后面再实现复习逻辑
//     const { data: problems, error: problemsError } = await supabase
//       .from('problems')
//       .select('*')
//       .eq('user_id', user.id)
//       .order('created_at', { ascending: false })
//       .limit(10)

//     if (problemsError) {
//       console.error('获取今日复习错误:', problemsError)
//       return NextResponse.json({ error: '获取复习任务失败' }, { status: 500 })
//     }

//     // 为每个题目添加一些模拟的复习数据
//     const reviewProblems = (problems || []).map((problem, index) => ({
//       id: problem.id,
//       number: index + 1,
//       title: problem.title,
//       url: problem.url,
//       notes: problem.notes || '',
//       reviewCount: Math.floor(Math.random() * 5), // 临时模拟数据
//       lastReviewDate: problem.created_at.split('T')[0],
//       completed: false,
//       addedDate: problem.created_at.split('T')[0]
//     }))

//     return NextResponse.json({
//       reviews: reviewProblems,
//       total: reviewProblems.length
//     })

//   } catch (error) {
//     console.error('API错误:', error)
//     return NextResponse.json({ error: '服务器错误' }, { status: 500 })
//   }
// }