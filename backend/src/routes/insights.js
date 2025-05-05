const express = require('express');
const auth = require('../middleware/auth');
const { Tasks, Posts, Plants } = require('../utils/localDB');
const DeepSeekClient = require('../utils/apiClient');
const deepSeekClient = new DeepSeekClient();
const { parseAIResponse, generateFallbackAnalysis } = require('../utils/parseAIResponse');
const router = express.Router();

// 获取任务完成情况总结
router.get('/tasks', auth, async (req, res) => {
  try {
    const period = req.query.period || 'week';
    
    // 计算时间范围
    const endDate = new Date();
    let startDate = new Date();
    
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      // 获取本周的开始（周一）
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(startDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的时间周期，支持day/week/month'
      });
    }
    
    // 获取时间段内的任务
    const tasks = await Tasks.find({
      userId: req.user.id,
      createdAt: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });
    
    // 计算统计数据
    const completedTasks = tasks.filter(task => task.completed);
    const pendingTasks = tasks.filter(task => !task.completed);
    const completionRate = tasks.length > 0 
      ? parseFloat((completedTasks.length / tasks.length * 100).toFixed(1)) 
      : 0;
    
    // 计算平均完成时间
    let avgCompletionTime = '未知';
    if (completedTasks.length > 0) {
      const totalMinutes = completedTasks.reduce((sum, task) => {
        if (task.completedAt && task.createdAt) {
          const created = new Date(task.createdAt);
          const completed = new Date(task.completedAt);
          return sum + (completed - created) / (1000 * 60); // 转换为分钟
        }
        return sum;
      }, 0);
      
      const avgMinutes = totalMinutes / completedTasks.length;
      
      if (avgMinutes < 60) {
        avgCompletionTime = `${Math.round(avgMinutes)}分钟`;
      } else if (avgMinutes < 60 * 24) {
        avgCompletionTime = `${Math.round(avgMinutes / 60)}小时`;
      } else {
        avgCompletionTime = `${(avgMinutes / (60 * 24)).toFixed(1)}天`;
      }
    }
    
    // 按日期分组，找出最高效的一天
    const tasksByDay = {};
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const dateStr = new Date(task.completedAt).toISOString().split('T')[0];
        tasksByDay[dateStr] = (tasksByDay[dateStr] || 0) + 1;
      }
    });
    
    let mostProductiveDay = '无数据';
    let maxTasks = 0;
    
    for (const [date, count] of Object.entries(tasksByDay)) {
      if (count > maxTasks) {
        maxTasks = count;
        const dayOfWeek = new Date(date).getDay();
        mostProductiveDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayOfWeek];
      }
    }
    
    // 简单的洞察点
    const insights = [];
    
    if (completedTasks.length > 0) {
      insights.push(`你${period === 'day' ? '今天' : period === 'week' ? '本周' : '本月'}完成了${completedTasks.length}个任务。`);
    }
    
    if (mostProductiveDay !== '无数据') {
      insights.push(`${mostProductiveDay}是你最高效的一天。`);
    }
    
    if (pendingTasks.length > 0) {
      insights.push(`你还有${pendingTasks.length}个任务待完成。`);
    }
    
    // 建议
    const recommendations = [
      {
        type: 'timeManagement',
        content: '将复杂任务安排在上午10点到12点之间，这是大多数人效率最高的时段。'
      }
    ];
    
    if (completionRate < 50) {
      recommendations.push({
        type: 'productivity',
        content: '尝试将大任务拆分为小任务，更容易开始和完成。'
      });
    }
    
    res.json({
      success: true,
      period,
      summary: {
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        completionRate,
        averageCompletionTime: avgCompletionTime,
        mostProductiveDay
      },
      insights,
      recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取每周总结
router.get('/weekly', auth, async (req, res) => {
  try {
    // 处理日期参数，默认为当前日期
    let targetDate = req.query.date ? new Date(req.query.date) : new Date();
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '无效的日期格式'
      });
    }
    
    // 找到本周的开始（周一）和结束（周日）
    const day = targetDate.getDay();
    const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
    
    const weekStart = new Date(targetDate.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // 获取时间范围内的任务
    const tasks = await Tasks.find({
      userId: req.user.id,
      createdAt: {
        $gte: weekStart.toISOString(),
        $lte: weekEnd.toISOString()
      }
    });
    
    // 获取时间范围内的帖子
    const posts = await Posts.find({
      userId: req.user.id,
      createdAt: {
        $gte: weekStart.toISOString(),
        $lte: weekEnd.toISOString()
      }
    });
    
    // 获取用户的主植物
    const mainPlant = await Plants.findOne({
      userId: req.user.id,
      isMainPlant: true
    });
    
    // 计算完成的任务
    const completedTasks = tasks.filter(task => task.completed);
    
    // 模拟植物获得的经验
    const plantExperienceGained = completedTasks.length * 10;
    
    // 计算生产力得分 (最高100分)
    let productivityScore = 0;
    if (tasks.length > 0) {
      // 任务完成率占60分
      const completionRate = completedTasks.length / tasks.length;
      productivityScore += Math.round(completionRate * 60);
      
      // 帖子记录占20分
      productivityScore += Math.min(posts.length * 5, 20);
      
      // 植物经验占20分
      productivityScore += Math.min(plantExperienceGained / 5, 20);
    }
    
    // 模拟参加的活动
    const activitiesAttended = 0;
    
    // 简单的洞察点
    const insights = [];
    
    if (completedTasks.length > 0) {
      insights.push(`你本周完成了${completedTasks.length}个任务。`);
    }
    
    if (posts.length > 0) {
      insights.push(`你记录了${posts.length}条生活点滴。`);
    }
    
    if (mainPlant) {
      insights.push(`你的植物"${mainPlant.name}"在持续成长中。`);
    }
    
    // 未来一周计划
    // 获取下周未完成任务的截止日期
    const nextWeekStart = new Date(weekEnd);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    
    // 获取下周的截止任务
    const upcomingTasks = await Tasks.find({
      userId: req.user.id,
      deadline: {
        $gte: nextWeekStart.toISOString(),
        $lte: nextWeekEnd.toISOString()
      },
      completed: false
    }, { deadline: 1 });
    
    // 日期格式化
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    res.json({
      success: true,
      weekRange: `${formatDate(weekStart)} 至 ${formatDate(weekEnd)}`,
      productivityScore,
      achievements: {
        tasksCompleted: completedTasks.length,
        activitiesAttended,
        plantExperienceGained
      },
      insights,
      nextWeekPlan: {
        suggestedFocus: upcomingTasks.length > 0 ? "关注即将到期的任务" : "制定新的学习计划",
        upcomingDeadlines: upcomingTasks.map(task => ({
          id: task._id,
          title: task.title,
          deadline: task.deadline
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// AI分析接口
router.get('/ai-analysis', auth, async (req, res) => {
  try {
    console.log('开始AI智能分析，用户ID:', req.user.id);
    
    // 获取所有任务数据，但限制获取的数量以提高性能
    const tasks = await Tasks.find({ userId: req.user.id }).limit(50).sort({ createdAt: -1 });
    console.log(`获取到${tasks.length}个任务`);
    
    // 获取用户的主植物
    const mainPlant = await Plants.findOne({
      userId: req.user.id,
      isMainPlant: true
    });
    
    const mainPlantName = mainPlant ? mainPlant.name : '植物';
    console.log('主植物:', mainPlantName);
    
    // 计算基础分析数据
    const completedTasksCount = tasks.filter(task => task.completed).length;
    const pendingTasksCount = tasks.filter(task => !task.completed).length;
    const completionRate = tasks.length > 0 
      ? Math.round(completedTasksCount / tasks.length * 100) 
      : 0;
    const importantPendingCount = tasks.filter(task => !task.completed && task.priority === 'high').length;
    
    // 准备用于AI分析的数据对象
    const analysisData = {
      completedTasksCount,
      pendingTasksCount,
      completionRate,
      importantPendingCount,
      mainPlantName
    };
    
    console.log('AI数据准备完成:', JSON.stringify(analysisData));
    
    let aiResponse = {};
    
    try {
      // 尝试调用AI分析
      console.log('开始调用DeepSeek API');
      
      const prompt = `
作为一个任务管理应用的AI助手，请分析以下数据，并提供简短的总结和建议：

已完成任务数量: ${completedTasksCount}
待办任务数量: ${pendingTasksCount}
任务完成率: ${completionRate}%
高优先级未完成任务: ${importantPendingCount}
用户植物名称: ${mainPlantName}

请以以下格式提供分析:
总体评价: (简短的总体评价)
成就和进步: (列出用户的成就)
改进建议: (1-2条建议)
下一步行动: (1条具体行动建议)
`;
      
      // 调用AI生成分析
      const aiResponseText = await deepSeekClient.generateText({ prompt, max_tokens: 500 });
      aiResponse = parseAIResponse(aiResponseText);
      
    } catch (error) {
      console.log('调用DeepSeek API失败:', error);
      // 如果AI调用失败，使用备用分析
      console.log('使用备用分析方案');
      aiResponse = generateFallbackAnalysis(analysisData);
    }
    
    // 返回AI分析结果和基础数据
    res.json({
      success: true,
      analysis: aiResponse,
      stats: {
        completedTasks: completedTasksCount,
        pendingTasks: pendingTasksCount,
        completionRate: completionRate
      }
    });
    
  } catch (error) {
    console.error('AI分析出错:', error);
    res.status(500).json({
      success: false,
      message: `AI分析出错: ${error.message}`,
      fallbackAnalysis: {
        overview: '分析服务暂时不可用',
        achievements: '请稍后再试',
        suggestions: '继续完成您的任务',
        nextSteps: '专注于最重要的事情'
      }
    });
  }
});

module.exports = router; 