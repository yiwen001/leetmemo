// study-plan-generator.js

/**
 * 学习计划生成器
 */
class StudyPlanGenerator {
    constructor() {
      this.config = {
        // 艾宾浩斯复习间隔（天）
        REVIEW_INTERVALS: [1, 3, 7, 15, 30],
        
        // 系统限制
        LIMITS: {
          MAX_DAILY_NEW: 8,      // 每日最多新题
          MAX_DAILY_TOTAL: 20,   // 每日最多总题数
          MIN_DAILY_NEW: 1,      // 每日最少新题
          OPTIMAL_DAILY_NEW: 3   // 最优每日新题数
        }
      };
    }
  
    /**
     * 创建学习计划
     * @param {Object} projectData - 学习项目数据
     * @param {Array} projectData.problems - 题目列表
     * @param {number} projectData.duration - 学习天数
     * @param {string} projectData.startDate - 开始日期 (YYYY-MM-DD)
     * @param {string} projectData.intensity - 强度等级 ('easy'|'medium'|'hard')
     * @returns {Object} 完整的学习计划
     */
    createStudyPlan(projectData) {
      const { problems, duration, startDate, intensity = 'medium' } = projectData;
      
      // 验证输入
      this.validateInput(problems, duration);
      
      // 调整配置基于强度
      this.adjustConfigByIntensity(intensity);
      
      // 生成完整计划
      const plan = this.generateCompletePlan(problems, duration, startDate);
      
      return {
        projectInfo: {
          totalProblems: problems.length,
          duration: duration,
          startDate: startDate,
          endDate: this.calculateEndDate(startDate, duration),
          intensity: intensity
        },
        dailyPlans: plan.dailyPlans,
        statistics: plan.statistics,
        calendar: this.generateCalendarView(plan.dailyPlans, startDate)
      };
    }
  
    /**
     * 验证输入数据
     */
    validateInput(problems, duration) {
      if (!Array.isArray(problems) || problems.length === 0) {
        throw new Error('题目列表不能为空');
      }
      
      if (duration < 1 || duration > 365) {
        throw new Error('学习天数必须在1-365天之间');
      }
      
      // 检查是否可行
      const minRequiredDays = Math.ceil(problems.length / this.config.LIMITS.MAX_DAILY_NEW);
      if (duration < minRequiredDays) {
        throw new Error(`${problems.length}道题至少需要${minRequiredDays}天完成`);
      }
      
      // 验证题目格式
      problems.forEach((problem, index) => {
        if (!problem.name || !problem.url) {
          throw new Error(`第${index + 1}道题目缺少name或url字段`);
        }
      });
    }
  
    /**
     * 根据强度调整配置
     */
    adjustConfigByIntensity(intensity) {
      const intensityConfig = {
        easy: {
          MAX_DAILY_NEW: 3,
          MAX_DAILY_TOTAL: 10,
          OPTIMAL_DAILY_NEW: 2
        },
        medium: {
          MAX_DAILY_NEW: 5,
          MAX_DAILY_TOTAL: 15,
          OPTIMAL_DAILY_NEW: 3
        },
        hard: {
          MAX_DAILY_NEW: 8,
          MAX_DAILY_TOTAL: 20,
          OPTIMAL_DAILY_NEW: 5
        }
      };
      
      if (intensityConfig[intensity]) {
        Object.assign(this.config.LIMITS, intensityConfig[intensity]);
      }
    }
  
    /**
     * 生成完整学习计划
     */
    generateCompletePlan(problems, duration, startDate) {
      // 1. 初始化每日计划
      const dailyPlans = this.initializeDailyPlans(duration, startDate);
      
      // 2. 分配新题目
      this.distributeNewProblems(dailyPlans, problems);
      
      // 3. 计算复习任务
      this.calculateReviewTasks(dailyPlans);
      
      // 4. 优化负载平衡
      this.optimizeWorkload(dailyPlans);
      
      // 5. 生成统计信息
      const statistics = this.generateStatistics(dailyPlans, problems.length);
      
      return { dailyPlans, statistics };
    }
  
    /**
     * 初始化每日计划
     */
    initializeDailyPlans(duration, startDate) {
      const plans = [];
      const start = new Date(startDate);
      
      for (let i = 0; i < duration; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        
        plans.push({
          day: i + 1,
          date: currentDate.toISOString().split('T')[0],
          dayOfWeek: currentDate.toLocaleDateString('zh-CN', { weekday: 'long' }),
          newProblems: [],
          reviewProblems: [],
          totalCount: 0,
          estimatedTime: 0, // 分钟
          difficulty: 'medium'
        });
      }
      
      return plans;
    }
  
