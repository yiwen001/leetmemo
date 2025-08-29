import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const leetcodeProblems = [
  // 数组类题目
  {
    number: 1,
    title: "Two Sum",
    titleCn: "两数之和",
    difficulty: "easy",
    url: "https://leetcode.com/problems/two-sum/",
    tags: ["Array", "Hash Table"],
    category: "数组"
  },
  {
    number: 15,
    title: "3Sum",
    titleCn: "三数之和",
    difficulty: "medium",
    url: "https://leetcode.com/problems/3sum/",
    tags: ["Array", "Two Pointers"],
    category: "数组"
  },
  {
    number: 26,
    title: "Remove Duplicates from Sorted Array",
    titleCn: "删除有序数组中的重复项",
    difficulty: "easy",
    url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
    tags: ["Array", "Two Pointers"],
    category: "数组"
  },
  {
    number: 53,
    title: "Maximum Subarray",
    titleCn: "最大子数组和",
    difficulty: "medium",
    url: "https://leetcode.com/problems/maximum-subarray/",
    tags: ["Array", "Dynamic Programming"],
    category: "数组"
  },
  {
    number: 121,
    title: "Best Time to Buy and Sell Stock",
    titleCn: "买卖股票的最佳时机",
    difficulty: "easy",
    url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    tags: ["Array", "Dynamic Programming"],
    category: "数组"
  },
  
  // 链表类题目
  {
    number: 2,
    title: "Add Two Numbers",
    titleCn: "两数相加",
    difficulty: "medium",
    url: "https://leetcode.com/problems/add-two-numbers/",
    tags: ["Linked List", "Math"],
    category: "链表"
  },
  {
    number: 21,
    title: "Merge Two Sorted Lists",
    titleCn: "合并两个有序链表",
    difficulty: "easy",
    url: "https://leetcode.com/problems/merge-two-sorted-lists/",
    tags: ["Linked List", "Recursion"],
    category: "链表"
  },
  {
    number: 206,
    title: "Reverse Linked List",
    titleCn: "反转链表",
    difficulty: "easy",
    url: "https://leetcode.com/problems/reverse-linked-list/",
    tags: ["Linked List", "Recursion"],
    category: "链表"
  },
  {
    number: 141,
    title: "Linked List Cycle",
    titleCn: "环形链表",
    difficulty: "easy",
    url: "https://leetcode.com/problems/linked-list-cycle/",
    tags: ["Linked List", "Two Pointers"],
    category: "链表"
  },
  {
    number: 142,
    title: "Linked List Cycle II",
    titleCn: "环形链表 II",
    difficulty: "medium",
    url: "https://leetcode.com/problems/linked-list-cycle-ii/",
    tags: ["Linked List", "Two Pointers"],
    category: "链表"
  },

  // 字符串类题目
  {
    number: 3,
    title: "Longest Substring Without Repeating Characters",
    titleCn: "无重复字符的最长子串",
    difficulty: "medium",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    tags: ["String", "Sliding Window"],
    category: "字符串"
  },
  {
    number: 5,
    title: "Longest Palindromic Substring",
    titleCn: "最长回文子串",
    difficulty: "medium",
    url: "https://leetcode.com/problems/longest-palindromic-substring/",
    tags: ["String", "Dynamic Programming"],
    category: "字符串"
  },
  {
    number: 20,
    title: "Valid Parentheses",
    titleCn: "有效的括号",
    difficulty: "easy",
    url: "https://leetcode.com/problems/valid-parentheses/",
    tags: ["String", "Stack"],
    category: "字符串"
  },
  {
    number: 125,
    title: "Valid Palindrome",
    titleCn: "验证回文串",
    difficulty: "easy",
    url: "https://leetcode.com/problems/valid-palindrome/",
    tags: ["String", "Two Pointers"],
    category: "字符串"
  },
  {
    number: 242,
    title: "Valid Anagram",
    titleCn: "有效的字母异位词",
    difficulty: "easy",
    url: "https://leetcode.com/problems/valid-anagram/",
    tags: ["String", "Hash Table"],
    category: "字符串"
  },

  // 树类题目
  {
    number: 94,
    title: "Binary Tree Inorder Traversal",
    titleCn: "二叉树的中序遍历",
    difficulty: "easy",
    url: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    tags: ["Tree", "Stack"],
    category: "树"
  },
  {
    number: 104,
    title: "Maximum Depth of Binary Tree",
    titleCn: "二叉树的最大深度",
    difficulty: "easy",
    url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    tags: ["Tree", "DFS"],
    category: "树"
  },
  {
    number: 226,
    title: "Invert Binary Tree",
    titleCn: "翻转二叉树",
    difficulty: "easy",
    url: "https://leetcode.com/problems/invert-binary-tree/",
    tags: ["Tree", "DFS"],
    category: "树"
  },
  {
    number: 102,
    title: "Binary Tree Level Order Traversal",
    titleCn: "二叉树的层序遍历",
    difficulty: "medium",
    url: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    tags: ["Tree", "BFS"],
    category: "树"
  },
  {
    number: 98,
    title: "Validate Binary Search Tree",
    titleCn: "验证二叉搜索树",
    difficulty: "medium",
    url: "https://leetcode.com/problems/validate-binary-search-tree/",
    tags: ["Tree", "DFS"],
    category: "树"
  },

  // 动态规划类题目
  {
    number: 70,
    title: "Climbing Stairs",
    titleCn: "爬楼梯",
    difficulty: "easy",
    url: "https://leetcode.com/problems/climbing-stairs/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  },
  {
    number: 198,
    title: "House Robber",
    titleCn: "打家劫舍",
    difficulty: "medium",
    url: "https://leetcode.com/problems/house-robber/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  },
  {
    number: 322,
    title: "Coin Change",
    titleCn: "零钱兑换",
    difficulty: "medium",
    url: "https://leetcode.com/problems/coin-change/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  },
  {
    number: 300,
    title: "Longest Increasing Subsequence",
    titleCn: "最长递增子序列",
    difficulty: "medium",
    url: "https://leetcode.com/problems/longest-increasing-subsequence/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  },
  {
    number: 62,
    title: "Unique Paths",
    titleCn: "不同路径",
    difficulty: "medium",
    url: "https://leetcode.com/problems/unique-paths/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  }
]

async function main() {
  console.log('开始导入LeetCode题目数据...')
  
  try {
    // 清空现有数据
    await prisma.leetCodeProblem.deleteMany()
    console.log('已清空现有题目数据')
    
    // 批量插入新数据
    const result = await prisma.leetCodeProblem.createMany({
      data: leetcodeProblems,
      skipDuplicates: true
    })
    
    console.log(`成功导入 ${result.count} 道题目`)
    
    // 验证导入结果
    const count = await prisma.leetCodeProblem.count()
    console.log(`数据库中现有 ${count} 道题目`)
    
  } catch (error) {
    console.error('导入失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
