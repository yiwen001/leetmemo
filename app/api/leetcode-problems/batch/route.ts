import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

interface BatchProblemData {
  slug: string
  url: string
  title: string
  titleCn: string
  difficulty: string
  category: string
  number: number
  tags: string[]
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: '请先登录'
      }, { status: 401 })
    }

    const { problems }: { problems: BatchProblemData[] } = await request.json()

    if (!Array.isArray(problems) || problems.length === 0) {
      return NextResponse.json({
        success: false,
        error: '题目数据不能为空'
      }, { status: 400 })
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []
    const importedSlugs: string[] = [] // 记录所有处理的题目slug
    const newSlugs: string[] = [] // 记录新导入的题目slug

    // 批量处理题目
    for (const problemData of problems) {
      try {
        // 检查题目是否已存在（通过slug或URL）
        const existingProblem = await prisma.leetCodeProblem.findFirst({
          where: {
            OR: [
              { slug: problemData.slug },
              { url: problemData.url }
            ]
          }
        })

        if (existingProblem) {
          skipped++
          importedSlugs.push(existingProblem.slug) // 记录已存在的题目slug
          continue
        }

        // 创建新题目
        await prisma.leetCodeProblem.create({
          data: {
            slug: problemData.slug,
            url: problemData.url,
            title: problemData.title,
            titleCn: problemData.titleCn,
            difficulty: problemData.difficulty,
            category: problemData.category,
            number: problemData.number,
            tags: problemData.tags,
            isPublic: false, // 用户自定义题目默认为私有
            createdBy: session.user.id // 关联到当前用户
          }
        })

        imported++
        importedSlugs.push(problemData.slug) // 记录新导入的题目slug
        newSlugs.push(problemData.slug)
      } catch (error) {
        console.error(`导入题目失败 ${problemData.title}:`, error)
        errors.push(`题目 "${problemData.title}" 导入失败`)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: problems.length,
      importedSlugs, // 返回所有处理的题目slug（包括新导入和已存在的）
      newSlugs, // 返回新导入的题目slug
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('批量导入题目失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
