const express = require('express');
const auth = require('../middleware/auth');
const { SystemTasks, UserSystemTasks, Plants, Users } = require('../utils/localDB');
const router = express.Router();

// 获取所有系统任务
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /api/system-tasks called for user:', req.user.id);
    
    // 获取所有系统任务
    const systemTasks = await SystemTasks.find({});
    console.log('Raw systemTasks from DB:', systemTasks);
    
    if (!systemTasks || systemTasks.length === 0) {
      console.warn('No system tasks found in the database. Did you run /init?');
    }
    
    // 获取用户已完成的系统任务
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userCompletedTasks = await UserSystemTasks.find({
      userId: req.user.id,
      completedAt: { $gte: today.toISOString() }
    });
    console.log('User completed tasks today:', userCompletedTasks);

    // 将已完成信息添加到任务
    const tasks = systemTasks.map(task => {
      if (!task || !task._id) {
        console.error('Found invalid system task object:', task);
        return null;
      }
      const completed = userCompletedTasks.some(ut => ut.systemTaskId === task._id);
      return {
        ...task,
        completed
      };
    }).filter(task => task !== null);
    
    console.log('Mapped tasks being sent to frontend:', tasks);

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error in GET /api/system-tasks:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: `获取系统任务失败: ${error.message}`
    });
  }
});

// 获取单个系统任务
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await SystemTasks.findOne({ _id: req.params.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '系统任务不存在'
      });
    }
    
    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `获取系统任务失败: ${error.message}`
    });
  }
});

// 创建新的系统任务
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, frequency, reward, icon, category } = req.body;
    
    // 验证必填字段
    if (!title || !description || !frequency || !reward) {
      return res.status(400).json({
        success: false,
        message: '标题、描述、频率和奖励是必填字段'
      });
    }
    
    // 创建新任务
    const newTask = {
      title,
      description,
      frequency,
      reward: Number(reward),
      icon: icon || '📋',
      category: category || '未分类'
    };
    
    const createdTask = await SystemTasks.insert(newTask);
    
    res.status(201).json({
      success: true,
      message: '系统任务创建成功',
      task: createdTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `创建系统任务失败: ${error.message}`
    });
  }
});

// 更新系统任务
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, frequency, reward, icon, category } = req.body;
    
    // 检查任务是否存在
    const task = await SystemTasks.findOne({ _id: req.params.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '系统任务不存在'
      });
    }
    
    // 构建更新对象
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (reward !== undefined) updateData.reward = Number(reward);
    if (icon !== undefined) updateData.icon = icon;
    if (category !== undefined) updateData.category = category;
    
    // 如果没有需要更新的字段
    if (Object.keys(updateData).length === 0) {
      return res.json({
        success: true,
        message: '没有提供需要更新的字段',
        task
      });
    }
    
    // 更新任务
    await SystemTasks.update(
      { _id: req.params.id },
      { $set: updateData }
    );
    
    // 获取更新后的任务
    const updatedTask = await SystemTasks.findOne({ _id: req.params.id });
    
    res.json({
      success: true,
      message: '系统任务更新成功',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `更新系统任务失败: ${error.message}`
    });
  }
});

// 删除系统任务
router.delete('/:id', auth, async (req, res) => {
  try {
    // 检查任务是否存在
    const task = await SystemTasks.findOne({ _id: req.params.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '系统任务不存在'
      });
    }
    
    // 删除任务
    await SystemTasks.remove({ _id: req.params.id });
    
    // 删除相关的用户完成记录
    await UserSystemTasks.remove({ systemTaskId: req.params.id });
    
    res.json({
      success: true,
      message: '系统任务删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `删除系统任务失败: ${error.message}`
    });
  }
});

