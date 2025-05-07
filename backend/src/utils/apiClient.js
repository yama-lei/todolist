const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// DeepSeek API客户端类
class DeepSeekClient {
  constructor() {
    // 尝试从环境变量获取API密钥，如果没有则使用默认值
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseURL = 'https://api.deepseek.com';  // 修正baseURL
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 15000 // 设置更短的超时时间，15秒
    });
    
    if (!this.apiKey) {
      console.warn('警告: DEEPSEEK_API_KEY 未在环境变量中设置，AI分析功能将使用备用方案');
    }

    // 预设的心声模板
    this.thoughtTemplates = {
      happy: [
        "阳光真温暖！✨ {taskContext}感觉整个世界都在发光呢！",
        "今天的心情特别好！🌟 {taskContext}希望主人也能感受到这份快乐～",
        "枝叶舒展，心情愉悦！💫 {taskContext}这样的日子真是太棒了！"
      ],
      neutral: [
        "微风轻拂，心情平静。🍃 {taskContext}享受这份宁静时光。",
        "阳光正好，不冷不热。☘️ {taskContext}平和安宁的一天。",
        "静静地看着主人，{taskContext}感受着生活的美好。💭"
      ],
      sad: [
        "今天的阳光有点躲躲藏藏的...🌧️ {taskContext}希望能得到主人的关心。",
        "叶子有点蔫蔫的，💧 {taskContext}需要主人的爱护呢。",
        "虽然有点小难过，🍂 但{taskContext}相信明天会更好！"
      ]
    };
  }

  /**
   * 调用DeepSeek API生成文本
   * @param {Object} options - 请求选项
   * @param {string} options.prompt - 提示文本
   * @param {string} options.model - 模型名称，默认为'deepseek-chat'
   * @param {number} options.temperature - 温度参数，控制随机性
   * @param {number} options.max_tokens - 最大生成令牌数
   * @returns {Promise<string>} - 生成的文本内容
   */
  async generateText({ prompt, temperature = 0.7, max_tokens = 800 }) {
    // 如果没有API密钥，直接抛出错误
    if (!this.apiKey) {
      throw new Error('API密钥未设置，无法调用DeepSeek API');
    }
    
    try {
      console.log('调用DeepSeek API...');
      
      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        max_tokens: max_tokens,
        stream: false
      });
      
      // 直接返回内容文本，简化处理
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API调用失败:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('DeepSeek API请求超时，请稍后再试');
      }
      
      // 返回API错误详情
      const errorMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`DeepSeek API错误: ${errorMsg}`);
    }
  }
  
  /**
   * 生成植物心声
   * @param {Object} plant - 植物信息
   * @param {Object} context - 上下文信息
   * @returns {Promise<string>} - 生成的植物心声
   */
  async generatePlantThought(plant, context) {
    try {
      if (!this.apiKey) {
        // 如果没有API密钥，使用备用生成方案
        return this.generateBackupThought(plant, context);
      }

      // 构建提示词
      const prompt = `
你是一个名叫${plant.name}的植物，性格${context.moodTone || '平和'}。
现在你要根据当前的心情和状态，生成一段简短的心里话。

当前状态：
- 心情：${context.mood || 'neutral'}
- 情感基调：${context.moodTone || '平和安静'}
- 天气：${context.weather || 'sunny'}
- 时间：${context.timeOfDay || 'morning'}
- 生长阶段：${plant.growthStage || 1} (1-幼苗期，2-成长期，3-成熟期)
- 等级：${plant.level || 1}

参考关键词：${(context.moodKeywords || []).join('、')}
可用表情：${(context.moodEmoji || []).join(' ')}

最近完成的任务：
${context.recentTasks ? context.recentTasks.map(task => `- ${task.title}`).join('\n') : '暂无最近完成的任务'}

请以植物的视角，生成一段30-50字的心里话，要体现出当前的心情状态，并根据天气、时间等因素自然地表达感受。
语气要自然温暖，避免过于做作或夸张。可以适当使用1-2个表情符号，但不要过多。
`;

      try {
        // 调用 API 生成内容
        const response = await this.client.post('/chat/completions', {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个能够理解植物心情和感受的AI助手，善于以植物的视角表达想法和感受。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        });

        if (response.data?.choices?.[0]?.message?.content) {
          return response.data.choices[0].message.content.trim();
        } else {
          throw new Error('API响应格式无效');
        }
      } catch (apiError) {
        console.error('API调用失败，使用备用生成方案:', apiError);
        return this.generateBackupThought(plant, context);
      }
    } catch (error) {
      console.error('生成植物心声失败:', error);
      return this.generateBackupThought(plant, context);
    }
  }
  
  /**
   * 备用的心声生成方法
   * @param {Object} plant - 植物信息
   * @param {Object} context - 上下文信息
   * @returns {string} - 生成的心声
   */
  generateBackupThought(plant, context) {
    const mood = context.mood || 'neutral';
    const templates = this.thoughtTemplates[mood] || this.thoughtTemplates.neutral;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // 构建任务相关的上下文
    let taskContext = '';
    if (context.recentTasks && context.recentTasks.length > 0) {
      if (mood === 'happy') {
        taskContext = `看到主人完成了${context.recentTasks.length}个任务，`;
      } else if (mood === 'neutral') {
        taskContext = `默默关注着主人的进度，`;
      } else {
        taskContext = `虽然有点担心主人的任务，但`;
      }
    }
    
    // 替换模板中的任务上下文
    return template.replace('{taskContext}', taskContext);
  }
  
  /**
   * 生成植物对话回复
   * @param {Object} plant - 植物信息
   * @param {string} userMessage - 用户消息
   * @param {Array} messageHistory - 消息历史
   * @returns {Promise<string>} - 生成的回复内容
   */
  async generatePlantResponse(plant, userMessage, messageHistory = []) {
    try {
      const { name, type, mood, level, traits = [] } = plant;
      
      // 构建历史消息记录，最多取最近5条
      const recentHistory = messageHistory.slice(-5).map(msg => {
        return {
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        };
      });
      
      // 构建系统提示
      const systemPrompt = `
你是一个名为"${name}"的${type}植物，拥有${traits.join('、')}的特性。
你现在的等级为${level}级，心情是${mood}。
请以植物的视角回复用户的消息，表现出友好、可爱的性格。
回复应简短（不超过100字），有趣，并带有植物的特色。
`;
      
      // 构建完整的消息列表
      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: userMessage }
      ];
      
      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.8,
        max_tokens: 200,
        stream: false
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('生成植物回复失败:', error);
      // 生成失败时返回默认回复
      return `我是${plant.name}，很高兴和你聊天！你刚才说的我都明白了！`;
    }
  }
}

module.exports = DeepSeekClient; 