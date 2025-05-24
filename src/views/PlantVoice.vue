<template>
  <div class="plant-voice-page">
    <div class="container">
      <div class="plant-voice-header card">
        <div class="plant-icon">
          <span class="plant-emoji">{{ getPlantEmoji() }}</span>
        </div>
        <div class="plant-info">
          <h2>{{ plantStore.currentPlant ? plantStore.currentPlant.name : '尚未添加植物' }}的心声</h2>
          <p class="plant-description">
            从植物的视角看待你的生活，倾听它对你的想法和建议。
          </p>
        </div>
      </div>
      
      <div class="action-bar card">
        <button type="button" @click="generateThought" class="custom-btn generate-btn" :class="{ 'loading': loading }">
          <span class="btn-icon"><ChatLineRound /></span>
          <span class="btn-text">生成新的植物心声</span>
        </button>
        <el-select v-model="plantMood" placeholder="选择植物心情" @change="updateMood" class="mood-select">
          <el-option label="开心" value="happy">
            <div class="mood-option">
              <span class="mood-emoji">😊</span> 开心
            </div>
          </el-option>
          <el-option label="一般" value="neutral">
            <div class="mood-option">
              <span class="mood-emoji">😐</span> 一般
            </div>
          </el-option>
          <el-option label="难过" value="sad">
            <div class="mood-option">
              <span class="mood-emoji">😢</span> 难过
            </div>
          </el-option>
        </el-select>
      </div>
      
      <div class="thoughts-list">
        <div v-if="!plantStore.thoughts || plantStore.thoughts.length === 0" class="empty-thoughts card">
          <el-empty description="还没有植物心声，点击上方按钮生成吧！">
            <button type="button" @click="generateThought" class="custom-btn generate-btn empty-btn" :class="{ 'loading': loading }">
              <span class="btn-icon"><ChatLineRound /></span> 
              <span class="btn-text">生成第一条心声</span>
            </button>
          </el-empty>
        </div>
        
        <div v-else>
          <transition-group name="thought-fade">
            <div 
              v-for="(thought, index) in plantStore.thoughts" 
              :key="thought.id || thought._id || index" 
              class="thought-card card"
            >
              <div class="thought-bubble"></div>
              <div class="thought-date">{{ formatDate(thought.timestamp) }}</div>
              <div class="thought-content">{{ thought.content }}</div>
              <div class="thought-footer">
                <button 
                  type="button"
                  @click="toggleLikeThought(thought)" 
                  class="custom-btn like-btn"
                  :class="{ 'liked': thought.liked }"
                >
                  <span class="btn-icon"><Star /></span>
                  <span class="btn-text">{{ thought.liked ? '已收藏' : '收藏' }}</span>
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { usePlantStore } from '../stores/plant'
import { useTaskStore } from '../stores/task'
import { usePostStore } from '../stores/post'
import { format } from 'date-fns'
import { ChatLineRound, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { plantApi } from '../services/api'

export default {
  name: 'PlantVoicePage',
  components: {
    ChatLineRound,
    Star
  },
  setup() {
    const plantStore = usePlantStore()
    const taskStore = useTaskStore()
    const postStore = usePostStore()
    
    const plantMood = ref(plantStore.currentPlant?.mood || 'neutral')
    const loading = ref(false)
    
    // 添加一个标志来追踪是否是初始加载
    const isInitialLoad = ref(true)
    
    // 监听主植物变化
    watch(() => plantStore.mainPlant, async (newMainPlant) => {
      if (newMainPlant) {
        // 更新当前植物
        plantStore.currentPlant = newMainPlant;
        
        // 更新心情状态
        plantMood.value = newMainPlant.mood || 'neutral';
        
        // 重新加载植物心声
        try {
          const plantId = newMainPlant._id || newMainPlant.id;
          if (plantId) {
            loading.value = true;
            await plantStore.fetchPlantThoughts(plantId);
            
            // 如果没有心声，且不是由 onMounted 触发的，才自动生成一条
            if (plantStore.thoughts.length === 0 && !isInitialLoad.value) {
              await generateThought();
            }
          }
        } catch (error) {
          console.error('获取植物心声失败:', error);
          ElMessage.error('获取植物心声失败');
        } finally {
          loading.value = false;
        }
      }
    }, { immediate: true });
    
    // 生成植物心声
    const generateThought = async () => {
      if (!plantStore.currentPlant) {
        ElMessage.warning('请先在花园中购买一个植物')
        return
      }
      
      const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
      if (!plantId) {
        console.error('植物ID无效')
        ElMessage.warning('植物信息不完整，请重新选择植物')
        return
      }
      
      try {
        loading.value = true
        console.log('开始生成植物心声，植物ID:', plantId)
        
        // 使用API生成心声
        const context = {
          weather: plantStore.currentPlant.weather || 'sunny',
          timeOfDay: getTimeOfDay(),
          mood: plantMood.value,
          recentTasks: taskStore.completedTasks.slice(0, 3).map(task => ({
            id: task._id || task.id,
            title: task.title,
            completed: true
          }))
        }
        
        console.log('生成植物心声的上下文:', context)
        
        const thought = await plantStore.generatePlantThought(plantId, context)
        console.log('生成植物心声的结果:', thought)
        
        if (thought) {
          ElMessage({
            message: '植物有新的心声啦！',
            type: 'success'
          })
        }
      } catch (error) {
        console.error('生成植物心声失败', error)
        ElMessage.error('生成植物心声失败')
      } finally {
        loading.value = false
      }
    }
    
    // 获取当前时间段
    const getTimeOfDay = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) return 'morning'
      if (hour >= 12 && hour < 18) return 'afternoon'
      return 'evening'
    }
    
    // 更新心情
    const updateMood = async (mood) => {
      if (!plantStore.currentPlant) {
        ElMessage.warning('请先选择一个植物')
        return
      }
      
      const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
      if (!plantId) {
        console.error('植物ID无效')
        ElMessage.warning('植物信息不完整，请重新选择植物')
        return
      }
      
      try {
        loading.value = true
        const updatedPlant = await plantStore.updatePlant(plantId, { mood })
        
        if (updatedPlant) {
          plantMood.value = mood
          const moodMessages = {
            happy: '植物看起来很开心！',
            neutral: '植物心情平静',
            sad: '植物有点难过，需要更多关爱'
          }
          
          ElMessage({
            type: mood === 'sad' ? 'warning' : mood === 'happy' ? 'success' : 'info',
            message: moodMessages[mood] || '植物心情已更新'
          })
        }
      } catch (error) {
        console.error('更新植物心情失败:', error)
        ElMessage.error('更新植物心情失败，请稍后重试')
        plantMood.value = plantStore.currentPlant.mood || 'neutral'
      } finally {
        loading.value = false
      }
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
    }
    
    // 获取植物表情
    const getPlantEmoji = () => {
      if (!plantStore.currentPlant) return '🌱'
      return plantStore.currentPlant.emoji || '🌱'
    }
    
    // 收藏/取消收藏心声
    const toggleLikeThought = async (thought) => {
      if (!thought?.id) {
        console.error('心声对象无效')
        ElMessage.warning('无法操作，心声信息无效')
        return
      }
      
      if (!plantStore.currentPlant) {
        ElMessage.warning('请先选择一个植物')
        return
      }
      
      const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
      if (!plantId) {
        console.error('植物ID无效')
        ElMessage.warning('植物信息不完整，请重新选择植物')
        return
      }
      
      try {
        loading.value = true
        
        if (thought.liked) {
          await plantApi.unlikeThought(plantId, thought.id)
          thought.liked = false
          ElMessage({ message: '已取消收藏', type: 'info' })
        } else {
          await plantApi.likeThought(plantId, thought.id)
          thought.liked = true
          ElMessage({ message: '已收藏此心声', type: 'success' })
        }
      } catch (error) {
        console.error('操作心声收藏失败:', error)
        ElMessage.error('操作失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
    
    // 检查植物ID是否有效
    const checkPlantId = (plant) => {
      if (!plant) return false
      return !!(plant._id || plant.id)
    }
    
    onMounted(async () => {
      if (!plantStore.currentPlant) {
        await plantStore.fetchPlants()
      }
      
      if (plantStore.currentPlant && checkPlantId(plantStore.currentPlant)) {
        const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
        
        try {
          loading.value = true
          await plantStore.fetchPlantThoughts(plantId)
          
          if (plantStore.thoughts.length === 0 && isInitialLoad.value) {
            await generateThought()
          }
        } catch (error) {
          console.error('获取植物心声失败:', error)
          ElMessage.error('获取植物心声失败')
        } finally {
          loading.value = false
          isInitialLoad.value = false
        }
      }
    })
    
    return {
      plantStore,
      plantMood,
      loading,
      generateThought,
      updateMood,
      formatDate,
      getPlantEmoji,
      toggleLikeThought
    }
  }
}
</script>

<style scoped>
.plant-voice-page {
  min-height: 100vh;
  padding: 20px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.card {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: none;
}

.plant-voice-header {
  display: flex;
  align-items: center;
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.plant-voice-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #42b983 0%, #64d2ff 100%);
}

.plant-icon {
  margin-right: 24px;
  width: 90px;
  height: 90px;
  background: linear-gradient(135deg, rgba(66, 185, 131, 0.2) 0%, rgba(100, 210, 255, 0.2) 100%);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 6px 12px rgba(66, 185, 131, 0.2);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
}

.plant-emoji {
  font-size: 54px;
}

.plant-info h2 {
  font-size: 1.8rem;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
}

.plant-description {
  color: #666;
  margin-top: 5px;
  font-size: 1.05rem;
  line-height: 1.5;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  margin-bottom: 24px;
}

/* 自定义按钮样式 */
.custom-btn {
  border: none;
  padding: 10px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.custom-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.custom-btn:active {
  transform: translateY(-1px);
}

.custom-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.4), rgba(255,255,255,0.1));
  transition: all 0.5s ease;
}

.custom-btn:hover::before {
  left: 100%;
}

.generate-btn {
  background: linear-gradient(135deg, #42b983 0%, #36a174 100%);
  color: white;
  padding: 12px 20px;
  font-weight: 500;
}

.generate-btn:hover {
  background: linear-gradient(135deg, #4bc990 0%, #3cac7e 100%);
}

.generate-btn.loading {
  opacity: 0.8;
  cursor: wait;
}

.btn-icon {
  margin-right: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
}

.btn-text {
  letter-spacing: 0.5px;
}

.empty-btn {
  margin-top: 15px;
}

.thoughts-list {
  margin-top: 20px;
}

.empty-thoughts {
  padding: 50px 0;
  text-align: center;
}

.thought-card {
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
  transition: all 0.3s ease;
  border-left: 4px solid #42b983;
}

.thought-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.thought-bubble {
  position: absolute;
  top: -10px;
  left: 20px;
  width: 20px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  transform: rotate(45deg);
  border-top-left-radius: 3px;
}

.thought-date {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.thought-date::before {
  content: '🕒';
  margin-right: 6px;
  font-size: 0.9rem;
}

.thought-content {
  font-size: 1.15rem;
  line-height: 1.7;
  margin-bottom: 20px;
  color: #444;
}

.thought-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px dashed #eee;
  padding-top: 12px;
  margin-top: 5px;
}

.like-btn {
  color: #42b983;
  background-color: rgba(66, 185, 131, 0.05);
  padding: 6px 14px;
  box-shadow: none;
}

.like-btn:hover {
  background-color: rgba(66, 185, 131, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(66, 185, 131, 0.2);
}

.like-btn.liked {
  color: #ff9800;
  background-color: rgba(255, 152, 0, 0.1);
}

.like-btn.liked:hover {
  background-color: rgba(255, 152, 0, 0.15);
  box-shadow: 0 3px 8px rgba(255, 152, 0, 0.2);
}

.thought-fade-enter-active, .thought-fade-leave-active {
  transition: all 0.5s ease;
}

.thought-fade-enter-from, .thought-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .plant-voice-header {
    flex-direction: column;
    text-align: center;
  }
  
  .plant-icon {
    margin-right: 0;
    margin-bottom: 16px;
  }
  
  .action-bar {
    flex-direction: column;
    gap: 15px;
  }
  
  .mood-select {
    width: 100%;
  }
  
  .custom-btn {
    padding: 8px 12px;
  }
}
</style> 
