// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// // 类型定义
// export type Database = {
//   public: {
//     Tables: {
//       users: {
//         Row: {
//           id: string
//           email: string
//           name: string | null
//           avatar_url: string | null
//           provider: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           email: string
//           name?: string | null
//           avatar_url?: string | null
//           provider?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           id?: string
//           email?: string
//           name?: string | null
//           avatar_url?: string | null
//           provider?: string | null
//           updated_at?: string
//         }
//       }
//       problems: {
//         Row: {
//           id: string
//           user_id: string
//           title: string
//           url: string
//           notes: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           user_id: string
//           title: string
//           url: string
//           notes?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           id?: string
//           user_id?: string
//           title?: string
//           url?: string
//           notes?: string | null
//           updated_at?: string
//         }
//       }
//       reviews: {
//         Row: {
//           id: string
//           user_id: string
//           problem_id: string
//           review_date: string
//           completed: boolean
//           completed_at: string | null
//           review_count: number
//           created_at: string
//         }
//         Insert: {
//           id?: string
//           user_id: string
//           problem_id: string
//           review_date: string
//           completed?: boolean
//           completed_at?: string | null
//           review_count?: number
//           created_at?: string
//         }
//         Update: {
//           id?: string
//           user_id?: string
//           problem_id?: string
//           review_date?: string
//           completed?: boolean
//           completed_at?: string | null
//           review_count?: number
//         }
//       }
//     }
//   }
// }