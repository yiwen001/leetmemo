import { supabase } from './supabase'

export async function testConnection() {
  try {
    // 修复：使用正确的Supabase语法
    const { data, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('数据库连接失败:', error)
      return false
    }
    
    console.log('数据库连接成功!')
    return true
  } catch (err) {
    console.error('连接测试失败:', err)
    return false
  }
}