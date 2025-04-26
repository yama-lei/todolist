<template>
  <div class="plant-chat-page">
    <div class="container">
      <div class="chat-card card">
        <div class="chat-header">
          <div class="chat-plant-info">
            <div class="plant-avatar">
              <span class="plant-emoji">{{ plantEmoji }}</span>
            </div>
            <div class="plant-details">
              <h2>{{ plantStore.plant.name }}</h2>
              <span class="plant-status">{{ getPlantStateText() }}</span>
            </div>
          </div>
          <div class="chat-actions">
            <el-tooltip content="清空聊天记录" placement="top">
              <el-button @click="clearMessages" circle>
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        
        <div class="chat-messages" ref="messagesRef">
          <div v-if="messages.length === 0" class="empty-chat">
            <div class="empty-icon">🌱</div>
            <p class="empty-text">和你的植物聊聊天吧！</p>
            <div class="suggested-prompts">
              <p>推荐问题：</p>
              <div class="prompt-list">
                <div 
                  v-for="(prompt, index) in suggestedPrompts" 
                  :key="index" 
                  class="prompt-item"
                  @click="sendMessage(prompt)"
                >
                  {{ prompt }}
                </div>
              </div>
            </div>
          </div>
          
          <template v-else>
            <div 
              v-for="(msg, index) in messages" 
              :key="index" 
              class="message"
              :class="{ 'user-message': msg.sender === 'user', 'plant-message': msg.sender === 'plant' }"
            >
              <div class="message-avatar">
                <span v-if="msg.sender === 'user'">👤</span>
                <span v-else>{{ plantEmoji }}</span>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(msg.content)"></div>
                <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
              </div>
            </div>
          </template>
          
          <div v-if="isLoading" class="loading-message">
            <div class="plant-thinking">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>
        </div>
        
        <div class="chat-input">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="2"
            placeholder="输入你想问的问题..."
            resize="none"
            @keydown.enter.prevent="handleEnterKeyPressed"
          ></el-input>
          <el-button 
            type="primary" 
            :icon="Promotion"
            :loading="isLoading"
            :disabled="isLoading || !userInput.trim()"
            @click="sendMessage()"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch, nextTick, computed } from 'vue'
import { usePlantStore } from '../stores/plant'
import { format } from 'date-fns'
import { Delete, Promotion } from '@element-plus/icons-vue'

