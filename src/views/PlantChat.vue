<template>
  <div class="plant-chat-page">
    <div class="container">
      <div class="plant-chat-header card">
            <div class="plant-avatar">
          <span class="plant-emoji">{{ getPlantEmoji() }}</span>
            </div>
        <div class="plant-info">
          <h2>与{{ plantStore.currentPlant ? plantStore.currentPlant.name : '植物' }}对话</h2>
          <p class="plant-status">
            <span class="status-label">状态:</span> 
            <span class="status-value">{{ getPlantStatus() }}</span>
            <span class="mood-emoji">{{ getMoodEmoji() }}</span>
          </p>
        </div>
        <div class="plant-level">
          <div class="level-badge">Lv.{{ plantStore.currentPlant?.level || 1 }}</div>
        </div>
        <div class="clear-chat">
          <el-button type="text" @click="clearConversation" :disabled="!conversations || conversations.length <= 1">
            <el-icon><Delete /></el-icon>
            清空对话
          </el-button>
        </div>
      </div>
      
      <div class="message-container card">
        <div class="messages-list" ref="messagesList">
          <div v-if="!conversations || conversations.length === 0" class="empty-conversation">
            <el-empty description="暂无对话，发送消息开始与植物聊天吧~">
              <template #image>
                <img src="/images/plant_chat_empty.png" alt="空对话" class="empty-img" />
              </template>
            </el-empty>
          </div>
          
          <template v-else>
            <div 
              v-for="message in conversations" 
              :key="message.id"
              :class="['message', message.sender === 'user' ? 'user-message' : 'plant-message']"
            >
              <div class="message-avatar">
                <span v-if="message.sender === 'user'" class="user-avatar">
                  <el-avatar :size="40" icon="UserFilled" />
                </span>
                <span v-else class="plant-message-avatar">
                  {{ getPlantEmoji() }}
                </span>
              </div>
              <div class="message-bubble">
                <div class="message-content" v-html="formatMessageContent(message.content)"></div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </template>
          
          <div v-if="loading" class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        <div class="input-container">
          <div class="suggestion-chips" v-if="showSuggestions">
            <div 
              v-for="(suggestion, index) in suggestions" 
              :key="index"
              class="suggestion-chip"
              @click="sendSuggestion(suggestion)"
            >
              {{ suggestion }}
            </div>
          </div>
          
          <div class="input-wrapper">
          <el-input
              v-model="messageInput"
            type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="输入消息与植物聊天..."
              @keyup.enter.native="handleEnterPress"
            />
          <el-button 
            type="primary" 
              class="send-btn" 
              :disabled="!messageInput.trim() || loading"
              @click="sendMessage"
            >
              <el-icon><el-icon-position /></el-icon>
          </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { usePlantStore } from '../stores/plant'
import { format } from 'date-fns'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { marked } from 'marked'

