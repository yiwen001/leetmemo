// lib/default-study-plan.ts

// 默认学习计划：LeetCode 速通 30 题
// 这些题目的 slug 对应数据库中的 LeetCodeProblem 记录
export const DEFAULT_PROBLEM_SLUGS = [
  // 必刷基础题（10道）
  "two-sum",
  "valid-parentheses", 
  "merge-two-sorted-lists",
  "maximum-subarray",
  "climbing-stairs",
  "binary-tree-level-order-traversal",
  "maximum-depth-of-binary-tree",
  "best-time-to-buy-and-sell-stock",
  "linked-list-cycle",
  "reverse-linked-list",

  // 高频中等题（15道）
  "longest-substring-without-repeating-characters",
  "longest-palindromic-substring",
  "container-with-most-water",
  "3sum",
  "generate-parentheses",
  "search-in-rotated-sorted-array",
  "permutations",
  "merge-intervals",
  "subsets",
  "binary-tree-inorder-traversal",
  "validate-binary-search-tree",
  "binary-tree-zigzag-level-order-traversal",
  "lru-cache",
  "number-of-islands",
  "kth-largest-element-in-an-array",

  // 必会难题（5道）
  "trapping-rain-water",
  "minimum-window-substring",
  "binary-tree-maximum-path-sum",
  "sliding-window-maximum",
  "longest-increasing-subsequence"
]

export const DEFAULT_PLAN_CONFIG = {
  problemSlugs: DEFAULT_PROBLEM_SLUGS,
  duration: 30,
  startDate: new Date().toISOString().split('T')[0],
  intensity: 'medium' as const
}