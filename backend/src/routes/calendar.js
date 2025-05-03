const express = require('express');
const auth = require('../middleware/auth');
const { Tasks, Posts, PlantThoughts, UserSystemTasks, SystemTasks } = require('../utils/localDB');
const router = express.Router();

// 获取月度日历数据
router.get('/monthly', auth, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    
    // 验证月份和年份
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: '无效的年份或月份'
      });
    }
    
    // 获取月份的第一天和最后一天
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // 获取用户在该月的所有任务
    const tasks = await Tasks.find({
      userId: req.user.id,
      deadline: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });
    
    // 获取用户在该月的所有帖子
    const posts = await Posts.find({
      userId: req.user.id,
      createdAt: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });
    
    // 按日期组织数据
    const days = [];
    for (let day = 1; day <= endDate.getDate(); day++) {
      const date = new Date(year, month - 1, day);
      const dateString = date.toISOString().split('T')[0];
      
      // 当天的任务
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.deadline).toISOString().split('T')[0];
        return taskDate === dateString;
      });
      
      // 当天的帖子
      const dayPosts = posts.filter(post => {
        const postDate = new Date(post.createdAt).toISOString().split('T')[0];
        return postDate === dateString;
      });
      
      // 统计任务完成情况
      const totalTasks = dayTasks.length;
      const completedTasks = dayTasks.filter(task => task.completed).length;
      
      days.push({
        date: dateString,
        tasks: dayTasks,
        posts: dayPosts.map(post => ({
          id: post._id,
          title: post.title,
          type: post.type,
          mood: post.mood,
          createdAt: post.createdAt
        })),
        taskCount: {
          total: totalTasks,
          completed: completedTasks,
          pending: totalTasks - completedTasks
        }
      });
    }
    
    res.json({
      success: true,
      year,
      month,
      days
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取日详情
router.get('/day', auth, async (req, res) => {
  try {
    const dateParam = req.query.date;
    if (!dateParam) {
      return res.status(400).json({
        success: false,
        message: '请提供日期参数'
      });
    }
    
    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: '无效的日期格式'
      });
    }
    
    // 设置日期范围（整天）
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // 获取当天的任务
    const tasks = await Tasks.find({
      userId: req.user.id,
      deadline: {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      }
    });
    
    // 获取当天完成的系统任务
    const userSystemTasks = await UserSystemTasks.find({
      userId: req.user.id,
      completedAt: {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      }
    });
    
    // 获取系统任务详情
    const systemTaskIds = userSystemTasks.map(t => t.systemTaskId);
    const systemTasks = await SystemTasks.find({
      _id: { $in: systemTaskIds }
    });
    
    // 合并系统任务信息
    const systemTasksWithDetails = userSystemTasks.map(ut => {
      const taskDetails = systemTasks.find(st => st._id === ut.systemTaskId);
      return {
        id: ut._id,
        systemTaskId: ut.systemTaskId,
        title: taskDetails ? taskDetails.title : '未知任务',
        completed: true,
        completedAt: ut.completedAt
      };
    });
    
    // 获取当天的帖子
    const posts = await Posts.find({
      userId: req.user.id,
      createdAt: {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      }
    });
    
    // 获取当天的植物心声
    const plantThoughts = await PlantThoughts.find({
      userId: req.user.id,
      timestamp: {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      }
    });
    
    // 统计数据
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
    
    // 星期几
    const dayOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
    
    res.json({
      success: true,
      date: dateParam,
      dayOfWeek,
      tasks,
      systemTasks: systemTasksWithDetails,
      posts,
      plantThoughts,
      statistics: {
        completionRate,
        totalTasks,
        completedTasks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取日历视图统计数据
router.get('/statistics', auth, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    
    // 验证月份和年份
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: '无效的年份或月份'
      });
    }
    
    // 获取月份的第一天和最后一天
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // 获取用户在该月的所有任务
    const tasks = await Tasks.find({
      userId: req.user.id,
      deadline: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });
    
    // 获取用户在该月的所有帖子
    const posts = await Posts.find({
      userId: req.user.id,
      createdAt: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });
    
    // 统计数据
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? parseFloat((completedTasks / totalTasks * 100).toFixed(1)) : 0;
    
    const totalPosts = posts.length;
    const postsByType = {
      diary: posts.filter(post => post.type === 'diary').length,
      thought: posts.filter(post => post.type === 'thought').length
    };
    
    // 按工作日统计任务
    const byWeekday = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    };
    
    // 任务重要性统计
    const byImportance = {
      important: 0,
      normal: 0
    };
    
    // 忙碌天数和空闲天数
    const dateTaskCount = {};
    
    tasks.forEach(task => {
      const taskDate = new Date(task.deadline);
      const dateStr = taskDate.toISOString().split('T')[0];
      
      if (!dateTaskCount[dateStr]) {
        dateTaskCount[dateStr] = 0;
      }
      dateTaskCount[dateStr]++;
      
      // 统计星期几
      const dayOfWeek = taskDate.getDay();
      if (dayOfWeek === 1) byWeekday.monday++;
      else if (dayOfWeek === 2) byWeekday.tuesday++;
      else if (dayOfWeek === 3) byWeekday.wednesday++;
      else if (dayOfWeek === 4) byWeekday.thursday++;
      else if (dayOfWeek === 5) byWeekday.friday++;
      else if (dayOfWeek === 6) byWeekday.saturday++;
      else byWeekday.sunday++;
      
      // 统计重要性
      if (task.important) {
        byImportance.important++;
      } else {
        byImportance.normal++;
      }
    });
    
    // 找出忙碌和空闲的天数
    const busyDays = [];
    const freeDays = [];
    
    Object.keys(dateTaskCount).forEach(date => {
      if (dateTaskCount[date] >= 3) {
        busyDays.push(date);
      } else if (dateTaskCount[date] === 0) {
        freeDays.push(date);
      }
    });
    
    res.json({
      success: true,
      period: {
        year,
        month
      },
      statistics: {
        totalTasks,
        completedTasks,
        completionRate,
        totalPosts,
        postsByType,
        busyDays,
        freeDays
      },
      taskDistribution: {
        byWeekday,
        byImportance
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