// 完成系统任务
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const systemTaskId = req.params.id;
    
    // 检查任务是否存在
    const systemTask = await SystemTasks.findOne({ _id: systemTaskId });
    if (!systemTask) {
      return res.status(404).json({
        success: false,
        message: '系统任务不存在'
      });
    }
    
    // 检查今天是否已完成
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingCompletion = await UserSystemTasks.findOne({
      userId: req.user.id,
      systemTaskId,
      completedAt: { $gte: today.toISOString() }
    });
    
    if (existingCompletion) {
      return res.status(400).json({
        success: false,
        message: '今天已经完成过此任务'
      });
    }
    
    // 记录任务完成
    const userSystemTask = {
      userId: req.user.id,
      systemTaskId,
      completedAt: new Date().toISOString(),
      rewardClaimed: true
    };
    
    await UserSystemTasks.insert(userSystemTask);
    
    // 更新用户的任务统计
    const user = await Users.findOne({ _id: req.user.id });
    if (user) {
      const todayStr = today.toISOString().split('T')[0];
      
      if (!user.dailyTaskStats) {
        user.dailyTaskStats = [];
      }

      const todayStats = user.dailyTaskStats.find(stat => stat.date === todayStr);
      if (todayStats) {
        todayStats.completed += 1;
      } else {
        user.dailyTaskStats.push({
          date: todayStr,
          total: 1,
          completed: 1
        });
      }

      await Users.update(
        { _id: req.user.id },
        { $set: { dailyTaskStats: user.dailyTaskStats } }
      );
    }
    
    // 给主植物增加经验值
    const mainPlant = await Plants.findOne({ 
      userId: req.user.id,
      isMainPlant: true
    });
    
    let plantUpdateResult = null;
    
    if (mainPlant) {
      // 计算新经验和等级
      let newExperience = mainPlant.experience + systemTask.reward;
      let newLevel = mainPlant.level;
      let levelUp = false;
      
      // 简单的等级计算逻辑: 每100经验升1级
      if (newExperience >= mainPlant.level * 100) {
        newLevel++;
        levelUp = true;
      }
      
      // 更新植物
      await Plants.update(
        { _id: mainPlant._id },
        { 
          $set: { 
            experience: newExperience,
            level: newLevel,
            lastInteraction: new Date().toISOString()
          } 
        }
      );
      
      const updatedPlant = await Plants.findOne({ _id: mainPlant._id });
      
      plantUpdateResult = {
        id: updatedPlant._id,
        name: updatedPlant.name,
        level: updatedPlant.level,
        experience: updatedPlant.experience,
        levelUp
      };
    }
    
    res.json({
      success: true,
      task: {
        id: systemTask._id,
        title: systemTask.title,
        completed: true
      },
      rewards: {
        coins: systemTask.reward,
        experience: systemTask.reward / 2
      },
      plantUpdate: plantUpdateResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 清空所有系统任务
router.delete('/reset/all', auth, async (req, res) => {
  try {
    // 删除所有系统任务
    const removedCount = await SystemTasks.remove({}, { multi: true });
    
    // 删除所有相关的用户完成记录
    await UserSystemTasks.remove({}, { multi: true });
    
    res.json({
      success: true,
      message: `已清空所有系统任务，删除了 ${removedCount} 条记录`,
      removedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `清空系统任务失败: ${error.message}`
    });
  }
});

// 初始化系统任务（仅供管理员使用）
router.post('/init', async (req, res) => {
  try {
    // 检查是否已有系统任务
    const existingTasks = await SystemTasks.count({});
    if (existingTasks > 0) {
      return res.status(400).json({
        success: false,
        message: '系统任务已经初始化'
      });
    }
    
    // 默认系统任务
    const defaultTasks = [
      {
        title: '立刻完成今天老师布置的作业',
        description: '🌱 刚下课就动手，趁热打铁完成作业，我会因为你的效率而快速抽芽！',
        frequency: 'daily',
        reward: 10,
        icon: '✍',
        category: '学习提升'
      },
      {
        title: '主动和异性聊天（挑战成为e人）',
        description: '🌸 勇敢迈出第一步，跟喜欢的同学聊句"早""在吗"，就像给我施了暖暖的阳光。',
        frequency: 'daily',
        reward: 10,
        icon: '💬',
        category: '社交挑战'
      },
      {
        title: '参加一次社团活动',
        description: '🌱 走出舒适区，去社团活动现场打卡，让我也感受到人群的热情与活力。',
        frequency: 'weekly',
        reward: 12,
        icon: '🎉',
        category: '成长体验'
      },
      {
        title: '学习一道新编程题',
        description: '🌾 给大脑打点"代码肥料"，挑战一道算法题，我会为你抽出新芽来庆祝！',
        frequency: 'daily',
        reward: 8,
        icon: '💻',
        category: '学习提升'
      },
      {
        title: '校园美景打卡',
        description: '🌼 用相机记录校园一隅，把照片分享给我，我会为你绽放一朵花。',
        frequency: 'daily',
        reward: 6,
        icon: '📷',
        category: '生活记录'
      },
      {
        title: '上课不玩手机',
        description: '🌿 上课铃声响起时，把手机收好，专心听讲，就像我在你身边静静汲取养分。',
        frequency: 'daily',
        reward: 7,
        icon: '📵',
        category: '自律挑战'
      },
      {
        title: '阳光跑步打卡',
        description: '🌞 今天阳光正好，去操场跑几圈吧！我会在窗边看着你动起来，我们都晒晒太阳。',
        frequency: 'daily',
        reward: 8,
        icon: '🏃‍♀',
        category: '健康习惯'
      },
      {
        title: '给家人打个电话',
        description: '🌿 和家人聊几句，像浇水一样温暖彼此的心，我也会因为你的温柔而长出新叶。',
        frequency: 'daily',
        reward: 5,
        icon: '📞',
        category: '情感联系'
      },
      {
        title: '挑战今天不玩游戏',
        description: '🕹 今天我们挑战自律模式！你专注学习，我也长出了一片新叶子，为你鼓掌！',
        frequency: 'daily',
        reward: 10,
        icon: '🚫🎮',
        category: '自律挑战'
      },
      {
        title: '一天手机使用不超过2小时',
        description: '📵 收起手机，把注意力还给生活和书本吧～我在这等你，静静陪着你。',
        frequency: 'daily',
        reward: 10,
        icon: '📱',
        category: '自律挑战'
      },
      {
        title: '晚上去图书馆自习',
        description: '📚 今晚去图书馆拼一波，把舍友卷哭！我也会在你认真学习时偷偷抽芽哦~',
        frequency: 'daily',
        reward: 12,
        icon: '🏫',
        category: '学习挑战'
      },
      {
        title: '吃一顿健康的饭（不叫外卖）',
        description: '🍲 今天让肠胃也舒舒服服吧，我也更有精神生长咯！我们都值得更健康。',
        frequency: 'daily',
        reward: 6,
        icon: '🥦',
        category: '健康习惯'
      },
      {
        title: '写一篇生活随笔或心情短文',
        description: '📖 把今天的感受写下来，像给我浇了一点心灵的露水，我们一起慢慢理解生活~',
        frequency: 'daily',
        reward: 8,
        icon: '✍',
        category: '情绪整理'
      }
    ];
    
    // 插入默认任务
    for (const task of defaultTasks) {
      await SystemTasks.insert(task);
    }
    
    const tasks = await SystemTasks.find({});
    
    res.status(201).json({
      success: true,
      message: '系统任务初始化成功',
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 