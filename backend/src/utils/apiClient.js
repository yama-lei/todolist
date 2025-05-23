const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Dify API客户端类
class DifyClient {
  constructor() {
    this.apiKey = process.env.DIFY_API_KEY || 'app-gjfyF1qlTYDpj4x8hGKFUuXC';
    this.baseURL = 'https://api.dify.ai/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 30000
    });
  }

  /**
   * 发送消息给Dify API并获取回复
   * @param {string} message - 用户消息
   * @param {string} plantType - 植物类型
   * @param {string} userToken - 用户认证token
   * @param {string} conversationId - 会话ID（可选）
   * @param {string} plantId - 植物ID（用作用户标识）
   * @param {number} plantThought - 植物心情
   * @returns {Promise<Object>} - Dify的响应
   */
  async sendMessage(message, plantType, userToken, conversationId, plantId, plantThought = 0) {
    try {
      console.log('DifyClient.sendMessage 被调用:', {
        message,
        plantType,
        hasToken: !!userToken,
        conversationId: conversationId || '新会话',
        plantId,
        plantThought
      });

      // 注意：userToken 不需要添加 Bearer 前缀，因为这个前缀在 Dify 平台已经添加
      // 如果传入的 userToken 已包含 Bearer 前缀，则去除它
      let cleanToken = userToken;
      if (userToken && userToken.startsWith('Bearer ')) {
        cleanToken = userToken.substring(7);
      }

      const requestBody = {
        query: message,
        inputs: {
          plantType: plantType || '未知植物',
          authorization: cleanToken,
          plantThought: plantThought
        },
        response_mode: 'blocking',
        user: plantId || 'anonymous_user'
      };

      // 如果有对话ID，添加到请求中
      if (conversationId) {
        requestBody.conversation_id = conversationId;
      }

      console.log('发送消息到Dify API:', { 
        message, 
        plantType, 
        hasToken: !!userToken,
        conversationId: conversationId || '新会话',
        plantId,
        plantThought,
        requestBody
      });
      
      const response = await this.client.post('/chat-messages', requestBody);
      
      console.log('Dify API响应:', {
        responseStatus: response.status,
        conversationId: response.data.conversation_id,
        messageId: response.data.message_id,
        answer: response.data.answer
      });
      
      return {
        answer: response.data.answer,
        conversation_id: response.data.conversation_id,
        message_id: response.data.message_id
      };
    } catch (error) {
      console.error('Dify API调用失败:', error.message);
      
      // 如果有详细的错误响应，记录下来
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误数据:', error.response.data);
      }
      
      throw new Error(`Dify API错误: ${error.message}`);
    }
  }
}

// DeepSeek API客户端类
class DeepSeekClient {
  constructor() {
    // 尝试从环境变量获取API密钥，如果没有则使用默认值
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseURL = 'https://api.deepseek.com';  // 修正baseURL
    
    // 增加更详细的日志记录
    console.log('DeepSeek API初始化:', {
      apiKeySet: !!this.apiKey,
      baseURL: this.baseURL
    });

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 30000 // 增加超时时间到30秒
    });

    // 添加请求拦截器，用于日志记录和额外的错误检查
    this.client.interceptors.request.use(
      config => {
        console.log('DeepSeek API请求配置:', {
          url: config.url,
          method: config.method,
          headers: config.headers
        });
        return config;
      },
      error => {
        console.error('DeepSeek API请求配置错误:', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器，用于额外的错误处理
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('DeepSeek API响应错误:', {
          errorMessage: error.message,
          errorCode: error.code,
          errorResponse: error.response?.data
        });

        // 更详细的错误处理
        if (error.response) {
          // 服务器返回了错误状态码
          switch (error.response.status) {
            case 401:
              console.error('DeepSeek API授权失败，请检查API密钥');
              break;
            case 429:
              console.error('DeepSeek API请求过于频繁，已触发速率限制');
              break;
            case 500:
              console.error('DeepSeek API服务器内部错误');
              break;
            default:
              console.error(`DeepSeek API未知错误：状态码 ${error.response.status}`);
          }
        } else if (error.request) {
          // 请求已发送但未收到响应
          console.error('DeepSeek API无响应，可能是网络问题');
        } else {
          // 发送请求时发生错误
          console.error('DeepSeek API请求配置错误');
        }

        return Promise.reject(error);
      }
    );

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
  async generateText({ prompt, temperature = 0.7, max_tokens = 800, timeout = 30000 }) {
    // 如果没有API密钥，直接返回错误信息
    if (!this.apiKey) {
      console.warn('DeepSeek API密钥未设置，使用备用分析方案');
      return Promise.reject(new Error('API密钥未设置，无法调用DeepSeek API'));
    }
    
    try {
      console.log('准备调用DeepSeek API...');
      
      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        max_tokens: max_tokens,
        stream: false
      }, {
        timeout: timeout  // 动态设置超时时间
      });
      
      console.log('DeepSeek API调用成功');
      
      // 直接返回内容文本，简化处理
      const responseText = response.data.choices[0].message.content;
      
      console.log('DeepSeek API响应长度:', responseText.length);
      
      return responseText;
    } catch (error) {
      console.error('DeepSeek API调用失败:', error.message);
      
      // 更详细的错误处理
      if (error.code === 'ECONNABORTED') {
        console.error('DeepSeek API请求超时');
        throw new Error('DeepSeek API请求超时，请稍后再试');
      }
      
      // 返回API错误详情
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error('DeepSeek API详细错误:', errorMsg);
      
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

module.exports = {
  DeepSeekClient,
  DifyClient
}; 