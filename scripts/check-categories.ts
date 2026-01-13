import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('查看学习记录数据...')

  const studyRecords = await prisma.studyRecord.findMany({
    include: {
      leetcodeProblem: true
    }
  })

  console.log(`找到 ${studyRecords.length} 条学习记录\n`)

  for (const record of studyRecords) {
    console.log(`记录 ID: ${record.id}`)
    console.log(`题目: ${record.leetcodeProblem.number}. ${record.leetcodeProblem.titleCn || record.leetcodeProblem.title}`)
    console.log(`学习记录分类: ${record.category}`)
    console.log(`题目分类: ${record.leetcodeProblem.category}`)
    console.log('---')
  }
}

main()
  .catch((e) => {
    console.error('查看失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })