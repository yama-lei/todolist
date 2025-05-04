const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// DeepSeek API客户端类
class DeepSeekClient {
  constructor() {
    this.apiKey = 'sk-3145ff1b87464f1a82fc515f3195ad77';
    this.baseURL = 'https://api.deepseek.com/v1';
    
    if (!this.apiKey) {
      console.warn('警告: DEEPSEEK_API_KEY 未在环境变量中设置');
    }
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
  async generateText(options) {
    try {
      const { prompt, model = 'deepseek-chat', temperature = 0.7, max_tokens = 1000 } = options;
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: model,
          messages: [
            { role: 'system', content: '你是一个友好的植物助手，拥有植物视角和知识。' },
            { role: 'user', content: prompt }
          ],
          temperature: temperature,
          max_tokens: max_tokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API调用失败:', error.response?.data || error.message);
      throw new Error('无法生成文本：' + (error.response?.data?.error?.message || error.message));
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
      const { name, type, mood, level, state, traits = [] } = plant;
      const { weather, timeOfDay, recentTasks = [] } = context;
      
      let completedTasksDescription = '最近没有完成任何任务';
      if (recentTasks && recentTasks.length > 0) {
        completedTasksDescription = `最近完成了${recentTasks.length}个任务: ${recentTasks.map(t => t.title).join('、')}`;
      }
      
      const prompt = `
你是一个名为"${name}"的${type}植物，拥有${traits.join('、')}的特性。
你现在处于${state}阶段，等级为${level}级，心情是${mood}。
现在是${timeOfDay === 'morning' ? '早晨' : timeOfDay === 'afternoon' ? '下午' : '晚上'}，天气是${weather === 'sunny' ? '晴朗' : weather === 'cloudy' ? '多云' : weather === 'rainy' ? '下雨' : '未知'}。
主人${completedTasksDescription}。

请以植物的视角，根据以上情境写一段简短的"植物心声"，表达你对主人的情感、对生活的感受或给主人的建议。字数控制在100字以内。
`;
      
      return await this.generateText({ prompt });
    } catch (error) {
      console.error('生成植物心声失败:', error);
      // 生成失败时返回默认文本
      return '我感觉很好！希望你今天也有美好的一天！';
    }
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
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.8,
          max_tokens: 200,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('生成植物回复失败:', error);
      // 生成失败时返回默认回复
      return `我是${plant.name}，很高兴和你聊天！你刚才说的我都明白了！`;
    }
  }
}

module.exports = new DeepSeekClient(); 