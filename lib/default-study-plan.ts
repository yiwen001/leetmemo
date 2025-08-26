// lib/default-study-plan.ts
import { Problem } from './study-plan-generator'

export const DEFAULT_PROBLEMS: Problem[] = [
  { name: "LeetCode 165. 比较版本号", url: "https://leetcode.cn/problems/compare-version-numbers/" },
  { name: "LeetCode 344. 反转字符串", url: "https://leetcode.cn/problems/reverse-string/" },
  { name: "LeetCode 20. 有效的括号", url: "https://leetcode.cn/problems/valid-parentheses/" },
  { name: "LeetCode 125. 验证回文串", url: "https://leetcode.cn/problems/valid-palindrome/" },
  { name: "LeetCode 283. 移动零", url: "https://leetcode.cn/problems/move-zeroes/" },
  { name: "LeetCode 1. 两数之和", url: "https://leetcode.cn/problems/two-sum/" },
  { name: "LeetCode 3. 无重复最长子串", url: "https://leetcode.cn/problems/longest-substring-without-repeating-characters/" },
  { name: "LeetCode 242. 有效字母异位词", url: "https://leetcode.cn/problems/valid-anagram/" },
  { name: "LeetCode 49. 字母异位词分组", url: "https://leetcode.cn/problems/group-anagrams/" },
  { name: "LeetCode 347. 前K个高频元素", url: "https://leetcode.cn/problems/top-k-frequent-elements/" },
  { name: "LeetCode 155. 最小栈", url: "https://leetcode.cn/problems/min-stack/" },
  { name: "LeetCode 232. 用栈实现队列", url: "https://leetcode.cn/problems/implement-queue-using-stacks/" },
  { name: "LeetCode 206. 反转链表", url: "https://leetcode.cn/problems/reverse-linked-list/" },
  { name: "LeetCode 21. 合并两个有序链表", url: "https://leetcode.cn/problems/merge-two-sorted-lists/" },
  { name: "LeetCode 876. 链表的中间节点", url: "https://leetcode.cn/problems/middle-of-the-linked-list/" },
  { name: "LeetCode 104. 二叉树最大深度", url: "https://leetcode.cn/problems/maximum-depth-of-binary-tree/" },
  { name: "LeetCode 101. 对称二叉树", url: "https://leetcode.cn/problems/symmetric-tree/" },
  { name: "LeetCode 144. 前序遍历", url: "https://leetcode.cn/problems/binary-tree-preorder-traversal/" },
  { name: "LeetCode 94. 中序遍历", url: "https://leetcode.cn/problems/binary-tree-inorder-traversal/" }
]

export const DEFAULT_PLAN_CONFIG = {
  problems: DEFAULT_PROBLEMS,
  duration: 30,
  startDate: new Date().toISOString().split('T')[0],
  intensity: 'medium' as const
}