    /**
     * 分配新题目
     */
    distributeNewProblems(dailyPlans, problems) {
      const totalDays = dailyPlans.length;
      const totalProblems = problems.length;
      
      // 计算每日新题目标数量
      const baseDaily = Math.ceil(totalProblems / totalDays);
      const optimalDaily = Math.min(baseDaily, this.config.LIMITS.OPTIMAL_DAILY_NEW);
      
      let problemIndex = 0;
      
      for (let dayIndex = 0; dayIndex < totalDays && problemIndex < totalProblems; dayIndex++) {
        const remainingProblems = totalProblems - problemIndex;
        const remainingDays = totalDays - dayIndex;
        
        // 动态计算当日新题数量
        let dailyNew = Math.min(
          optimalDaily,
          Math.ceil(remainingProblems / remainingDays),
          this.config.LIMITS.MAX_DAILY_NEW
        );
        
        // 确保最后几天能完成所有题目
        if (remainingDays <= 3) {
          dailyNew = Math.min(remainingProblems, this.config.LIMITS.MAX_DAILY_NEW);
        }
        
        // 分配题目
        const endIndex = Math.min(problemIndex + dailyNew, totalProblems);
        const todayProblems = problems.slice(problemIndex, endIndex);
        
        dailyPlans[dayIndex].newProblems = todayProblems.map((problem, index) => ({
          ...problem,
          id: `${dayIndex + 1}-${index + 1}`,
          studyDay: dayIndex + 1,
          firstStudyDate: dailyPlans[dayIndex].date,
          status: 'new',
          reviewCount: 0
        }));
        
        problemIndex = endIndex;
      }
    }
  
    /**
     * 计算复习任务
     */
    calculateReviewTasks(dailyPlans) {
      const { REVIEW_INTERVALS } = this.config;
      
      for (let dayIndex = 0; dayIndex < dailyPlans.length; dayIndex++) {
        const currentDay = dailyPlans[dayIndex];
        
        // 查找需要复习的题目
        for (let studyDayIndex = 0; studyDayIndex < dayIndex; studyDayIndex++) {
          const studyDay = dailyPlans[studyDayIndex];
          const daysSinceStudy = dayIndex - studyDayIndex;
          
          // 检查是否到了复习时间
          for (let intervalIndex = 0; intervalIndex < REVIEW_INTERVALS.length; intervalIndex++) {
            const interval = REVIEW_INTERVALS[intervalIndex];
            
            if (daysSinceStudy === interval) {
              // 添加复习任务
              studyDay.newProblems.forEach(problem => {
                currentDay.reviewProblems.push({
                  ...problem,
                  reviewType: `第${intervalIndex + 1}次复习`,
                  reviewInterval: interval,
                  originalStudyDay: studyDay.day,
                  reviewCount: intervalIndex + 1,
                  status: 'review'
                });
              });
              break;
            }
          }
        }
        
        // 更新总数和预估时间
        currentDay.totalCount = currentDay.newProblems.length + currentDay.reviewProblems.length;
        currentDay.estimatedTime = this.calculateEstimatedTime(currentDay);
      }
    }
  
    /**
     * 计算预估学习时间
     */
    calculateEstimatedTime(dayPlan) {
      const newProblemTime = 45; // 新题平均45分钟
      const reviewProblemTime = 15; // 复习题平均15分钟
      
      return (dayPlan.newProblems.length * newProblemTime) + 
             (dayPlan.reviewProblems.length * reviewProblemTime);
    }
  
    /**
     * 优化工作负载
     */
    optimizeWorkload(dailyPlans) {
      const { MAX_DAILY_TOTAL } = this.config.LIMITS;
      
      // 找出负载过重的天数
      const overloadedDays = dailyPlans.filter(day => day.totalCount > MAX_DAILY_TOTAL);
      
      for (let overloadedDay of overloadedDays) {
        const excess = overloadedDay.totalCount - MAX_DAILY_TOTAL;
        
        // 尝试将部分复习任务移到其他天
        this.redistributeReviewTasks(dailyPlans, overloadedDay, excess);
      }
    }
  
