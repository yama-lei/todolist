const express = require('express');
const auth = require('../middleware/auth');
const { SystemTasks, UserSystemTasks, Plants } = require('../utils/localDB');
const router = express.Router();

// 获取所有系统任务
router.get('/', auth, async (req, res) => {
  try {
    // 获取所有系统任务
    const systemTasks = await SystemTasks.find({});
    
    // 获取用户已完成的系统任务
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userCompletedTasks = await UserSystemTasks.find({
      userId: req.user.id,
      completedAt: { $gte: today.toISOString() }
    });
    
    // 将已完成信息添加到任务
    const tasks = systemTasks.map(task => {
      const completed = userCompletedTasks.some(ut => ut.systemTaskId === task._id);
      return {
        ...task,
        completed
      };
    });
    
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