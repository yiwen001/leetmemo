import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 从URL解析slug
function parseSlug(url: string): string {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/problems\/([^\/]+)/)
    if (match) {
      return match[1] // 返回slug，如 "two-sum" 或 "1-two-sum"
    }
  } catch (e) {
    // 无效URL
  }
  return ''
}

// 从slug解析题目编号
function parseNumberFromSlug(slug: string): number | null {
  const numberMatch = slug.match(/^(\d+)/)
  return numberMatch ? parseInt(numberMatch[1]) : null
}

// 从slug生成标题
function parseTitle(slug: string): string {
  // 移除开头的数字和连字符
  const titlePart = slug.replace(/^\d+-/, '')
  // 将连字符替换为空格，并转换为标题格式
  return titlePart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// 尝试从LeetCode GraphQL API获取题目信息
async function fetchFromLeetCodeAPI(slug: string) {
  try {
    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
        }
      }
    `

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug: slug }
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.data?.question) {
      const question = data.data.question
      return {
        number: parseInt(question.questionFrontendId),
        title: question.title,
        difficulty: question.difficulty.toLowerCase(),
        category: question.topicTags?.[0]?.name || 'Array',
        tags: question.topicTags?.map((tag: any) => tag.name) || []
      }
    }
  } catch (error) {
    console.log('LeetCode API fetch failed:', error instanceof Error ? error.message : 'Unknown error')
    // API失败时不抛出错误，而是返回null让后续逻辑处理
  }
  
  return null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL参数是必需的'
      }, { status: 400 })
    }

    const slug = parseSlug(url)
    if (!slug) {
      return NextResponse.json({
        success: false,
        error: '无效的LeetCode URL'
      }, { status: 400 })
    }

    // 1. 首先从数据库查找
    const existingProblem = await prisma.leetCodeProblem.findFirst({
      where: { slug }
    })

    if (existingProblem) {
      return NextResponse.json({
        success: true,
        source: 'database',
        data: {
          slug,
          number: existingProblem.number,
          title: existingProblem.title,
          titleCn: existingProblem.titleCn,
          difficulty: existingProblem.difficulty,
          category: existingProblem.category,
          tags: existingProblem.tags
        }
      })
    }

    // 2. 尝试从LeetCode API获取
    const apiData = await fetchFromLeetCodeAPI(slug)
    
    if (apiData) {
      return NextResponse.json({
        success: true,
        source: 'leetcode_api',
        data: {
          slug,
          number: apiData.number,
          title: apiData.title,
          titleCn: '', // API不提供中文标题
          difficulty: apiData.difficulty,
          category: apiData.category,
          tags: apiData.tags
        }
      })
    }

    // 3. 回退到URL解析
    const parsedNumber = parseNumberFromSlug(slug)
    const parsedTitle = parseTitle(slug)

    return NextResponse.json({
      success: true,
      source: 'url_parsing',
      data: {
        slug,
        number: parsedNumber,
        title: parsedTitle,
        titleCn: '',
        difficulty: 'medium', // 默认难度
        category: 'Array', // 默认分类
        tags: []
      }
    })

  } catch (error) {
    console.error('解析题目信息失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    }, { status: 500 })
  }
}
