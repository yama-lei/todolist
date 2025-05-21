const express = require('express');
const auth = require('../middleware/auth');
const { Plants, PlantThoughts, Conversations } = require('../utils/localDB');
const { DeepSeekClient, DifyClient } = require('../utils/apiClient'); // 修改导入语句
const deepSeekClient = new DeepSeekClient();
const difyClient = new DifyClient(); // 添加 DifyClient 实例化
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
    console.log('收到生成植物心声请求:', { plantId: req.params.id, context });
    
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      console.log('植物不存在:', req.params.id);
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    console.log('找到植物:', plant);
    
    // 查找或创建对话
    let conversation = await Conversations.findOne({ 
      plantId: req.params.id, 
      userId: req.user.id 
    });
    
    if (!conversation) {
      conversation = {
        plantId: req.params.id,
        userId: req.user.id,
        messages: [],
        difyConversationId: null
      };
      conversation = await Conversations.insert(conversation);
    }
    
    console.log('当前对话信息:', conversation);
    
    // 合并心情上下文和原有上下文
    const enrichedContext = {
      ...context,
      mood: plant.mood || 'neutral',
      weather: context.weather || 'sunny',
      timeOfDay: context.timeOfDay || 'morning'
    };

    console.log('构建的上下文:', enrichedContext);

    // 构建提示词
    const prompt = `
你是一个名叫${plant.name}的植物，是用户的朋友。请以植物的视角，生成一段符合你的植物性格的心里话。
`;

    console.log('准备调用Dify API，提示词:', prompt);

    try {
      // 调用 Dify API 生成心声，使用对话的 conversation_id
      const difyResponse = await difyClient.sendMessage(
        prompt,
        plant.type || '未知植物',
        req.headers.authorization,
        conversation.difyConversationId,
        req.params.id,
        1  // plantThought 设置为 1，表示这是植物心声
      );
      
      console.log('Dify API响应:', difyResponse);
      
      // 如果返回了新的 conversation_id，更新对话记录
      if (difyResponse.conversation_id && difyResponse.conversation_id !== conversation.difyConversationId) {
        conversation.difyConversationId = difyResponse.conversation_id;
        await Conversations.update(
          { _id: conversation._id },
          { $set: { difyConversationId: difyResponse.conversation_id } }
        );
      }
      
      // 根据心情选择合适的标签和图标
      const moodBasedIcons = {
        happy: ['🌞', '🌈', '🌻', '✨'],
        neutral: ['🌱', '🍃', '☘️', '💭'],
        sad: ['🌧️', '💧', '🍂', '🌫️']
      };
      
      const moodBasedTags = {
        happy: ['开心时刻', '阳光心情', '快乐分享', '温暖日常'],
        neutral: ['日常感想', '平静时光', '生活随想', '自然之声'],
        sad: ['等待阳光', '需要关爱', '雨天心情', '温暖祝愿']
      };
      
      const currentMood = plant.mood || 'neutral';
      const icons = moodBasedIcons[currentMood];
      const tags = moodBasedTags[currentMood];
      
      const icon = icons[Math.floor(Math.random() * icons.length)];
      const tag = tags[Math.floor(Math.random() * tags.length)];
      
      const thought = {
        plantId: req.params.id,
        userId: req.user.id,
        content: difyResponse.answer,
        type: 'mood',
        icon,
        tag,
        timestamp: new Date().toISOString(),
        context: enrichedContext,
        difyMessageId: difyResponse.message_id
      };
      
      console.log('生成的心声对象:', thought);
      
      const newThought = await PlantThoughts.insert(thought);
      console.log('保存到数据库的心声:', newThought);
      
      // 更新植物最后交互时间
      await Plants.update(
        { _id: req.params.id },
        { $set: { lastInteraction: new Date().toISOString() } }
      );
      
      res.status(201).json({
        success: true,
        thought: newThought
      });
    } catch (difyError) {
      console.error('Dify API调用失败，使用备用方案:', difyError);
      
      // 如果Dify API调用失败，使用DeepSeek API作为备用
      const responseContent = await deepSeekClient.generatePlantThought(plant, enrichedContext);
      
      // 根据心情选择合适的标签和图标
      const moodBasedIcons = {
        happy: ['🌞', '🌈', '🌻', '✨'],
        neutral: ['🌱', '🍃', '☘️', '💭'],
        sad: ['🌧️', '💧', '🍂', '🌫️']
      };
      
      const moodBasedTags = {
        happy: ['开心时刻', '阳光心情', '快乐分享', '温暖日常'],
        neutral: ['日常感想', '平静时光', '生活随想', '自然之声'],
        sad: ['等待阳光', '需要关爱', '雨天心情', '温暖祝愿']
      };
      
      const currentMood = plant.mood || 'neutral';
      const icons = moodBasedIcons[currentMood];
      const tags = moodBasedTags[currentMood];
      
      const icon = icons[Math.floor(Math.random() * icons.length)];
      const tag = tags[Math.floor(Math.random() * tags.length)];
      
      const thought = {
        plantId: req.params.id,
        userId: req.user.id,
        content: responseContent,
        type: 'mood',
        icon,
        tag,
        timestamp: new Date().toISOString(),
        context: enrichedContext
      };
      
      console.log('使用备用方案生成的心声对象:', thought);
      
      const newThought = await PlantThoughts.insert(thought);
      console.log('保存到数据库的心声:', newThought);
      
      // 更新植物最后交互时间
      await Plants.update(
        { _id: req.params.id },
        { $set: { lastInteraction: new Date().toISOString() } }
      );
      
      res.status(201).json({
        success: true,
        thought: newThought
      });
    }
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
    
    // 确保消息按时间戳排序（从早到晚）
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (before) {
      messages = messages.filter(msg => new Date(msg.timestamp) < before);
    }
    
    // 只返回限制数量的消息，按时间顺序排列
    const hasMore = messages.length > limit;
    messages = messages.slice(-limit);
    
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
        messages: [],
        difyConversationId: null // 添加Dify的会话ID字段
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
    
    // 准备调用Dify API
    const { DifyClient } = require('../utils/apiClient');
    const difyClient = new DifyClient();
    
    // 使用用户Token
    const userToken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    
    try {
      // 调用Dify API获取回复
      const difyResponse = await difyClient.sendMessage(
        message,
        plant.type || '未知植物',
        userToken,
        conversation.difyConversationId,
        req.params.id
      );
      
      // 保存Dify的会话ID以供下次使用
      if (difyResponse.conversation_id && difyResponse.conversation_id !== conversation.difyConversationId) {
        conversation.difyConversationId = difyResponse.conversation_id;
        await Conversations.update(
          { _id: conversation._id },
          { $set: { difyConversationId: difyResponse.conversation_id } }
        );
      }
      
      // 植物回复
      const plantResponse = {
        id: difyResponse.message_id || (Date.now() + 1).toString(),
        sender: 'plant',
        content: difyResponse.answer,
        timestamp: new Date(Date.now() + 1000).toISOString(), // 略晚于用户消息
        difyMessageId: difyResponse.message_id // 保存Dify的消息ID
      };
      
      // 更新对话
      if (!conversation.messages) {
        conversation.messages = [];
      }
      
      conversation.messages.push(userMessage, plantResponse);
      
      await Conversations.update(
        { _id: conversation._id },
        { $set: { 
          messages: conversation.messages,
          difyConversationId: conversation.difyConversationId 
        } }
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
    } catch (apiError) {
      console.error('Dify API调用失败，使用备用方案:', apiError);
      
      // 如果Dify API调用失败，使用备用方案
      const { DeepSeekClient } = require('../utils/apiClient');
      const deepSeekClient = new DeepSeekClient();
      
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
      conversation.messages.push(userMessage, plantResponse);
      
      await Conversations.update(
        { _id: conversation._id },
        { $set: { messages: conversation.messages } }
      );
      
      res.json({
        success: true,
        response: plantResponse
      });
    }
  } catch (error) {
    console.error('生成植物回复失败', error);
    res.status(500).json({
      success: false,
      message: error.message || '生成植物回复失败'
    });
  }
});

// 清空与植物的对话
router.delete('/:id/conversations', auth, async (req, res) => {
  try {
    const plant = await Plants.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: '植物不存在'
      });
    }
    
    // 查找对话
    const conversation = await Conversations.findOne({ 
      plantId: req.params.id, 
      userId: req.user.id 
    });
    
    if (conversation) {
      // 清空对话消息
      await Conversations.update(
        { _id: conversation._id },
        { $set: { 
          messages: [],
          difyConversationId: null // 同时清空Dify会话ID
        } }
      );
    }
    
    res.json({
      success: true,
      message: '对话已清空'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 