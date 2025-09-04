import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const leetcodeProblems = [
  // 数组类题目
  {
    slug: "two-sum",
    number: 1,
    title: "Two Sum",
    titleCn: "两数之和",
    difficulty: "easy",
    url: "https://leetcode.com/problems/two-sum/",
    tags: ["Array", "Hash Table"],
    category: "数组"
  },
  {
    slug: "3sum",
    number: 15,
    title: "3Sum",
    titleCn: "三数之和",
    difficulty: "medium",
    url: "https://leetcode.com/problems/3sum/",
    tags: ["Array", "Two Pointers"],
    category: "数组"
  },
  {
    slug: "remove-duplicates-from-sorted-array",
    number: 26,
    title: "Remove Duplicates from Sorted Array",
    titleCn: "删除有序数组中的重复项",
    difficulty: "easy",
    url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
    tags: ["Array", "Two Pointers"],
    category: "数组"
  },
  {
    slug: "maximum-subarray",
    number: 53,
    title: "Maximum Subarray",
    titleCn: "最大子数组和",
    difficulty: "medium",
    url: "https://leetcode.com/problems/maximum-subarray/",
    tags: ["Array", "Dynamic Programming"],
    category: "数组"
  },
  {
    slug: "best-time-to-buy-and-sell-stock",
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
    slug: "add-two-numbers",
    number: 2,
    title: "Add Two Numbers",
    titleCn: "两数相加",
    difficulty: "medium",
    url: "https://leetcode.com/problems/add-two-numbers/",
    tags: ["Linked List", "Math"],
    category: "链表"
  },
  {
    slug: "merge-two-sorted-lists",
    number: 21,
    title: "Merge Two Sorted Lists",
    titleCn: "合并两个有序链表",
    difficulty: "easy",
    url: "https://leetcode.com/problems/merge-two-sorted-lists/",
    tags: ["Linked List", "Recursion"],
    category: "链表"
  },
  {
    slug: "reverse-linked-list",
    number: 206,
    title: "Reverse Linked List",
    titleCn: "反转链表",
    difficulty: "easy",
    url: "https://leetcode.com/problems/reverse-linked-list/",
    tags: ["Linked List", "Recursion"],
    category: "链表"
  },
  {
    slug: "linked-list-cycle",
    number: 141,
    title: "Linked List Cycle",
    titleCn: "环形链表",
    difficulty: "easy",
    url: "https://leetcode.com/problems/linked-list-cycle/",
    tags: ["Linked List", "Two Pointers"],
    category: "链表"
  },
  {
    slug: "linked-list-cycle-ii",
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
    slug: "longest-substring-without-repeating-characters",
    number: 3,
    title: "Longest Substring Without Repeating Characters",
    titleCn: "无重复字符的最长子串",
    difficulty: "medium",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    tags: ["String", "Sliding Window"],
    category: "字符串"
  },
  {
    slug: "longest-palindromic-substring",
    number: 5,
    title: "Longest Palindromic Substring",
    titleCn: "最长回文子串",
    difficulty: "medium",
    url: "https://leetcode.com/problems/longest-palindromic-substring/",
    tags: ["String", "Dynamic Programming"],
    category: "字符串"
  },
  {
    slug: "valid-parentheses",
    number: 20,
    title: "Valid Parentheses",
    titleCn: "有效的括号",
    difficulty: "easy",
    url: "https://leetcode.com/problems/valid-parentheses/",
    tags: ["String", "Stack"],
    category: "字符串"
  },
  {
    slug: "valid-palindrome",
    number: 125,
    title: "Valid Palindrome",
    titleCn: "验证回文串",
    difficulty: "easy",
    url: "https://leetcode.com/problems/valid-palindrome/",
    tags: ["String", "Two Pointers"],
    category: "字符串"
  },
  {
    slug: "valid-anagram",
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
    slug: "binary-tree-inorder-traversal",
    number: 94,
    title: "Binary Tree Inorder Traversal",
    titleCn: "二叉树的中序遍历",
    difficulty: "easy",
    url: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    tags: ["Tree", "Stack"],
    category: "树"
  },
  {
    slug: "maximum-depth-of-binary-tree",
    number: 104,
    title: "Maximum Depth of Binary Tree",
    titleCn: "二叉树的最大深度",
    difficulty: "easy",
    url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    tags: ["Tree", "DFS"],
    category: "树"
  },
  {
    slug: "invert-binary-tree",
    number: 226,
    title: "Invert Binary Tree",
    titleCn: "翻转二叉树",
    difficulty: "easy",
    url: "https://leetcode.com/problems/invert-binary-tree/",
    tags: ["Tree", "DFS"],
    category: "树"
  },
  {
    slug: "binary-tree-level-order-traversal",
    number: 102,
    title: "Binary Tree Level Order Traversal",
    titleCn: "二叉树的层序遍历",
    difficulty: "medium",
    url: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    tags: ["Tree", "BFS"],
    category: "树"
  },
  {
    slug: "validate-binary-search-tree",
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
    slug: "climbing-stairs",
    number: 70,
    title: "Climbing Stairs",
    titleCn: "爬楼梯",
    difficulty: "easy",
    url: "https://leetcode.com/problems/climbing-stairs/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  },
  {
    slug: "house-robber",
    number: 198,
    title: "House Robber",
    titleCn: "打家劫舍",
    difficulty: "medium",
    url: "https://leetcode.com/problems/house-robber/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  },
  {
    slug: "coin-change",
    number: 322,
    title: "Coin Change",
    titleCn: "零钱兑换",
    difficulty: "medium",
    url: "https://leetcode.com/problems/coin-change/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  },
  {
    slug: "longest-increasing-subsequence",
    number: 300,
    title: "Longest Increasing Subsequence",
    titleCn: "最长递增子序列",
    difficulty: "medium",
    url: "https://leetcode.com/problems/longest-increasing-subsequence/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  },
  {
    slug: "unique-paths",
    number: 62,
    title: "Unique Paths",
    titleCn: "不同路径",
    difficulty: "medium",
    url: "https://leetcode.com/problems/unique-paths/",
    tags: ["Dynamic Programming"],
    category: "动态规划"
  }
]
const additionalLeetcodeProblems = [
  // 数组类题目（补充）
  {
    slug: "container-with-most-water",
    number: 11,
    title: "Container With Most Water",
    titleCn: "盛最多水的容器",
    difficulty: "medium",
    url: "https://leetcode.com/problems/container-with-most-water/",
    tags: ["Array", "Two Pointers"],
    category: "数组"
  },
  {
    slug: "move-zeroes",
    number: 283,
    title: "Move Zeroes",
    titleCn: "移动零",
    difficulty: "easy",
    url: "https://leetcode.com/problems/move-zeroes/",
    tags: ["Array", "Two Pointers"],
    category: "数组"
  },
  {
    slug: "merge-sorted-array",
    number: 88,
    title: "Merge Sorted Array",
    titleCn: "合并两个有序数组",
    difficulty: "easy",
    url: "https://leetcode.com/problems/merge-sorted-array/",
    tags: ["Array", "Two Pointers"],
    category: "数组"
  },
  {
    slug: "find-all-numbers-disappeared-in-an-array",
    number: 448,
    title: "Find All Numbers Disappeared in an Array",
    titleCn: "找到所有数组中消失的数字",
    difficulty: "easy",
    url: "https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/",
    tags: ["Array", "Hash Table"],
    category: "数组"
  },
  {
    slug: "product-of-array-except-self",
    number: 238,
    title: "Product of Array Except Self",
    titleCn: "除自身以外数组的乘积",
    difficulty: "medium",
    url: "https://leetcode.com/problems/product-of-array-except-self/",
    tags: ["Array", "Prefix Sum"],
    category: "数组"
  },

  // 字符串类题目（补充）
  {
    slug: "reverse-string",
    number: 344,
    title: "Reverse String",
    titleCn: "反转字符串",
    difficulty: "easy",
    url: "https://leetcode.com/problems/reverse-string/",
    tags: ["String", "Two Pointers"],
    category: "字符串"
  },
  {
    slug: "first-unique-character-in-a-string",
    number: 387,
    title: "First Unique Character in a String",
    titleCn: "字符串中的第一个唯一字符",
    difficulty: "easy",
    url: "https://leetcode.com/problems/first-unique-character-in-a-string/",
    tags: ["String", "Hash Table"],
    category: "字符串"
  },
  {
    slug: "group-anagrams",
    number: 49,
    title: "Group Anagrams",
    titleCn: "字母异位词分组",
    difficulty: "medium",
    url: "https://leetcode.com/problems/group-anagrams/",
    tags: ["String", "Hash Table"],
    category: "字符串"
  },
  {
    slug: "longest-common-prefix",
    number: 14,
    title: "Longest Common Prefix",
    titleCn: "最长公共前缀",
    difficulty: "easy",
    url: "https://leetcode.com/problems/longest-common-prefix/",
    tags: ["String"],
    category: "字符串"
  },
  {
    slug: "implement-strstr",
    number: 28,
    title: "Find the Index of the First Occurrence in a String",
    titleCn: "找出字符串中第一个匹配项的下标",
    difficulty: "easy",
    url: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",
    tags: ["String", "Two Pointers"],
    category: "字符串"
  },

  // 哈希表类题目（前端常考）
  {
    slug: "contains-duplicate",
    number: 217,
    title: "Contains Duplicate",
    titleCn: "存在重复元素",
    difficulty: "easy",
    url: "https://leetcode.com/problems/contains-duplicate/",
    tags: ["Array", "Hash Table"],
    category: "哈希表"
  },
  {
    slug: "intersection-of-two-arrays",
    number: 349,
    title: "Intersection of Two Arrays",
    titleCn: "两个数组的交集",
    difficulty: "easy",
    url: "https://leetcode.com/problems/intersection-of-two-arrays/",
    tags: ["Array", "Hash Table"],
    category: "哈希表"
  },
  {
    slug: "happy-number",
    number: 202,
    title: "Happy Number",
    titleCn: "快乐数",
    difficulty: "easy",
    url: "https://leetcode.com/problems/happy-number/",
    tags: ["Hash Table", "Math"],
    category: "哈希表"
  },
  {
    slug: "isomorphic-strings",
    number: 205,
    title: "Isomorphic Strings",
    titleCn: "同构字符串",
    difficulty: "easy",
    url: "https://leetcode.com/problems/isomorphic-strings/",
    tags: ["String", "Hash Table"],
    category: "哈希表"
  },
  {
    slug: "word-pattern",
    number: 290,
    title: "Word Pattern",
    titleCn: "单词规律",
    difficulty: "easy",
    url: "https://leetcode.com/problems/word-pattern/",
    tags: ["String", "Hash Table"],
    category: "哈希表"
  },

  // 栈和队列（前端常考）
  {
    slug: "min-stack",
    number: 155,
    title: "Min Stack",
    titleCn: "最小栈",
    difficulty: "medium",
    url: "https://leetcode.com/problems/min-stack/",
    tags: ["Stack", "Design"],
    category: "栈和队列"
  },
  {
    slug: "implement-queue-using-stacks",
    number: 232,
    title: "Implement Queue using Stacks",
    titleCn: "用栈实现队列",
    difficulty: "easy",
    url: "https://leetcode.com/problems/implement-queue-using-stacks/",
    tags: ["Stack", "Queue", "Design"],
    category: "栈和队列"
  },
  {
    slug: "implement-stack-using-queues",
    number: 225,
    title: "Implement Stack using Queues",
    titleCn: "用队列实现栈",
    difficulty: "easy",
    url: "https://leetcode.com/problems/implement-stack-using-queues/",
    tags: ["Stack", "Queue", "Design"],
    category: "栈和队列"
  },
  {
    slug: "daily-temperatures",
    number: 739,
    title: "Daily Temperatures",
    titleCn: "每日温度",
    difficulty: "medium",
    url: "https://leetcode.com/problems/daily-temperatures/",
    tags: ["Array", "Stack"],
    category: "栈和队列"
  },
  {
    slug: "evaluate-reverse-polish-notation",
    number: 150,
    title: "Evaluate Reverse Polish Notation",
    titleCn: "逆波兰表达式求值",
    difficulty: "medium",
    url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/",
    tags: ["Array", "Stack"],
    category: "栈和队列"
  },

  // 二分查找（前端常考）
  {
    slug: "binary-search",
    number: 704,
    title: "Binary Search",
    titleCn: "二分查找",
    difficulty: "easy",
    url: "https://leetcode.com/problems/binary-search/",
    tags: ["Array", "Binary Search"],
    category: "二分查找"
  },
  {
    slug: "search-insert-position",
    number: 35,
    title: "Search Insert Position",
    titleCn: "搜索插入位置",
    difficulty: "easy",
    url: "https://leetcode.com/problems/search-insert-position/",
    tags: ["Array", "Binary Search"],
    category: "二分查找"
  },
  {
    slug: "find-first-and-last-position-of-element-in-sorted-array",
    number: 34,
    title: "Find First and Last Position of Element in Sorted Array",
    titleCn: "在排序数组中查找元素的第一个和最后一个位置",
    difficulty: "medium",
    url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
    tags: ["Array", "Binary Search"],
    category: "二分查找"
  },
  {
    slug: "search-in-rotated-sorted-array",
    number: 33,
    title: "Search in Rotated Sorted Array",
    titleCn: "搜索旋转排序数组",
    difficulty: "medium",
    url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    tags: ["Array", "Binary Search"],
    category: "二分查找"
  },
  {
    slug: "find-minimum-in-rotated-sorted-array",
    number: 153,
    title: "Find Minimum in Rotated Sorted Array",
    titleCn: "寻找旋转排序数组中的最小值",
    difficulty: "medium",
    url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    tags: ["Array", "Binary Search"],
    category: "二分查找"
  },

  // 滑动窗口（前端常考）
  {
    slug: "minimum-window-substring",
    number: 76,
    title: "Minimum Window Substring",
    titleCn: "最小覆盖子串",
    difficulty: "hard",
    url: "https://leetcode.com/problems/minimum-window-substring/",
    tags: ["String", "Sliding Window"],
    category: "滑动窗口"
  },
  {
    slug: "permutation-in-string",
    number: 567,
    title: "Permutation in String",
    titleCn: "字符串的排列",
    difficulty: "medium",
    url: "https://leetcode.com/problems/permutation-in-string/",
    tags: ["String", "Sliding Window"],
    category: "滑动窗口"
  },
  {
    slug: "find-all-anagrams-in-a-string",
    number: 438,
    title: "Find All Anagrams in a String",
    titleCn: "找到字符串中所有字母异位词",
    difficulty: "medium",
    url: "https://leetcode.com/problems/find-all-anagrams-in-a-string/",
    tags: ["String", "Sliding Window"],
    category: "滑动窗口"
  },
  {
    slug: "longest-repeating-character-replacement",
    number: 424,
    title: "Longest Repeating Character Replacement",
    titleCn: "替换后的最长重复字符",
    difficulty: "medium",
    url: "https://leetcode.com/problems/longest-repeating-character-replacement/",
    tags: ["String", "Sliding Window"],
    category: "滑动窗口"
  },
  {
    slug: "max-consecutive-ones-iii",
    number: 1004,
    title: "Max Consecutive Ones III",
    titleCn: "最大连续1的个数 III",
    difficulty: "medium",
    url: "https://leetcode.com/problems/max-consecutive-ones-iii/",
    tags: ["Array", "Sliding Window"],
    category: "滑动窗口"
  },

  // 递归和回溯（前端常考）
  {
    slug: "generate-parentheses",
    number: 22,
    title: "Generate Parentheses",
    titleCn: "括号生成",
    difficulty: "medium",
    url: "https://leetcode.com/problems/generate-parentheses/",
    tags: ["String", "Backtracking"],
    category: "递归回溯"
  },
  {
    slug: "letter-combinations-of-a-phone-number",
    number: 17,
    title: "Letter Combinations of a Phone Number",
    titleCn: "电话号码的字母组合",
    difficulty: "medium",
    url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
    tags: ["String", "Backtracking"],
    category: "递归回溯"
  },
  {
    slug: "combinations",
    number: 77,
    title: "Combinations",
    titleCn: "组合",
    difficulty: "medium",
    url: "https://leetcode.com/problems/combinations/",
    tags: ["Array", "Backtracking"],
    category: "递归回溯"
  },
  {
    slug: "permutations",
    number: 46,
    title: "Permutations",
    titleCn: "全排列",
    difficulty: "medium",
    url: "https://leetcode.com/problems/permutations/",
    tags: ["Array", "Backtracking"],
    category: "递归回溯"
  },
  {
    slug: "subsets",
    number: 78,
    title: "Subsets",
    titleCn: "子集",
    difficulty: "medium",
    url: "https://leetcode.com/problems/subsets/",
    tags: ["Array", "Backtracking"],
    category: "递归回溯"
  },

  // 深度优先搜索（DFS）
  {
    slug: "number-of-islands",
    number: 200,
    title: "Number of Islands",
    titleCn: "岛屿数量",
    difficulty: "medium",
    url: "https://leetcode.com/problems/number-of-islands/",
    tags: ["Array", "DFS", "BFS"],
    category: "深度优先搜索"
  },
  {
    slug: "max-area-of-island",
    number: 695,
    title: "Max Area of Island",
    titleCn: "岛屿的最大面积",
    difficulty: "medium",
    url: "https://leetcode.com/problems/max-area-of-island/",
    tags: ["Array", "DFS"],
    category: "深度优先搜索"
  },
  
  // 继续深度优先搜索（DFS）
  {
    slug: "flood-fill",
    number: 733,
    title: "Flood Fill",
    titleCn: "图像渲染",
    difficulty: "easy",
    url: "https://leetcode.com/problems/flood-fill/",
    tags: ["Array", "DFS"],
    category: "深度优先搜索"
  },
  {
    slug: "surrounded-regions",
    number: 130,
    title: "Surrounded Regions",
    titleCn: "被围绕的区域",
    difficulty: "medium",
    url: "https://leetcode.com/problems/surrounded-regions/",
    tags: ["Array", "DFS"],
    category: "深度优先搜索"
  },
  {
    slug: "pacific-atlantic-water-flow",
    number: 417,
    title: "Pacific Atlantic Water Flow",
    titleCn: "太平洋大西洋水流问题",
    difficulty: "medium",
    url: "https://leetcode.com/problems/pacific-atlantic-water-flow/",
    tags: ["Array", "DFS"],
    category: "深度优先搜索"
  },

  // 广度优先搜索（BFS）
  {
    slug: "binary-tree-right-side-view",
    number: 199,
    title: "Binary Tree Right Side View",
    titleCn: "二叉树的右视图",
    difficulty: "medium",
    url: "https://leetcode.com/problems/binary-tree-right-side-view/",
    tags: ["Tree", "BFS"],
    category: "广度优先搜索"
  },
  {
    slug: "binary-tree-zigzag-level-order-traversal",
    number: 103,
    title: "Binary Tree Zigzag Level Order Traversal",
    titleCn: "二叉树的锯齿形层序遍历",
    difficulty: "medium",
    url: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/",
    tags: ["Tree", "BFS"],
    category: "广度优先搜索"
  },
  {
    slug: "minimum-depth-of-binary-tree",
    number: 111,
    title: "Minimum Depth of Binary Tree",
    titleCn: "二叉树的最小深度",
    difficulty: "easy",
    url: "https://leetcode.com/problems/minimum-depth-of-binary-tree/",
    tags: ["Tree", "BFS", "DFS"],
    category: "广度优先搜索"
  },
  {
    slug: "word-ladder",
    number: 127,
    title: "Word Ladder",
    titleCn: "单词接龙",
    difficulty: "hard",
    url: "https://leetcode.com/problems/word-ladder/",
    tags: ["String", "BFS"],
    category: "广度优先搜索"
  },
  {
    slug: "open-the-lock",
    number: 752,
    title: "Open the Lock",
    titleCn: "打开转盘锁",
    difficulty: "medium",
    url: "https://leetcode.com/problems/open-the-lock/",
    tags: ["Array", "BFS"],
    category: "广度优先搜索"
  },

  // 贪心算法（前端常考）
  {
    slug: "jump-game",
    number: 55,
    title: "Jump Game",
    titleCn: "跳跃游戏",
    difficulty: "medium",
    url: "https://leetcode.com/problems/jump-game/",
    tags: ["Array", "Greedy"],
    category: "贪心算法"
  },
  {
    slug: "jump-game-ii",
    number: 45,
    title: "Jump Game II",
    titleCn: "跳跃游戏 II",
    difficulty: "medium",
    url: "https://leetcode.com/problems/jump-game-ii/",
    tags: ["Array", "Greedy"],
    category: "贪心算法"
  },
  {
    slug: "gas-station",
    number: 134,
    title: "Gas Station",
    titleCn: "加油站",
    difficulty: "medium",
    url: "https://leetcode.com/problems/gas-station/",
    tags: ["Array", "Greedy"],
    category: "贪心算法"
  },
  {
    slug: "candy",
    number: 135,
    title: "Candy",
    titleCn: "分发糖果",
    difficulty: "hard",
    url: "https://leetcode.com/problems/candy/",
    tags: ["Array", "Greedy"],
    category: "贪心算法"
  },
  {
    slug: "assign-cookies",
    number: 455,
    title: "Assign Cookies",
    titleCn: "分发饼干",
    difficulty: "easy",
    url: "https://leetcode.com/problems/assign-cookies/",
    tags: ["Array", "Greedy"],
    category: "贪心算法"
  },

  // 位运算（前端偶尔考）
  {
    slug: "single-number",
    number: 136,
    title: "Single Number",
    titleCn: "只出现一次的数字",
    difficulty: "easy",
    url: "https://leetcode.com/problems/single-number/",
    tags: ["Array", "Bit Manipulation"],
    category: "位运算"
  },
  {
    slug: "number-of-1-bits",
    number: 191,
    title: "Number of 1 Bits",
    titleCn: "位1的个数",
    difficulty: "easy",
    url: "https://leetcode.com/problems/number-of-1-bits/",
    tags: ["Bit Manipulation"],
    category: "位运算"
  },
  {
    slug: "power-of-two",
    number: 231,
    title: "Power of Two",
    titleCn: "2的幂",
    difficulty: "easy",
    url: "https://leetcode.com/problems/power-of-two/",
    tags: ["Math", "Bit Manipulation"],
    category: "位运算"
  },
  {
    slug: "missing-number",
    number: 268,
    title: "Missing Number",
    titleCn: "丢失的数字",
    difficulty: "easy",
    url: "https://leetcode.com/problems/missing-number/",
    tags: ["Array", "Bit Manipulation"],
    category: "位运算"
  },
  {
    slug: "counting-bits",
    number: 338,
    title: "Counting Bits",
    titleCn: "比特位计数",
    difficulty: "easy",
    url: "https://leetcode.com/problems/counting-bits/",
    tags: ["Dynamic Programming", "Bit Manipulation"],
    category: "位运算"
  },

  // 数学题（前端基础）
  {
    slug: "palindrome-number",
    number: 9,
    title: "Palindrome Number",
    titleCn: "回文数",
    difficulty: "easy",
    url: "https://leetcode.com/problems/palindrome-number/",
    tags: ["Math"],
    category: "数学"
  },
  {
    slug: "reverse-integer",
    number: 7,
    title: "Reverse Integer",
    titleCn: "整数反转",
    difficulty: "medium",
    url: "https://leetcode.com/problems/reverse-integer/",
    tags: ["Math"],
    category: "数学"
  },
  {
    slug: "roman-to-integer",
    number: 13,
    title: "Roman to Integer",
    titleCn: "罗马数字转整数",
    difficulty: "easy",
    url: "https://leetcode.com/problems/roman-to-integer/",
    tags: ["Math", "String"],
    category: "数学"
  },
  {
    slug: "excel-sheet-column-number",
    number: 171,
    title: "Excel Sheet Column Number",
    titleCn: "Excel表列序号",
    difficulty: "easy",
    url: "https://leetcode.com/problems/excel-sheet-column-number/",
    tags: ["Math", "String"],
    category: "数学"
  },
  {
    slug: "factorial-trailing-zeroes",
    number: 172,
    title: "Factorial Trailing Zeroes",
    titleCn: "阶乘后的零",
    difficulty: "medium",
    url: "https://leetcode.com/problems/factorial-trailing-zeroes/",
    tags: ["Math"],
    category: "数学"
  },

  // 设计题（前端重要）
  {
    slug: "lru-cache",
    number: 146,
    title: "LRU Cache",
    titleCn: "LRU 缓存",
    difficulty: "medium",
    url: "https://leetcode.com/problems/lru-cache/",
    tags: ["Design", "Hash Table", "Linked List"],
    category: "设计"
  },
  {
    slug: "implement-trie-prefix-tree",
    number: 208,
    title: "Implement Trie (Prefix Tree)",
    titleCn: "实现 Trie (前缀树)",
    difficulty: "medium",
    url: "https://leetcode.com/problems/implement-trie-prefix-tree/",
    tags: ["Design", "Trie"],
    category: "设计"
  },
  {
    slug: "design-add-and-search-words-data-structure",
    number: 211,
    title: "Design Add and Search Words Data Structure",
    titleCn: "添加与搜索单词 - 数据结构设计",
    difficulty: "medium",
    url: "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
    tags: ["Design", "Trie"],
    category: "设计"
  },
  {
    slug: "flatten-nested-list-iterator",
    number: 341,
    title: "Flatten Nested List Iterator",
    titleCn: "扁平化嵌套列表迭代器",
    difficulty: "medium",
    url: "https://leetcode.com/problems/flatten-nested-list-iterator/",
    tags: ["Design", "Stack"],
    category: "设计"
  },
  {
    slug: "insert-delete-getrandom-o1",
    number: 380,
    title: "Insert Delete GetRandom O(1)",
    titleCn: "O(1) 时间插入、删除和获取随机元素",
    difficulty: "medium",
    url: "https://leetcode.com/problems/insert-delete-getrandom-o1/",
    tags: ["Design", "Hash Table"],
    category: "设计"
  },

  // 排序算法（前端基础）
  {
    slug: "sort-colors",
    number: 75,
    title: "Sort Colors",
    titleCn: "颜色分类",
    difficulty: "medium",
    url: "https://leetcode.com/problems/sort-colors/",
    tags: ["Array", "Sorting"],
    category: "排序"
  },
  {
    slug: "merge-intervals",
    number: 56,
    title: "Merge Intervals",
    titleCn: "合并区间",
    difficulty: "medium",
    url: "https://leetcode.com/problems/merge-intervals/",
    tags: ["Array", "Sorting"],
    category: "排序"
  },
  {
    slug: "insert-interval",
    number: 57,
    title: "Insert Interval",
    titleCn: "插入区间",
    difficulty: "medium",
    url: "https://leetcode.com/problems/insert-interval/",
    tags: ["Array", "Sorting"],
    category: "排序"
  },
  {
    slug: "kth-largest-element-in-an-array",
    number: 215,
    title: "Kth Largest Element in an Array",
    titleCn: "数组中的第K个最大元素",
    difficulty: "medium",
    url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    tags: ["Array", "Sorting", "Heap"],
    category: "排序"
  },
  {
    slug: "top-k-frequent-elements",
    number: 347,
    title: "Top K Frequent Elements",
    titleCn: "前 K 个高频元素",
    difficulty: "medium",
    url: "https://leetcode.com/problems/top-k-frequent-elements/",
    tags: ["Array", "Hash Table", "Sorting"],
    category: "排序"
  }
];

// 合并所有题目
const allLeetcodeProblems = [...leetcodeProblems, ...additionalLeetcodeProblems, 
  // 缺失的速成题目补充
  {
    slug: "trapping-rain-water",
    number: 42,
    title: "Trapping Rain Water",
    titleCn: "接雨水",
    difficulty: "hard",
    url: "https://leetcode.com/problems/trapping-rain-water/",
    tags: ["Array", "Two Pointers", "Stack"],
    category: "数组"
  },
  {
    slug: "binary-tree-maximum-path-sum",
    number: 124,
    title: "Binary Tree Maximum Path Sum",
    titleCn: "二叉树中的最大路径和",
    difficulty: "hard",
    url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
    tags: ["Tree", "DFS", "Dynamic Programming"],
    category: "树"
  },
  {
    slug: "sliding-window-maximum",
    number: 239,
    title: "Sliding Window Maximum",
    titleCn: "滑动窗口最大值",
    difficulty: "hard",
    url: "https://leetcode.com/problems/sliding-window-maximum/",
    tags: ["Array", "Queue", "Sliding Window"],
    category: "滑动窗口"
  }
]

async function main() {
  console.log('开始导入LeetCode题目数据...')
  
  try {
    let createdCount = 0
    let updatedCount = 0
    
    // 使用 upsert 逐个处理每道题目，避免外键约束问题
    for (const problem of allLeetcodeProblems) {
      const result = await prisma.leetCodeProblem.upsert({
        where: { slug: problem.slug },
        update: {
          number: problem.number,
          title: problem.title,
          titleCn: problem.titleCn,
          difficulty: problem.difficulty,
          url: problem.url,
          tags: problem.tags,
          category: problem.category
        },
        create: problem
      })
      
      // 检查是否是新创建的记录
      const existing = await prisma.leetCodeProblem.findFirst({
        where: { slug: problem.slug }
      })
      
      if (existing && existing.createdAt.getTime() === result.createdAt.getTime()) {
        createdCount++
      } else {
        updatedCount++
      }
    }
    
    console.log(`成功处理题目: 新增 ${createdCount} 道，更新 ${updatedCount} 道`)
    
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
