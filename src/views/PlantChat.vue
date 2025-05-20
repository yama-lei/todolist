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
                  <el-avatar :size="40" :src="userAvatar" />
                </span>
                <span v-else class="plant-message-avatar">
                  {{ getPlantEmoji() }}
                </span>
              </div>
              <div class="message-bubble">
                <div class="message-content">
                  <!-- 用户消息直接显示 -->
                  <template v-if="message.sender === 'user'">
                    {{ message.content }}
                  </template>
                  
                  <!-- 植物消息分段显示或使用打字机效果 -->
                  <template v-else>
                    <!-- 判断是否是当前正在打字的消息 -->
                    <template v-if="currentTypingMessageId === message.id">
                      <!-- 已显示的段落 -->
                      <div v-for="(segment, index) in displayedSegments" :key="index" class="message-segment">
                        {{ segment }}
                      </div>
                      <!-- 当前正在打字的段落 -->
                      <div class="typing-segment">{{ currentTypingText }}</div>
                      <!-- 后续段落指示器 -->
                      <div v-if="remainingSegmentsCount > 0" class="more-segments-indicator">
                        <div class="dot-flashing"></div>
                      </div>
                    </template>
                    <!-- 已完成打字的消息 -->
                    <template v-else>
                      <div v-for="(segment, index) in splitMessageIntoSegments(message.content)" 
                           :key="index" 
                           class="message-segment">
                        {{ segment }}
                      </div>
                    </template>
                  </template>
                </div>
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
              <el-icon><Position /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { usePlantStore } from '../stores/plant'
import { useAuthStore } from '../stores/auth'
import { format } from 'date-fns'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Position } from '@element-plus/icons-vue'

const plantStore = usePlantStore()
const authStore = useAuthStore()
const messagesList = ref(null)
const messageInput = ref('')
const loading = ref(false)
const showSuggestions = ref(true)

// 打字机效果相关状态
const currentTypingMessageId = ref(null)
const currentTypingText = ref('')
const displayedSegments = ref([])
const remainingSegmentsCount = ref(0)
const typeInterval = ref(null)
const segmentDisplayInterval = ref(null)
const allMessageSegments = ref([])
const currentSegmentIndex = ref(0)
const typingSpeed = 50 // 打字速度(毫秒/字符)
const segmentDelay = 1000 // 段落之间的延迟(毫秒)

// 用户头像
const userAvatar = computed(() => {
  return authStore.userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
})

// 建议问题
const suggestions = [
  '提醒我下周二前交微积分作业',
  '我最近心情不好，你能陪我聊聊吗？',
  '今天天气真好，我想出去走走',
  '帮我记录一下今天的任务完成情况'
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
      // 停止任何正在进行的打字效果
      stopTypingEffect();
      
      // 调用清空对话的API
      await plantStore.clearConversations(plantId);
      
      // 设置为默认欢迎消息
      plantStore.conversations = [defaultWelcomeMessage];
      ElMessage.success('对话已清空，将开始新的对话');
    } catch (error) {
      console.error('清空对话失败:', error);
      ElMessage.error('清空对话失败');
    }
  }).catch(() => {
    // 用户取消操作
  });
}

// 将消息拆分为段落
const splitMessageIntoSegments = (message) => {
  if (!message) return [];
  // 按双换行或单换行分割
  return message.split(/\n\n|\n/).filter(segment => segment.trim() !== '');
}

// 开始打字效果
const startTypingEffect = (message) => {
  // 停止任何正在进行的打字效果
  stopTypingEffect();
  
  // 设置当前正在打字的消息ID
  currentTypingMessageId.value = message.id;
  
  // 将消息拆分为段落
  allMessageSegments.value = splitMessageIntoSegments(message.content);
  
  // 重置状态
  displayedSegments.value = [];
  currentSegmentIndex.value = 0;
  currentTypingText.value = '';
  remainingSegmentsCount.value = allMessageSegments.value.length;
  
  // 开始展示第一段
  displayNextSegment();
}

// 显示下一段落
const displayNextSegment = () => {
  if (currentSegmentIndex.value >= allMessageSegments.value.length) {
    // 所有段落都已显示完成
    finishTypingMessage();
    return;
  }
  
  const currentSegment = allMessageSegments.value[currentSegmentIndex.value];
  let charIndex = 0;
  
  // 清除之前的打字效果定时器
  if (typeInterval.value) clearInterval(typeInterval.value);
  
  // 逐字显示当前段落
  typeInterval.value = setInterval(() => {
    if (charIndex <= currentSegment.length) {
      currentTypingText.value = currentSegment.substring(0, charIndex);
      charIndex++;
      scrollToBottom();
    } else {
      // 当前段落打字完成
      clearInterval(typeInterval.value);
      
      // 将完成的段落添加到已显示段落数组
      displayedSegments.value.push(currentSegment);
      currentTypingText.value = '';
      
      // 更新剩余段落数
      remainingSegmentsCount.value--;
      
      // 移动到下一段
      currentSegmentIndex.value++;
      
      // 延迟一会儿再显示下一段
      if (currentSegmentIndex.value < allMessageSegments.value.length) {
        segmentDisplayInterval.value = setTimeout(displayNextSegment, segmentDelay);
      } else {
        // 所有段落都已显示完成
        finishTypingMessage();
      }
    }
  }, typingSpeed);
}

// 完成消息的打字效果
const finishTypingMessage = () => {
  // 清除定时器
  if (typeInterval.value) {
    clearInterval(typeInterval.value);
    typeInterval.value = null;
  }
  
  if (segmentDisplayInterval.value) {
    clearTimeout(segmentDisplayInterval.value);
    segmentDisplayInterval.value = null;
  }
  
  // 重置状态
  currentTypingMessageId.value = null;
}