    /**
     * 重新分配复习任务
     */
    redistributeReviewTasks(dailyPlans, overloadedDay, excessCount) {
      const { MAX_DAILY_TOTAL } = this.config.LIMITS;
      const overloadedDayIndex = dailyPlans.indexOf(overloadedDay);
      
      // 寻找可以接收任务的天数（前后3天内）
      const searchRange = 3;
      const candidates = [];
      
      for (let i = Math.max(0, overloadedDayIndex - searchRange); 
           i <= Math.min(dailyPlans.length - 1, overloadedDayIndex + searchRange); 
           i++) {
        if (i !== overloadedDayIndex && dailyPlans[i].totalCount < MAX_DAILY_TOTAL) {
          candidates.push({
            day: dailyPlans[i],
            index: i,
            capacity: MAX_DAILY_TOTAL - dailyPlans[i].totalCount
          });
        }
      }
      
      // 按容量排序
      candidates.sort((a, b) => b.capacity - a.capacity);
      
      // 移动复习任务
      let moved = 0;
      for (let i = overloadedDay.reviewProblems.length - 1; i >= 0 && moved < excessCount; i--) {
        for (let candidate of candidates) {
          if (candidate.capacity > 0) {
            const task = overloadedDay.reviewProblems.splice(i, 1)[0];
            candidate.day.reviewProblems.push(task);
            
            // 更新计数
            overloadedDay.totalCount--;
            candidate.day.totalCount++;
            candidate.capacity--;
            moved++;
            break;
          }
        }
      }
    }
  
    /**
     * 生成统计信息
     */
    generateStatistics(dailyPlans, totalProblems) {
      const totalNewAssigned = dailyPlans.reduce((sum, day) => sum + day.newProblems.length, 0);
      const totalReviewTasks = dailyPlans.reduce((sum, day) => sum + day.reviewProblems.length, 0);
      const dailyLoads = dailyPlans.map(day => day.totalCount);
      const dailyTimes = dailyPlans.map(day => day.estimatedTime);
      
      return {
        coverage: {
          totalProblems: totalProblems,
          assignedProblems: totalNewAssigned,
          coverageRate: ((totalNewAssigned / totalProblems) * 100).toFixed(1) + '%'
        },
        workload: {
          totalReviewTasks: totalReviewTasks,
          avgDailyProblems: (dailyLoads.reduce((a, b) => a + b, 0) / dailyPlans.length).toFixed(1),
          maxDailyProblems: Math.max(...dailyLoads),
          minDailyProblems: Math.min(...dailyLoads),
          avgDailyTime: Math.round(dailyTimes.reduce((a, b) => a + b, 0) / dailyPlans.length),
          maxDailyTime: Math.max(...dailyTimes),
          totalStudyTime: Math.round(dailyTimes.reduce((a, b) => a + b, 0))
        },
        distribution: this.analyzeWorkloadDistribution(dailyLoads),
        memoryRetention: this.estimateMemoryRetention(dailyPlans)
      };
    }
  
    /**
     * 分析工作负载分布
     */
    analyzeWorkloadDistribution(dailyLoads) {
      const mean = dailyLoads.reduce((a, b) => a + b, 0) / dailyLoads.length;
      const variance = dailyLoads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / dailyLoads.length;
      const standardDeviation = Math.sqrt(variance);
      
      return {
        mean: mean.toFixed(1),
        standardDeviation: standardDeviation.toFixed(1),
        coefficient: (standardDeviation / mean).toFixed(2), // 变异系数
        balance: standardDeviation < mean * 0.3 ? 'good' : standardDeviation < mean * 0.5 ? 'fair' : 'poor'
      };
    }
  
    /**
     * 估算记忆保持率
     */
    estimateMemoryRetention(dailyPlans) {
      let totalRetention = 0;
      let totalItems = 0;
      
      dailyPlans.forEach(day => {
        day.newProblems.forEach(problem => {
          // 计算该题目的复习次数
               // 计算该题目的复习次数
               const reviewCount = dailyPlans.reduce((count, futureDay) => {
                return count + futureDay.reviewProblems.filter(review => 
                  review.id === problem.id
                ).length;
              }, 0);
              
              // 基于艾宾浩斯遗忘曲线计算保持率
              const baseRetention = 0.2; // 基础保持率20%
              const reviewBonus = Math.min(0.7, reviewCount * 0.15); // 每次复习增加15%，最高70%
              const retention = baseRetention + reviewBonus;
              
              totalRetention += retention;
              totalItems++;
            });
          });
          
          return {
            averageRetention: totalItems > 0 ? ((totalRetention / totalItems) * 100).toFixed(1) + '%' : '0%',
            totalItemsTracked: totalItems,
            retentionLevel: totalItems > 0 ? this.getRetentionLevel(totalRetention / totalItems) : 'unknown'
          };
        }
      