export default {
  name: 'PlantChatPage',
  setup() {
    const plantStore = usePlantStore()
    const messagesList = ref(null)
    const messageInput = ref('')
    const loading = ref(false)
    const showSuggestions = ref(true)
    
    // 建议问题
    const suggestions = [
      '你今天感觉怎么样？',
      '有什么生长小秘诀吗？',
      '你喜欢什么样的环境？',
      '如何让你更快成长？'
    ]
    
    // 默认欢迎语
    const defaultWelcomeMessage = {
      id: 'welcome',
      sender: 'plant',
      content: '你好！我是你的植物伙伴，很高兴能和你聊天。你可以问我任何问题，或者分享你的想法。',
      timestamp: new Date()
    }
    
    // 计算属性：获取对话信息
    const conversations = computed(() => {
      if (!plantStore.conversations || plantStore.conversations.length === 0) {
        return [defaultWelcomeMessage]
      }
      return plantStore.conversations
    })
    
    // 获取植物表情
    const getPlantEmoji = () => {
      if (!plantStore.currentPlant) return '🌱'
      return plantStore.currentPlant.emoji || '🌱'
    }
    
    // 获取植物状态
    const getPlantStatus = () => {
      if (!plantStore.currentPlant) return '未种植'
      
      const stateMap = {
        'seedling': '幼苗期',
        'growing': '成长期',
        'mature': '成熟期'
      }
      
      return stateMap[plantStore.currentPlant.state] || '成长中'
    }
    
    // 获取心情表情
    const getMoodEmoji = () => {
      if (!plantStore.currentPlant) return '😐'
      
      const moodMap = {
        'happy': '😊',
        'neutral': '😐',
        'sad': '😢'
      }
      
      return moodMap[plantStore.currentPlant.mood] || '😐'
    }
    
    // 格式化时间
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      return format(new Date(timestamp), 'HH:mm')
    }
    
    // 处理Enter按键
    const handleEnterPress = (e) => {
      // 如果按下了Shift键，不发送消息，允许多行输入
      if (!e.shiftKey && messageInput.value.trim()) {
        e.preventDefault()
        sendMessage()
      }
    }
    
    // 清空对话
    const clearConversation = () => {
      ElMessageBox.confirm('确定要清空所有对话记录吗？此操作不可恢复。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        if (!plantStore.currentPlant) return;
        
        const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id;
        try {
          // 调用清空对话的API
          await plantStore.clearConversations(plantId);
          
          // 设置为默认欢迎消息
          plantStore.conversations = [defaultWelcomeMessage];
          ElMessage.success('对话已清空');
        } catch (error) {
          console.error('清空对话失败:', error);
          ElMessage.error('清空对话失败');
        }
      }).catch(() => {
        // 用户取消操作
      });
    }
    
    // 发送消息
    const sendMessage = async () => {
      if (!messageInput.value.trim() || loading.value) return
      
      if (!plantStore.currentPlant) {
        ElMessage.warning('请先在花园中选择一个植物')
        return
      }
      
      // 检查植物ID是否有效
      if (!plantStore.currentPlant._id && !plantStore.currentPlant.id) {
        console.error('植物ID无效')
        ElMessage.warning('植物信息不完整，请重新选择植物')
        return
      }
      
      const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
      const message = messageInput.value
      
      // 创建用户消息对象
      const userMessage = {
        id: Date.now().toString(),
        sender: 'user',
        content: message,
        timestamp: new Date()
      }
      
      // 立即添加用户消息到对话列表
      if (!plantStore.conversations) {
        plantStore.conversations = []
      }
      plantStore.conversations.push(userMessage)
      
      // 清空输入框
      messageInput.value = ''
      
      // 设置加载状态
      loading.value = true
      showSuggestions.value = false
      
      try {
        // 滚动到底部
        await scrollToBottom()
        
        // 调用API发送消息，设置skipUserMessage为true，因为已经添加过用户消息了
        await plantStore.sendMessage(plantId, message, true)
        
        // 再次滚动到底部（显示植物回复）
        await scrollToBottom()
      } catch (error) {
        console.error('发送消息失败:', error)
        ElMessage.error('发送消息失败')
      } finally {
        loading.value = false
      }
    }
    
    // 发送建议问题
    const sendSuggestion = (suggestion) => {
      messageInput.value = suggestion
      sendMessage()
    }
    
    // 滚动到底部
    const scrollToBottom = async () => {
      await nextTick()
      if (messagesList.value) {
        messagesList.value.scrollTop = messagesList.value.scrollHeight
      }
    }
    
    // 监听对话列表变化，自动滚动到底部
    watch(() => plantStore.conversations.length, async () => {
      await scrollToBottom()
    })
    
    // 监听主植物变化
    watch(() => plantStore.mainPlant, async (newMainPlant) => {
      if (newMainPlant) {
        // 更新当前植物
        plantStore.currentPlant = newMainPlant;
        
        // 重新加载对话历史
        try {
          const plantId = newMainPlant._id || newMainPlant.id;
          if (plantId) {
            loading.value = true;
            await plantStore.fetchConversations(plantId);
            await scrollToBottom();
          }
        } catch (error) {
          console.error('获取对话历史失败:', error);
          ElMessage.error('获取对话历史失败');
        } finally {
          loading.value = false;
        }
      }
    }, { immediate: true });
    
    onMounted(async () => {
      // 确保有植物数据
      if (!plantStore.currentPlant) {
        await plantStore.fetchPlants()
      }
      
      // 如果有植物，加载对话历史
      if (plantStore.currentPlant) {
        // 检查植物ID是否有效
        if (!plantStore.currentPlant._id && !plantStore.currentPlant.id) {
          console.error('植物ID无效')
          ElMessage.warning('植物信息不完整，请重新选择植物')
          return
        }
        
        const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
        loading.value = true
        
        try {
          await plantStore.fetchConversations(plantId)
          // 如果没有对话历史，添加默认欢迎语
          if (!plantStore.conversations || plantStore.conversations.length === 0) {
            plantStore.conversations = [defaultWelcomeMessage]
          }
        } catch (error) {
          console.error('获取对话历史失败:', error)
        } finally {
          loading.value = false
          await scrollToBottom()
        }
      }
    })
    
    // 格式化消息内容，支持Markdown
    const formatMessageContent = (content) => {
      try {
        return marked(content)
      } catch (error) {
        console.error('Markdown解析失败:', error)
        return content
      }
    }
    
    return {
      plantStore,
      messagesList,
      messageInput,
      loading,
      conversations,
      showSuggestions,
      suggestions,
      getPlantEmoji,
      getPlantStatus,
      getMoodEmoji,
      formatTime,
      handleEnterPress,
      sendMessage,
      sendSuggestion,
      clearConversation,
      formatMessageContent
    }
  }
}
</script>

