import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化用户分类...')

  const users = await prisma.user.findMany()
  console.log(`找到 ${users.length} 个用户`)

  for (const user of users) {
    console.log(`处理用户: ${user.email || user.name || user.id}`)

    const existingCategories = await prisma.userCategory.findMany({
      where: {
        userId: user.id
      }
    })

    if (existingCategories.length === 0) {
      console.log(`  为用户创建默认分类...`)

      const defaultCategories = ['数组', '链表', '栈', '队列', '树', '图', '动态规划', '贪心算法', '回溯算法', '二分查找', '哈希表', '字符串', '数学', '位运算', '排序', '搜索']

      for (const categoryName of defaultCategories) {
        await prisma.userCategory.create({
          data: {
            userId: user.id,
            name: categoryName
          }
        })
        console.log(`    创建分类: ${categoryName}`)
      }
    } else {
      console.log(`  用户已有 ${existingCategories.length} 个分类，跳过`)
    }
  }

  console.log('初始化完成！')
}

main()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })