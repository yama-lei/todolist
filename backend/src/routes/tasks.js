const express = require('express');
const auth = require('../middleware/auth');
const { Tasks, Users } = require('../utils/localDB');
const router = express.Router();

// 获取用户所有任务
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Tasks.find({ userId: req.user.id }, { createdAt: -1 });
    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 创建新任务
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, deadline, important } = req.body;

    // 检查必填字段
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '请提供任务标题'
      });
    }

    // 处理important字段，将boolean转为string
    let importantValue = '';
    if (important !== undefined) {
      if (typeof important === 'boolean') {
        importantValue = important ? 'true' : 'false';
      } else {
        importantValue = important || 'false';
      }
    } else {
      importantValue = 'false';
    }

    const task = {
      userId: req.user.id,
      title,
      description: description || '',
      deadline: deadline || null,
      completed: false,
      important: importantValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newTask = await Tasks.insert(task);

    res.status(201).json({
      success: true,
      task: newTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 完成任务
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Tasks.findOne({ _id: taskId, userId: req.user.id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    const completedAt = new Date().toISOString();
    await Tasks.update(
      { _id: taskId },
      { 
        $set: { 
          completed: true, 
          completedAt,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    // 更新用户的任务统计
    const user = await Users.findOne({ _id: req.user.id });
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      
      if (!user.dailyTaskStats) {
        user.dailyTaskStats = [];
      }

      const todayStats = user.dailyTaskStats.find(stat => stat.date === today);
      if (todayStats) {
        todayStats.completed += 1;
      } else {
        user.dailyTaskStats.push({
          date: today,
          total: 1,
          completed: 1
        });
      }

      await Users.update(
        { _id: req.user.id },
        { $set: { dailyTaskStats: user.dailyTaskStats } }
      );
    }

    res.json({
      success: true,
      task: {
        id: task._id,
        title: task.title,
        completed: true,
        completedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取未来未完成任务合集
router.get('/future', auth, async (req, res) => {
  try {
    const now = new Date();
    const tasks = await Tasks.find({
      userId: req.user.id,
      completed: false,
      deadline: { $gte: now.toISOString() }
    });

    // 格式化任务数据
    const formattedTasks = tasks.map(task => {
      let deadline;
      try {
        // 确保日期字符串是有效的
        if (typeof task.deadline === 'string' && task.deadline.includes('T')) {
          deadline = new Date(task.deadline);
        } else {
          deadline = new Date();
        }
        
        // 检查日期是否有效
        if (isNaN(deadline.getTime())) {
          deadline = new Date();
        }
      } catch (e) {
        deadline = new Date();
      }

      return {
        title: task.title || '',
        description: task.description || '',
        deadline: `${deadline.getMonth() + 1}月${deadline.getDate()}日`,
        important: task.important || 'false'
      };
    });

    res.json({
      success: true,
      tasks: formattedTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取任务详情
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Tasks.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新任务
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, deadline, important } = req.body;
    const updates = {};
    
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (deadline !== undefined) updates.deadline = deadline;
    
    // 处理important字段，将boolean转为string
    if (important !== undefined) {
      if (typeof important === 'boolean') {
        updates.important = important ? 'true' : 'false';
      } else {
        updates.important = important;
      }
    }
    
    updates.updatedAt = new Date().toISOString();
    
    const task = await Tasks.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    await Tasks.update(
      { _id: req.params.id },
      { $set: updates }
    );
    
    const updatedTask = await Tasks.findOne({ _id: req.params.id });
    
    res.json({
      success: true,
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除任务
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Tasks.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    await Tasks.remove({ _id: req.params.id });
    
    res.json({
      success: true,
      message: '任务已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取用户心理状态和任务数量
router.get('/user/stats', auth, async (req, res) => {
  try {
    // 获取日期范围
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();
    
    // 模拟心理状态数据（实际应用中应该从数据库获取）
    const mentalHealthData = [];
    const taskCountData = [];
    
    // 生成每一天的数据
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // 获取当天的任务数量
      const dayTasks = await Tasks.find({
        userId: req.user.id,
        createdAt: {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lt: new Date(dateStr + 'T23:59:59.999Z')
        }
      });
      
      // 计算已完成任务数量
      const completedTasks = dayTasks.filter(task => task.completed).length;
      
      // 模拟心理状态（1-10）基于完成率
      const completionRate = dayTasks.length ? completedTasks / dayTasks.length : 0;
      const mentalHealthScore = Math.round(5 + completionRate * 5); // 基于完成率的简单计算
      
      mentalHealthData.push({
        date: dateStr,
        score: mentalHealthScore
      });
      
      taskCountData.push({
        date: dateStr,
        total: dayTasks.length,
        completed: completedTasks
      });
      
      // 前进一天
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      success: true,
      mentalHealth: mentalHealthData,
      taskCount: taskCountData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 