<style scoped>
.plant-chat-page {
  min-height: 100vh;
  padding: 20px 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);
}

.card {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.plant-chat-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  margin-bottom: 16px;
  position: relative;
}

.plant-avatar {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(100, 210, 255, 0.2) 100%);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.15);
}

.plant-emoji {
  font-size: 40px;
}

.plant-info {
  flex: 1;
}

.plant-info h2 {
  margin: 0 0 8px;
  font-size: 1.5rem;
  color: #333;
}

.plant-status {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.status-label {
  margin-right: 5px;
  color: #888;
}

.status-value {
  color: #409EFF;
  font-weight: 500;
}

.mood-emoji {
  margin-left: 8px;
  font-size: 1.2rem;
}

.plant-level {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.level-badge {
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.clear-chat {
  color: #909399;
  font-size: 0.85rem;
}

.clear-chat .el-button {
  font-size: 0.85rem;
  padding: 4px 8px;
}

.message-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

.empty-conversation {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-img {
  width: 150px;
  opacity: 0.7;
}

.message {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 10px;
}

.plant-message-avatar {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(100, 210, 255, 0.2) 100%);
  border-radius: 50%;
  font-size: 24px;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  color: white;
  border-top-right-radius: 4px;
}

.plant-message .message-bubble {
  background-color: #f0f2f5;
  color: #333;
  border-top-left-radius: 4px;
}

.message-content {
  font-size: 1rem;
  line-height: 1.5;
  word-break: break-word;
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  background-color: #f0f2f5;
  padding: 8px 16px;
  border-radius: 18px;
  margin: 10px 0;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background-color: #a3a3a3;
  display: inline-block;
  margin: 0 2px;
  animation: bounce 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.input-container {
  padding: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
  gap: 8px;
}

.suggestion-chip {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409EFF;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background-color: rgba(64, 158, 255, 0.2);
  transform: translateY(-1px);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
}

.input-wrapper :deep(.el-textarea__inner) {
  border-radius: 20px;
  padding: 10px 15px;
  min-height: 44px !important;
  resize: none;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
}

.input-wrapper :deep(.el-textarea__inner:focus) {
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.send-btn {
  border-radius: 50%;
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  border: none;
  transition: all 0.3s;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.4);
}

@media (max-width: 768px) {
  .container {
    padding: 0 10px;
    height: calc(100vh - 20px);
  }
  
  .plant-chat-header {
    padding: 12px 16px;
  }
  
  .plant-avatar {
    width: 50px;
    height: 50px;
  }
  
  .plant-emoji {
    font-size: 30px;
  }
  
  .plant-info h2 {
    font-size: 1.2rem;
  }
  
  .message-bubble {
    max-width: 85%;
  }
  
  .clear-chat {
    position: absolute;
    top: 10px;
    right: 10px;
  }
}

/* 添加Markdown样式 */
:deep(.message-content) {
  line-height: 1.6;
}

:deep(.message-content p) {
  margin: 0;
}

:deep(.message-content a) {
  color: #409EFF;
  text-decoration: none;
}

:deep(.message-content a:hover) {
  text-decoration: underline;
}

:deep(.message-content code) {
  background-color: #f6f6f6;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

:deep(.message-content pre) {
  background-color: #f6f6f6;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

:deep(.message-content blockquote) {
  margin: 8px 0;
  padding-left: 12px;
  border-left: 4px solid #ddd;
  color: #666;
}

:deep(.message-content ul), :deep(.message-content ol) {
  margin: 8px 0;
  padding-left: 20px;
}
</style>