        /**
         * 获取保持率等级
         */
        getRetentionLevel(retention) {
          if (retention >= 0.8) return 'excellent';
          if (retention >= 0.6) return 'good';
          if (retention >= 0.4) return 'fair';
          return 'poor';
        }
      
        /**
         * 生成日历视图
         */
        generateCalendarView(dailyPlans, startDate) {
          const calendar = [];
          const start = new Date(startDate);
          
          // 按周分组
          let currentWeek = [];
          let weekNumber = 1;
          
          dailyPlans.forEach((day, index) => {
            const dayInfo = {
              date: day.date,
              dayOfWeek: day.dayOfWeek,
              day: day.day,
              newCount: day.newProblems.length,
              reviewCount: day.reviewProblems.length,
              totalCount: day.totalCount,
              estimatedTime: day.estimatedTime,
              intensity: this.getDayIntensity(day.totalCount),
              isWeekend: day.dayOfWeek.includes('六') || day.dayOfWeek.includes('日')
            };
            
            currentWeek.push(dayInfo);
            
            // 每7天或最后一天时，完成当前周
            if (currentWeek.length === 7 || index === dailyPlans.length - 1) {
              calendar.push({
                week: weekNumber,
                days: [...currentWeek],
                weekTotal: currentWeek.reduce((sum, d) => sum + d.totalCount, 0),
                weekAverage: (currentWeek.reduce((sum, d) => sum + d.totalCount, 0) / currentWeek.length).toFixed(1)
              });
              currentWeek = [];
              weekNumber++;
            }
          });
          
          return calendar;
        }
      
        /**
         * 获取当日强度等级
         */
        getDayIntensity(totalCount) {
          if (totalCount <= 5) return 'light';
          if (totalCount <= 10) return 'medium';
          if (totalCount <= 15) return 'heavy';
          return 'extreme';
        }
      
        /**
         * 计算结束日期
         */
        calculateEndDate(startDate, duration) {
          const start = new Date(startDate);
          const end = new Date(start);
          end.setDate(start.getDate() + duration - 1);
          return end.toISOString().split('T')[0];
        }
      
        /**
         * 获取特定日期的学习任务
         */
        getDayTasks(studyPlan, targetDate) {
          const dayPlan = studyPlan.dailyPlans.find(day => day.date === targetDate);
          
          if (!dayPlan) {
            return null;
          }
          
          return {
            date: dayPlan.date,
            day: dayPlan.day,
            summary: {
              newProblems: dayPlan.newProblems.length,
              reviewProblems: dayPlan.reviewProblems.length,
              totalCount: dayPlan.totalCount,
              estimatedTime: dayPlan.estimatedTime
            },
            tasks: {
              newProblems: dayPlan.newProblems.map(problem => ({
                id: problem.id,
                name: problem.name,
                url: problem.url,
                type: 'new',
                estimatedTime: 45,
                priority: 'high'
              })),
              reviewProblems: dayPlan.reviewProblems.map(problem => ({
                id: problem.id,
                name: problem.name,
                url: problem.url,
                type: 'review',
                reviewType: problem.reviewType,
                reviewCount: problem.reviewCount,
                originalStudyDay: problem.originalStudyDay,
                estimatedTime: 15,
                priority: problem.reviewCount <= 2 ? 'high' : 'medium'
              }))
            },
            recommendations: this.generateDayRecommendations(dayPlan)
          };
        }
      
