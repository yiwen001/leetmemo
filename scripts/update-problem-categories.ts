import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始更新题目分类...')

  const studyRecords = await prisma.studyRecord.findMany({
    include: {
      leetcodeProblem: true,
      user: true
    }
  })

  console.log(`找到 ${studyRecords.length} 条学习记录`)

  let updatedCount = 0
  for (const record of studyRecords) {
    const problemCategory = record.leetcodeProblem.category || '未分类'
    
    if (record.category === '未分类' && problemCategory !== '未分类') {
      await prisma.studyRecord.update({
        where: { id: record.id },
        data: { category: problemCategory }
      })
      
      updatedCount++
      console.log(`更新记录 ${record.id}: ${record.leetcodeProblem.title} -> ${problemCategory}`)
    }
  }

  console.log(`更新完成！共更新 ${updatedCount} 条记录`)
}

main()
  .catch((e) => {
    console.error('更新失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })