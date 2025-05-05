const express = require('express');
const auth = require('../middleware/auth');
const { SystemTasks, UserSystemTasks, Plants } = require('../utils/localDB');
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
        title: '给植物浇水',
        description: '确保植物有足够的水分',
        frequency: 'daily',
        reward: 10,
        icon: '💧',
        category: '植物养护'
      },
      {
        title: '阳光运动',
        description: '进行15分钟以上的户外活动',
        frequency: 'daily',
        reward: 15,
        icon: '☀️',
        category: '健康'
      },
      {
        title: '学习新知识',
        description: '阅读或学习任何新知识',
        frequency: 'daily',
        reward: 12,
        icon: '📚',
        category: '成长'
      },
      {
        title: '整理空间',
        description: '整理你的生活或工作空间',
        frequency: 'weekly',
        reward: 20,
        icon: '🧹',
        category: '生活'
      },
      {
        title: '联系朋友',
        description: '与朋友进行有意义的交流',
        frequency: 'weekly',
        reward: 18,
        icon: '👫',
        category: '社交'
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