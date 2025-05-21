const express = require('express');
const auth = require('../middleware/auth');
const { Users, Tasks, Posts, Conversations } = require('../utils/localDB');
const { DeepSeekClient } = require('../utils/apiClient');
const deepSeekClient = new DeepSeekClient();
const router = express.Router();

// 计算用户每日情绪分数
async function calculateDailyMoodScore(userId, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. 获取任务完成情况
    const tasks = await Tasks.find({
      userId,
      createdAt: {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      }
    });

    // 2. 获取帖子情绪
    const posts = await Posts.find({
      userId,
      updatedAt: {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      }
    });

    // 3. 获取与植物的对话
    const conversations = await Conversations.find({
      userId,
      createdAt: {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      }
    });

    // 准备数据用于AI分析
    const taskData = tasks.map(task => ({
      title: task.title,
      completed: task.completed,
      importance: task.importance || 'normal'
    }));

    const postData = posts.map(post => ({
      content: post.content,
      mood: post.mood,
      type: post.type
    }));

    const conversationData = conversations.map(conv => ({
      content: conv.content,
      timestamp: conv.createdAt
    }));

    // 构建提示词
    const prompt = `
请根据以下用户的一天活动数据，评估用户的心理状态并给出1-10的分数：

任务完成情况：
${JSON.stringify(taskData, null, 2)}

发布的帖子：
${JSON.stringify(postData, null, 2)}

与植物的对话：
${JSON.stringify(conversationData, null, 2)}

请分析这些数据并给出：
1. 一个1-10的整数分数（1分最差，10分最好）
2. 简要的分析理由（50字以内）

请以JSON格式返回，格式如下：
{
  "score": 数字,
  "reason": "分析理由"
}
`;

    try {
      // 调用 DeepSeek API 进行分析
      const analysis = await deepSeekClient.generateText({
        prompt,
        temperature: 0.3, // 使用较低的温度以获得更稳定的输出
        max_tokens: 200
      });

      // 解析返回的JSON
      const result = JSON.parse(analysis);
      
      return {
        score: Math.min(Math.max(result.score, 1), 10), // 确保分数在1-10之间
        details: {
          taskCount: tasks.length,
          completedTaskCount: tasks.filter(task => task.completed).length,
          postCount: posts.length,
          conversationCount: conversations.length,
          analysis: result.reason
        }
      };
    } catch (error) {
      console.error('DeepSeek API调用失败，使用备用评分方案:', error);
      
      // 备用评分方案
      const taskScore = tasks.length > 0 
        ? (tasks.filter(task => task.completed).length / tasks.length) * 4 
        : 0;

      const moodMap = {
        'happy': 3,
        'neutral': 2,
        'sad': 1
      };

      const postScore = posts.length > 0
        ? posts.reduce((sum, post) => sum + (moodMap[post.mood] || 2), 0) / posts.length
        : 0;

      const conversationScore = Math.min(conversations.length * 0.5, 3);

      const totalScore = Math.round(taskScore + postScore + conversationScore);

      return {
        score: Math.min(Math.max(totalScore, 1), 10),
        details: {
          taskScore,
          postScore,
          conversationScore,
          taskCount: tasks.length,
          completedTaskCount: tasks.filter(task => task.completed).length,
          postCount: posts.length,
          conversationCount: conversations.length,
          analysis: '使用备用评分方案'
        }
      };
    }
  } catch (error) {
    console.error('计算情绪分数失败:', error);
    throw error;
  }
}

// 自动更新用户每日情绪分数
router.post('/update', auth, async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '无效的日期格式'
      });
    }

    const dateStr = targetDate.toISOString().split('T')[0];
    const user = await Users.findOne({ _id: req.user.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 计算情绪分数
    const moodResult = await calculateDailyMoodScore(req.user.id, targetDate);

    // 更新用户的心理状态记录
    if (!user.mentalHealthStatus) {
      user.mentalHealthStatus = [];
    }

    const existingIndex = user.mentalHealthStatus.findIndex(item => item.date === dateStr);

    if (existingIndex >= 0) {
      user.mentalHealthStatus[existingIndex] = {
        date: dateStr,
        score: moodResult.score,
        details: moodResult.details
      };
    } else {
      user.mentalHealthStatus.push({
        date: dateStr,
        score: moodResult.score,
        details: moodResult.details
      });
    }

    // 保留最近30天的记录
    if (user.mentalHealthStatus.length > 30) {
      user.mentalHealthStatus.sort((a, b) => new Date(b.date) - new Date(a.date));
      user.mentalHealthStatus = user.mentalHealthStatus.slice(0, 30);
    }

    await Users.update(
      { _id: req.user.id },
      { $set: { mentalHealthStatus: user.mentalHealthStatus } }
    );

    res.json({
      success: true,
      message: '情绪分数已更新',
      moodData: {
        date: dateStr,
        score: moodResult.score,
        details: moodResult.details
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 