// 停止任何正在进行的打字效果
const stopTypingEffect = () => {
  if (typeInterval.value) {
    clearInterval(typeInterval.value);
    typeInterval.value = null;
  }
  
  if (segmentDisplayInterval.value) {
    clearTimeout(segmentDisplayInterval.value);
    segmentDisplayInterval.value = null;
  }
  
  currentTypingMessageId.value = null;
}

// 发送消息
const sendMessage = async () => {
  if (!messageInput.value.trim() || loading.value) return
  
  if (!plantStore.currentPlant) {
    ElMessage.warning('请先在花园中选择一个植物')
    return
  }
  
  // 检查用户是否已登录
  if (!localStorage.getItem('token')) {
    ElMessage.warning('请先登录再与植物对话')
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
    const response = await plantStore.sendMessage(plantId, message, true)
    
    if (!response) {
      throw new Error('发送消息失败')
    }
    
    // 再次滚动到底部
    await scrollToBottom()
    
    // 启动打字机效果
    await nextTick()
    startTypingEffect(response)
    
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请稍后再试')
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
    // 停止任何正在进行的打字效果
    stopTypingEffect();
    
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
      ElMessage.info('获取对话历史失败，请稍后再试')
    } finally {
      loading.value = false;
    }
  }
}, { immediate: true });

// 确保在组件挂载时获取用户信息
onMounted(async () => {
  // 获取用户信息
  if (!authStore.user) {
    await authStore.fetchUserInfo()
  }
  
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
      ElMessage.info('获取对话历史失败，请稍后再试')
    } finally {
      loading.value = false
      await scrollToBottom()
    }
  }
  
  // 组件销毁时清除所有定时器
  return () => {
    stopTypingEffect();
  }
})
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
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.plant-chat-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  margin-bottom: 16px;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.plant-avatar {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(139, 195, 74, 0.2) 100%);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
  border: 2px solid rgba(76, 175, 80, 0.3);
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
  font-weight: 600;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  color: #4CAF50;
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
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.clear-chat {
  color: #909399;
  font-size: 0.85rem;
}

.clear-chat .el-button {
  font-size: 0.85rem;
  padding: 4px 8px;
  opacity: 0.8;
  transition: all 0.3s;
}

.clear-chat .el-button:hover {
  opacity: 1;
  color: #f56c6c;
}

.message-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(76, 175, 80, 0.3) transparent;
}

.messages-list::-webkit-scrollbar {
  width: 6px;
}

.messages-list::-webkit-scrollbar-track {
  background: transparent;
}

.messages-list::-webkit-scrollbar-thumb {
  background-color: rgba(76, 175, 80, 0.3);
  border-radius: 6px;
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
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  transition: all 0.3s;
}

.empty-img:hover {
  transform: scale(1.05);
  opacity: 0.9;
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
  margin: 0 12px;
}

.user-avatar {
  display: flex;
  border: 2px solid rgba(64, 158, 255, 0.3);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.plant-message-avatar {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(139, 195, 74, 0.2) 100%);
  border-radius: 50%;
  font-size: 24px;
  border: 2px solid rgba(76, 175, 80, 0.3);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.plant-message-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.message-bubble:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%);
  color: white;
  border-top-right-radius: 4px;
}

.plant-message .message-bubble {
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  color: #333;
  border-top-left-radius: 4px;
  border: 1px solid rgba(76, 175, 80, 0.1);
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background-color: #4CAF50;
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
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 0 0 16px 16px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12px;
  gap: 8px;
}

.suggestion-chip {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.suggestion-chip:hover {
  background-color: rgba(76, 175, 80, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
}

.input-wrapper :deep(.el-textarea__inner) {
  border-radius: 20px;
  padding: 12px 18px;
  min-height: 44px !important;
  resize: none;
  border: 1px solid rgba(76, 175, 80, 0.3);
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  font-size: 1rem;
}

.input-wrapper :deep(.el-textarea__inner:focus) {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.send-btn {
  border-radius: 50%;
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  border: none;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px) rotate(5deg);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
  background: linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%);
}

/* 添加新样式 */
.message-segment {
  margin-bottom: 8px;
}

.message-segment:last-child {
  margin-bottom: 0;
}

.typing-segment {
  min-height: 1.5em;
  display: inline-block;
  position: relative;
}

.more-segments-indicator {
  text-align: center;
  padding: 5px 0;
  height: 20px;
}

.dot-flashing {
  position: relative;
  width: 10px;
  height: 10px;
  margin: 0 auto;
  border-radius: 5px;
  background-color: #4CAF50;
  color: #4CAF50;
  animation: dot-flashing 1s infinite linear alternate;
  animation-delay: 0.5s;
}

.dot-flashing::before, .dot-flashing::after {
  content: '';
  display: inline-block;
  position: absolute;
  top: 0;
}

.dot-flashing::before {
  left: -15px;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: #4CAF50;
  color: #4CAF50;
  animation: dot-flashing 1s infinite alternate;
  animation-delay: 0s;
}

.dot-flashing::after {
  left: 15px;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: #4CAF50;
  color: #4CAF50;
  animation: dot-flashing 1s infinite alternate;
  animation-delay: 1s;
}

@keyframes dot-flashing {
  0% {
    background-color: #4CAF50;
  }
  50%, 100% {
    background-color: rgba(76, 175, 80, 0.2);
  }
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
  
  .suggestion-chip {
    font-size: 0.8rem;
    padding: 6px 10px;
  }
}
</style>