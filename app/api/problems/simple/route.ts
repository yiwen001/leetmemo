// // app/api/problems/optimized/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@supabase/supabase-js'

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// )

// export async function GET(request: NextRequest) {
//   const startTime = Date.now()
  
//   try {
//     const userEmail = request.headers.get('x-user-email')
    
//     if (!userEmail) {
//       return NextResponse.json({ error: '缺少用户信息' }, { status: 400 })
//     }

//     console.log(`开始优化查询，用户: ${userEmail}`)
    
//     // 第一步：先找到用户ID（应该很快，因为email有索引）
//     const userStart = Date.now()
//     const { data: user, error: userError } = await supabase
//       .from('users')
//       .select('id')
//       .eq('email', userEmail)
//       .single()
    
//     console.log(`查找用户耗时: ${Date.now() - userStart}ms`)

//     if (userError || !user) {
//       return NextResponse.json({ error: '用户不存在' }, { status: 404 })
//     }

//     // 第二步：直接用user_id查询题目（应该很快，因为user_id有索引）
//     const problemsStart = Date.now()
//     const { data: problems, error: problemsError } = await supabase
//       .from('problems')
//       .select('id, title, url, notes, created_at') // 明确指定字段，不用 *
//       .eq('user_id', user.id)
//       .order('created_at', { ascending: false })
//       .limit(10)
    
//     console.log(`查询题目耗时: ${Date.now() - problemsStart}ms`)

//     if (problemsError) {
//       console.error('查询题目错误:', problemsError)
//       return NextResponse.json({ error: '查询失败' }, { status: 500 })
//     }

//     // 第三步：快速处理数据
//     const processStart = Date.now()
//     const reviewProblems = (problems || []).map((problem, index) => ({
//       id: problem.id,
//       number: index + 1,
//       title: problem.title,
//       url: problem.url,
//       notes: problem.notes || '',
//       reviewCount: 0,
//       lastReviewDate: problem.created_at.split('T')[0],
//       completed: false,
//       addedDate: problem.created_at.split('T')[0]
//     }))
    
//     console.log(`处理数据耗时: ${Date.now() - processStart}ms`)

//     const totalTime = Date.now() - startTime
//     console.log(`总耗时: ${totalTime}ms`)

//     return NextResponse.json({
//       reviews: reviewProblems,
//       total: reviewProblems.length,
//       stats: {
//         totalProblems: reviewProblems.length,
//         completedToday: 0,
//         streak: 0,
//         totalReviews: 0,
//       },
//       debug: { 
//         totalTime: `${totalTime}ms`,
//         userQueryTime: `${Date.now() - userStart}ms`,
//         problemsQueryTime: `${Date.now() - problemsStart}ms`
//       }
//     })

//   } catch (error) {
//     const totalTime = Date.now() - startTime
//     console.error('API错误:', error)
//     return NextResponse.json({ 
//       error: '服务器错误',
//       debug: { totalTime: `${totalTime}ms` }
//     }, { status: 500 })
//   }
// }