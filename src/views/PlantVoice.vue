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
        <el-button type="primary" @click="generateThought">
          <el-icon><ChatLineRound /></el-icon>
          生成新的植物心声
        </el-button>
        <el-select v-model="plantMood" placeholder="选择植物心情" @change="updateMood">
          <el-option label="开心" value="happy" />
          <el-option label="一般" value="neutral" />
          <el-option label="难过" value="sad" />
        </el-select>
      </div>
      
      <div class="thoughts-list">
        <div v-if="!plantStore.thoughts || plantStore.thoughts.length === 0" class="empty-thoughts card">
          <el-empty description="还没有植物心声，点击上方按钮生成吧！" />
        </div>
        
        <div v-else>
          <div 
            v-for="thought in plantStore.thoughts" 
            :key="thought.id" 
            class="thought-card card"
          >
            <div class="thought-date">{{ formatDate(thought.timestamp) }}</div>
            <div class="thought-content">{{ thought.content }}</div>
            <div class="thought-footer">
              <el-button type="text" size="small" @click="likeThought(thought.id)">
                <el-icon><Star /></el-icon> 收藏
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { usePlantStore } from '../stores/plant'
import { useTaskStore } from '../stores/task'
import { usePostStore } from '../stores/post'
import { format } from 'date-fns'
import { ChatLineRound, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

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
    
    // 生成植物心声
    const generateThought = async () => {
      if (!plantStore.currentPlant) {
        ElMessage.warning('请先在花园中购买一个植物')
        return
      }
      
      // 检查植物ID是否有效
      if (!plantStore.currentPlant._id && !plantStore.currentPlant.id) {
        console.error('植物ID无效')
        ElMessage.warning('植物信息不完整，请重新选择植物')
        return
      }
      
      const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
      
      try {
        // 使用API生成心声
        const context = {
          weather: plantStore.currentPlant.weather || 'sunny',
          timeOfDay: getTimeOfDay(),
          recentTasks: taskStore.completedTasks.slice(0, 3).map(task => ({
            id: task._id || task.id,
            title: task.title,
            completed: true
          }))
        }
        
        const thought = await plantStore.generatePlantThought(plantId, context)
        
        if (thought) {
          ElMessage({
            message: '植物有新的心声啦！',
            type: 'success'
          })
        }
      } catch (error) {
        console.error('生成植物心声失败', error)
        ElMessage.error('生成植物心声失败')
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
      if (plantStore.currentPlant) {
        // 检查植物ID是否有效
        if (!plantStore.currentPlant._id && !plantStore.currentPlant.id) {
          console.error('植物ID无效')
          ElMessage.warning('植物信息不完整，请重新选择植物')
          return
        }
        
        const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
        await plantStore.updatePlant(plantId, { mood })
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
    
    // 收藏心声（实际功能待实现）
    const likeThought = (id) => {
      // 这里可以添加实际的收藏逻辑，使用id参数
      console.log('收藏心声ID:', id)
      ElMessage({
        message: '已收藏此心声',
        type: 'success'
      })
    }
    
    onMounted(async () => {
      // 确保有植物数据
      if (!plantStore.currentPlant) {
        await plantStore.fetchPlants()
      }
      
      // 如果有植物，加载心声历史
      if (plantStore.currentPlant) {
        // 检查植物ID是否有效
        if (!plantStore.currentPlant._id && !plantStore.currentPlant.id) {
          console.error('植物ID无效')
          ElMessage.warning('植物信息不完整，请重新选择植物')
          return
        }
        
        const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
        await plantStore.fetchPlantThoughts(plantId)
        
        // 如果没有心声，自动生成一条
        if (plantStore.thoughts.length === 0) {
          generateThought()
        }
      }
    })
    
    return {
      plantStore,
      plantMood,
      generateThought,
      updateMood,
      formatDate,
      getPlantEmoji,
      likeThought
    }
  }
}
</script>

<style scoped>
.plant-voice-page {
  background-color: var(--background-color);
  min-height: 100vh;
  padding: 20px 0;
}

.plant-voice-header {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-bottom: 20px;
}

.plant-icon {
  margin-right: 20px;
  width: 80px;
  height: 80px;
  background-color: rgba(66, 185, 131, 0.1);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.plant-emoji {
  font-size: 48px;
}

.plant-description {
  color: #666;
  margin-top: 5px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  margin-bottom: 20px;
}

.thoughts-list {
  margin-top: 20px;
}

.empty-thoughts {
  padding: 40px 0;
}

.thought-card {
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
}

.thought-date {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 10px;
}

.thought-content {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.thought-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 