        /**
         * 生成当日建议
         */
        generateDayRecommendations(dayPlan) {
          const recommendations = [];
          
          if (dayPlan.totalCount > 15) {
            recommendations.push({
              type: 'warning',
              message: '今日任务较重，建议分时段完成，避免疲劳学习',
              icon: '⚠️'
            });
          }
          
          if (dayPlan.reviewProblems.length > dayPlan.newProblems.length * 2) {
            recommendations.push({
              type: 'tip',
              message: '今日复习任务较多，建议先完成复习再学习新题',
              icon: '💡'
            });
          }
          
          const criticalReviews = dayPlan.reviewProblems.filter(p => p.reviewCount <= 2);
          if (criticalReviews.length > 0) {
            recommendations.push({
              type: 'important',
              message: `有${criticalReviews.length}道题处于关键复习期，请重点关注`,
              icon: '🎯'
            });
          }
          
          if (dayPlan.estimatedTime > 180) {
            recommendations.push({
              type: 'time',
              message: '预计学习时间超过3小时，建议合理安排休息',
              icon: '⏰'
            });
          }
          
          return recommendations;
        }
      }
      
      // 使用示例和测试
      function demonstrateStudyPlanGenerator() {
        console.log("=== 学习计划生成器演示 ===\n");
        
        const generator = new StudyPlanGenerator();
        
        // 模拟用户输入的题目列表
        const problems = [
          { name: "LeetCode 1. 两数之和", url: "https://leetcode.com/problems/two-sum/" },
          { name: "LeetCode 3. 无重复字符的最长子串", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
          { name: "LeetCode 20. 有效的括号", url: "https://leetcode.com/problems/valid-parentheses/" },
          { name: "LeetCode 21. 合并两个有序链表", url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
          { name: "LeetCode 125. 验证回文串", url: "https://leetcode.com/problems/valid-palindrome/" },
          { name: "LeetCode 206. 反转链表", url: "https://leetcode.com/problems/reverse-linked-list/" },
          { name: "LeetCode 242. 有效的字母异位词", url: "https://leetcode.com/problems/valid-anagram/" },
          { name: "LeetCode 283. 移动零", url: "https://leetcode.com/problems/move-zeroes/" },
          { name: "LeetCode 344. 反转字符串", url: "https://leetcode.com/problems/reverse-string/" },
          { name: "LeetCode 347. 前K个高频元素", url: "https://leetcode.com/problems/top-k-frequent-elements/" },
          { name: "LeetCode 49. 字母异位词分组", url: "https://leetcode.com/problems/group-anagrams/" },
          { name: "LeetCode 155. 最小栈", url: "https://leetcode.com/problems/min-stack/" }
        ];
        
        // 测试不同场景
        const testCases = [
          {
            name: "14天中等强度计划",
            data: {
              problems: problems,
              duration: 14,
              startDate: "2024-02-01",
              intensity: "medium"
            }
          },
          {
            name: "7天高强度计划",
            data: {
              problems: problems.slice(0, 8),
              duration: 7,
              startDate: "2024-02-01",
              intensity: "hard"
            }
          },
          {
            name: "30天轻松计划",
            data: {
              problems: problems,
              duration: 30,
              startDate: "2024-02-01",
              intensity: "easy"
            }
          }
        ];
        
        testCases.forEach(testCase => {
          try {
            console.log(`\n=== ${testCase.name} ===`);
            
            const studyPlan = generator.createStudyPlan(testCase.data);
            
            // 显示项目信息
            console.log("项目信息:", studyPlan.projectInfo);
            
            // 显示统计信息
            console.log("统计信息:", {
              覆盖率: studyPlan.statistics.coverage.coverageRate,
              平均每日题数: studyPlan.statistics.workload.avgDailyProblems,
              最大每日题数: studyPlan.statistics.workload.maxDailyProblems,
              平均每日时间: `${studyPlan.statistics.workload.avgDailyTime}分钟`,
              负载平衡: studyPlan.statistics.distribution.balance,
              记忆保持率: studyPlan.statistics.memoryRetention.averageRetention
            });
            
            // 显示前5天的详细计划
            console.log("\n前5天详细计划:");
            studyPlan.dailyPlans.slice(0, 5).forEach(day => {
              console.log(`第${day.day}天 (${day.date} ${day.dayOfWeek}):`);
              console.log(`  新题(${day.newProblems.length}): ${day.newProblems.map(p => p.name).join(', ')}`);
              if (day.reviewProblems.length > 0) {
                console.log(`  复习(${day.reviewProblems.length}): ${day.reviewProblems.map(p => `${p.name}(${p.reviewType})`).join(', ')}`);
              }
              console.log(`  总计: ${day.totalCount}题, 预计${day.estimatedTime}分钟\n`);
            });
            
            // 显示日历视图（第一周）
            console.log("第一周日历视图:");
            if (studyPlan.calendar[0]) {
              studyPlan.calendar[0].days.forEach(day => {
                console.log(`${day.date} ${day.dayOfWeek}: ${day.newCount}新+${day.reviewCount}复习=${day.totalCount}题 [${day.intensity}]`);
              });
            }
            
            // 测试获取特定日期任务
            const dayTasks = generator.getDayTasks(studyPlan, studyPlan.dailyPlans[2].date);
            if (dayTasks) {
              console.log(`\n第3天任务详情:`);
              console.log(`任务概要:`, dayTasks.summary);
              console.log(`建议:`, dayTasks.recommendations.map(r => r.message));
            }
            
          } catch (error) {
            console.error(`${testCase.name} 生成失败:`, error.message);
          }
        });
      }
      
      // 运行演示
      demonstrateStudyPlanGenerator();
      
      // 导出供其他模块使用
      if (typeof module !== 'undefined' && module.exports) {
        module.exports = StudyPlanGenerator;
      }