export default {
  name: 'PlantChatPage',
  components: {
    Delete,
    Promotion
  },
  setup() {
    const plantStore = usePlantStore()
    const messagesRef = ref(null)
    const userInput = ref('')
    const isLoading = ref(false)
    const messages = reactive([])
    
    // 植物表情
    const plantEmoji = computed(() => {
      const state = plantStore.plant.state
      if (state === 'growing') return '🌱'
      if (state === 'flowering') return '🌸'
      if (state === 'fruiting') return '🍎'
      return '🌱'
    })
    
    // 推荐问题
    const suggestedPrompts = [
      "你能告诉我今天的天气怎么样吗？",
      "我应该怎样照顾植物让它长得更快？",
      "你能给我讲个有趣的故事吗？",
      "你喜欢什么类型的音乐？",
      "你能给我一些今天的建议吗？"
    ]
    
    // 获取植物状态文本
    const getPlantStateText = () => {
      const state = plantStore.plant.state
      if (state === 'growing') return '成长中'
      if (state === 'flowering') return '开花中'
      if (state === 'fruiting') return '结果中'
      return '成长中'
    }
    
    // 添加欢迎消息
    const addWelcomeMessage = () => {
      if (messages.length === 0) {
        const plantName = plantStore.plant.name
        messages.push({
          sender: 'plant',
          content: `你好！我是${plantName}，很高兴能和你聊天！有什么我能帮助你的吗？`,
          timestamp: new Date()
        })
      }
    }
    
    // 发送消息
    const sendMessage = async (predefinedMessage = null) => {
      const messageText = predefinedMessage || userInput.value.trim()
      
      if (!messageText) return
      
      // 添加用户消息
      messages.push({
        sender: 'user',
        content: messageText,
        timestamp: new Date()
      })
      
      // 清空输入框
      userInput.value = ''
      
      // 滚动到底部
      await scrollToBottom()
      
      // 模拟植物思考
      isLoading.value = true
      setTimeout(() => {
        generatePlantResponse(messageText)
      }, 1000 + Math.random() * 1000)
    }
    
    // 生成植物回复
    const generatePlantResponse = (userMessage) => {
      // 这里将来会集成真正的API调用
      // 目前使用模拟回复
      
      let plantResponse = ''
      
      // 简单模拟一些回复逻辑
      if (userMessage.includes('天气')) {
        const weathers = ['晴朗', '多云', '小雨', '大风']
        const weather = weathers[Math.floor(Math.random() * weathers.length)]
        plantResponse = `今天的天气是${weather}。${weather === '晴朗' ? '阳光非常充足，非常适合我进行光合作用！' : weather === '多云' ? '光照不是很强，但对我来说已经足够了。' : weather === '小雨' ? '雨水给了我充足的水分，感觉很舒服！' : '大风天气我有点担心，希望不会受伤。'}`
      } 
      else if (userMessage.includes('照顾') || userMessage.includes('养殖')) {
        plantResponse = '照顾植物需要适当的阳光、水分和肥料。每种植物的需求不同，但最重要的是有规律地照顾它们，并给予它们关注和爱。你对我的照顾已经很好了！'
      }
      else if (userMessage.includes('故事')) {
        plantResponse = '从前，有一颗小种子被风吹到了一片肥沃的土地上。它深深扎根于大地，吸收养分，感受阳光的温暖和雨水的滋润。经过时间的洗礼，它长成了一棵挺拔的树，为许多小动物提供了家园。这个故事告诉我们，只要坚持不懈，再小的种子也能成长为参天大树。'
      }
      else if (userMessage.includes('音乐')) {
        plantResponse = '我喜欢轻柔的音乐，尤其是那些有自然声音的曲子，比如雨声、鸟鸣或流水声。有研究表明，植物对音乐有反应，某些类型的音乐甚至可以促进植物生长哦！'
      }
      else if (userMessage.includes('建议')) {
        const suggestions = [
          '今天是个适合完成任务的好日子，不如先处理一些待办事项？',
          '有时候适当休息也很重要，不妨出去走走，呼吸新鲜空气。',
          '多喝水对身体有益，就像我需要水分一样，人类也需要保持水分充足。',
          '不如今天学习一些新知识，拓展你的视野？',
          '记得照顾好自己，健康是最重要的财富。'
        ]
        plantResponse = suggestions[Math.floor(Math.random() * suggestions.length)]
      }
      else {
        const genericResponses = [
          '这个问题很有趣！作为一株植物，我的理解可能有限，但我很乐意分享我的看法。',
          '谢谢你和我分享这个想法！我很享受和你的交流。',
          '我还在学习和成长中，就像你照顾我一样，我也希望能给你带来一些启发和快乐。',
          '这让我想起了一件事：大自然中的一切都是相互联系的，就像你和我的关系一样。',
          '我感觉你今天心情不错！希望我能为你的日子增添一些绿色的活力。'
        ]
        plantResponse = genericResponses[Math.floor(Math.random() * genericResponses.length)]
      }
      
      // 添加植物回复
      messages.push({
        sender: 'plant',
        content: plantResponse,
        timestamp: new Date()
      })
      
      // 更新植物状态
      plantStore.setMood('happy')
      
      // 完成加载
      isLoading.value = false
      
      // 滚动到底部
      scrollToBottom()
    }
    
    // 清空消息
    const clearMessages = () => {
      if (messages.length > 0) {
        // 确认对话框
        ElMessageBox.confirm(
          '确定要清空所有聊天记录吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
          .then(() => {
            messages.splice(0, messages.length)
            addWelcomeMessage()
            ElMessage({
              type: 'success',
              message: '聊天记录已清空',
            })
          })
          .catch(() => {
            // 用户取消操作
          })
      }
    }
    
    // 滚动到底部
    const scrollToBottom = async () => {
      await nextTick()
      if (messagesRef.value) {
        messagesRef.value.scrollTop = messagesRef.value.scrollHeight
      }
    }
    
    // 格式化消息文本（支持换行）
    const formatMessage = (text) => {
      return text.replace(/\n/g, '<br>')
    }
    
    // 格式化时间
    const formatTime = (timestamp) => {
      return format(new Date(timestamp), 'HH:mm')
    }
    
    // 处理回车键
    const handleEnterKeyPressed = (e) => {
      // Ctrl+Enter 或 Shift+Enter 插入换行
      if (e.ctrlKey || e.shiftKey) {
        userInput.value += '\n'
        return
      }
      
      // 普通回车发送消息
      sendMessage()
    }
    
    // 监听消息变化，自动滚动
    watch(() => messages.length, scrollToBottom)
    
    // 组件挂载时添加欢迎消息
    onMounted(() => {
      addWelcomeMessage()
    })
    
    return {
      plantStore,
      messagesRef,
      userInput,
      isLoading,
      messages,
      plantEmoji,
      suggestedPrompts,
      sendMessage,
      clearMessages,
      formatMessage,
      formatTime,
      getPlantStateText,
      handleEnterKeyPressed
    }
  }
}
</script>

<style scoped>
.plant-chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.chat-card {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 500px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.chat-plant-info {
  display: flex;
  align-items: center;
}

.plant-avatar {
  width: 50px;
  height: 50px;
  background-color: rgba(66, 185, 131, 0.1);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
}

.plant-emoji {
  font-size: 30px;
}

.plant-details h2 {
  margin: 0;
  font-size: 18px;
}

.plant-status {
  font-size: 14px;
  color: #666;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  text-align: center;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.empty-text {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
}

.suggested-prompts {
  max-width: 500px;
}

.suggested-prompts p {
  margin-bottom: 10px;
  font-weight: bold;
  color: #888;
}

.prompt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.prompt-item {
  background-color: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.prompt-item:hover {
  background-color: rgba(var(--el-color-primary-rgb), 0.2);
  transform: translateY(-2px);
}

.message {
  display: flex;
  margin-bottom: 20px;
  max-width: 85%;
}

.user-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.plant-message {
  margin-right: auto;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin: 0 10px;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background-color: rgba(64, 158, 255, 0.1);
}

.plant-message .message-avatar {
  background-color: rgba(66, 185, 131, 0.1);
}

.message-content {
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.user-message .message-content {
  background-color: var(--el-color-primary);
  color: white;
  border-top-right-radius: 4px;
}

.plant-message .message-content {
  background-color: #f5f7fa;
  color: #333;
  border-top-left-radius: 4px;
}

.message-text {
  line-height: 1.5;
  word-break: break-word;
}

.message-time {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.8;
  text-align: right;
}

.loading-message {
  align-self: flex-start;
  margin-left: 60px;
  margin-bottom: 20px;
}

.plant-thinking {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #ddd;
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}

.chat-input {
  padding: 15px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 10px;
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 20px;
  padding: 10px 15px;
  resize: none;
}

.chat-input .el-button {
  border-radius: 20px;
  padding: 0 20px;
  align-self: flex-end;
}
</style> 