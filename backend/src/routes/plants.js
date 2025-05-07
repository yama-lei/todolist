const express = require('express');
const auth = require('../middleware/auth');
const { Plants, PlantThoughts, Conversations } = require('../utils/localDB');
const DeepSeekClient = require('../utils/apiClient'); // 导入 DeepSeekClient 类
const deepSeekClient = new DeepSeekClient(); // 创建 DeepSeekClient 实例
const router = express.Router();

// 获取用户所有植物
router.get('/', auth, async (req, res) => {
  try {
    const plants = await Plants.find({ userId: req.user.id });
    res.json({
      success: true,
      plants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}); 

// 创建新植物
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, emoji, isMainPlant } = req.body;
    
    // 检查必填字段
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: '请提供植物名称和类型'
      });
    }
    
    // 如果设置为主植物，将其他植物设置为非主植物
    if (isMainPlant) {
      await Plants.update(
        { userId: req.user.id, isMainPlant: true },
        { $set: { isMainPlant: false } },
        { multi: true }
      );
    }
    
    const plant = {
      userId: req.user.id,
      name,
      type,
      emoji: emoji || '🌱',
      level: 1,
      experience: 0,
      mood: 'neutral',
      state: 'seedling', // 初始阶段为幼苗
      growthStage: 1, // 成长阶段 1-3
      weather: 'sunny',
      isMainPlant: isMainPlant || false,
      createdAt: new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
      traits: ['友好', '活泼'] // 默认特性
    };
    
    const newPlant = await Plants.insert(plant);
    
    res.status(201).json({
      success: true,
      plant: newPlant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取植物详情
router.get('/:id', auth, async (req, res) => {
  try {
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    res.json({
      success: true,
      plant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新植物信息
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, emoji, isMainPlant, mood } = req.body;
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    const updatedFields = {};
    
    // 只更新提供的字段
    if (name) updatedFields.name = name;
    if (emoji) updatedFields.emoji = emoji;
    
    // 验证并更新心情
    if (mood) {
      // 验证心情值是否有效
      const validMoods = ['happy', 'neutral', 'sad'];
      if (!validMoods.includes(mood)) {
        return res.status(400).json({
          success: false,
          message: '无效的心情值，必须是 happy、neutral 或 sad'
        });
      }
      updatedFields.mood = mood;
    }
    
    // 如果设置为主植物，将其他植物设置为非主植物
    if (isMainPlant === true && !plant.isMainPlant) {
      await Plants.update(
        { userId: req.user.id, isMainPlant: true },
        { $set: { isMainPlant: false } },
        { multi: true }
      );
      updatedFields.isMainPlant = true;
    } else if (isMainPlant === false) {
      updatedFields.isMainPlant = false;
    }
    
    // 如果没有要更新的字段，返回原始植物信息
    if (Object.keys(updatedFields).length === 0) {
      return res.json({
        success: true,
        plant,
        message: '没有更新任何字段'
      });
    }
    
    // 更新最后交互时间
    updatedFields.lastInteraction = new Date().toISOString();
    
    // 更新植物信息
    await Plants.update(
      { _id: req.params.id },
      { $set: updatedFields }
    );
    
    const updatedPlant = await Plants.findOne({ _id: req.params.id });
    
    res.json({
      success: true,
      plant: updatedPlant,
      message: '植物信息更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除植物
router.delete('/:id', auth, async (req, res) => {
  try {
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    // 如果是主植物，不允许删除
    if (plant.isMainPlant) {
      return res.status(400).json({
        success: false,
        message: '不能删除主植物，请先设置其他植物为主植物'
      });
    }
    
    // 删除植物
    await Plants.remove({ _id: req.params.id });
    
    // 删除相关的心声和对话
    await PlantThoughts.remove({ plantId: req.params.id });
    await Conversations.remove({ plantId: req.params.id });
    
    res.json({
      success: true,
      message: '植物已成功删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 增加植物经验
router.put('/:id/experience', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的经验值'
      });
    }
    
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    // 计算新经验和等级
    let newExperience = plant.experience + amount;
    let newLevel = plant.level;
    let levelUp = false;
    let stageChange = false;
    let growthStage = plant.growthStage || 1;
    
    // 简单的等级计算逻辑: 每100经验升1级
    if (newExperience >= plant.level * 100) {
      newLevel++;
      levelUp = true;
      
      // 生长阶段变化判断：1阶段(1-3级)，2阶段(4-7级)，3阶段(8级以上)
      if (newLevel >= 8 && growthStage < 3) {
        growthStage = 3;
        stageChange = true;
      } else if (newLevel >= 4 && growthStage < 2) {
        growthStage = 2;
        stageChange = true;
      }
    }
    
    // 生长阶段对应的状态
    let state = plant.state;
    if (stageChange) {
      switch(growthStage) {
        case 1:
          state = 'seedling'; // 幼苗
          break;
        case 2:
          state = 'growing'; // 成长中
          break;
        case 3:
          state = 'mature'; // 成熟
          break;
      }
    }
    
    // 更新植物
    await Plants.update(
      { _id: req.params.id },
      { 
        $set: { 
          experience: newExperience,
          level: newLevel,
          growthStage: growthStage,
          state: state,
          lastInteraction: new Date().toISOString()
        } 
      }
    );
    
    const updatedPlant = await Plants.findOne({ _id: req.params.id });
    
    res.json({
      success: true,
      plant: {
        id: updatedPlant._id,
        name: updatedPlant.name,
        level: updatedPlant.level,
        experience: updatedPlant.experience,
        state: updatedPlant.state,
        growthStage: updatedPlant.growthStage
      },
      levelUp,
      stageChange
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新植物生长阶段
router.put('/:id/growth-stage', auth, async (req, res) => {
  try {
    const { stage } = req.body;
    
    if (!stage || isNaN(stage) || stage < 1 || stage > 3) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的生长阶段 (1-3)'
      });
    }
    
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    // 根据生长阶段设置状态
    let state;
    switch(parseInt(stage)) {
      case 1:
        state = 'seedling'; // 幼苗
        break;
      case 2:
        state = 'growing'; // 成长中
        break;
      case 3:
        state = 'mature'; // 成熟
        break;
    }
    
    // 更新植物
    await Plants.update(
      { _id: req.params.id },
      { 
        $set: { 
          growthStage: parseInt(stage),
          state: state,
          lastInteraction: new Date().toISOString()
        } 
      }
    );
    
    const updatedPlant = await Plants.findOne({ _id: req.params.id });
    
    res.json({
      success: true,
      plant: updatedPlant,
      message: `植物生长阶段已更新为${stage}（${state}）`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取植物心声历史记录
router.get('/:id/thoughts', auth, async (req, res) => {
  try {
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    const thoughts = await PlantThoughts.find(
      { plantId: req.params.id, userId: req.user.id },
      { timestamp: -1 }
    );
    
    res.json({
      success: true,
      thoughts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 生成新的植物心声
router.post('/:id/thoughts', auth, async (req, res) => {
  try {
    const { context } = req.body;
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    // 使用DeepSeek API生成心声
    const content = await deepSeekClient.generatePlantThought(plant, context);
    
    // 生成随机标签和图标
    const thoughtTypes = ['weather', 'motivation', 'reflection'];
    const icons = ['🌞', '🌈', '🌱', '🌻', '💧'];
    const tags = ['早安问候', '天气感知', '成长鼓励', '日常感想'];
    
    const type = thoughtTypes[Math.floor(Math.random() * thoughtTypes.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    const tag = tags[Math.floor(Math.random() * tags.length)];
    
    const thought = {
      plantId: req.params.id,
      userId: req.user.id,
      content,
      type,
      icon,
      tag,
      timestamp: new Date().toISOString(),
      context: {
        weather: context.weather || 'sunny',
        recentTasks: context.recentTasks || [],
        timeOfDay: context.timeOfDay || 'morning'
      }
    };
    
    const newThought = await PlantThoughts.insert(thought);
    
    // 更新植物最后交互时间
    await Plants.update(
      { _id: req.params.id },
      { $set: { lastInteraction: new Date().toISOString() } }
    );
    
    res.status(201).json({
      success: true,
      thought: newThought
    });
  } catch (error) {
    console.error('生成植物心声失败', error);
    res.status(500).json({
      success: false,
      message: error.message || '生成植物心声失败'
    });
  }
});

// 获取与植物的对话历史
router.get('/:id/conversations', auth, async (req, res) => {
  try {
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    // 查找或创建对话
    let conversation = await Conversations.findOne({ 
      plantId: req.params.id, 
      userId: req.user.id 
    });
    
    if (!conversation) {
      conversation = {
        plantId: req.params.id,
        userId: req.user.id,
        messages: []
      };
      conversation = await Conversations.insert(conversation);
    }
    
    // 处理分页
    const limit = parseInt(req.query.limit) || 20;
    const before = req.query.before ? new Date(req.query.before) : null;
    
    let messages = conversation.messages || [];
    if (before) {
      messages = messages.filter(msg => new Date(msg.timestamp) < before);
    }
    
    // 只返回限制数量的消息
    const hasMore = messages.length > limit;
    messages = messages.slice(-limit).reverse();
    
    res.json({
      success: true,
      messages,
      hasMore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 发送消息给植物并获取回复
router.post('/:id/conversations', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: '请提供消息内容'
      });
    }
    
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    // 查找或创建对话
    let conversation = await Conversations.findOne({ 
      plantId: req.params.id, 
      userId: req.user.id 
    });
    
    if (!conversation) {
      conversation = {
        plantId: req.params.id,
        userId: req.user.id,
        messages: []
      };
      conversation = await Conversations.insert(conversation);
    }
    
    // 添加用户消息
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    // 获取历史消息用于上下文
    const messageHistory = conversation.messages || [];
    
    // 使用DeepSeek API生成回复
    const responseContent = await deepSeekClient.generatePlantResponse(
      plant, 
      message, 
      messageHistory.slice(-10) // 只使用最近10条消息作为上下文
    );
    
    // 植物回复
    const plantResponse = {
      id: (Date.now() + 1).toString(),
      sender: 'plant',
      content: responseContent,
      timestamp: new Date(Date.now() + 1000).toISOString() // 略晚于用户消息
    };
    
    // 更新对话
    if (!conversation.messages) {
      conversation.messages = [];
    }
    
    conversation.messages.push(userMessage, plantResponse);
    
    await Conversations.update(
      { _id: conversation._id },
      { $set: { messages: conversation.messages } }
    );
    
    // 更新植物最后交互时间
    await Plants.update(
      { _id: req.params.id },
      { $set: { lastInteraction: new Date().toISOString() } }
    );
    
    res.json({
      success: true,
      response: plantResponse
    });
  } catch (error) {
    console.error('生成植物回复失败', error);
    res.status(500).json({
      success: false,
      message: error.message || '生成植物回复失败'
    });
  }
});

module.exports = router; 