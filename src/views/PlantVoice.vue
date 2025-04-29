<template>
  <div class="plant-voice-page">
    <div class="container">
      <div class="plant-voice-header card">
        <div class="plant-icon">
          <span class="plant-emoji">{{ getPlantEmoji() }}</span>
        </div>
        <div class="plant-info">
          <h2>{{ plantStore.plant.name }}的心声</h2>
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
        <div v-if="plantStore.plant.thoughts.length === 0" class="empty-thoughts card">
          <el-empty description="还没有植物心声，点击上方按钮生成吧！" />
        </div>
        
        <div v-else>
          <div 
            v-for="thought in plantStore.plant.thoughts" 
            :key="thought.id" 
            class="thought-card card"
          >
            <div class="thought-date">{{ formatDate(thought.date) }}</div>
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
    
    const plantMood = ref(plantStore.plant.mood)
    
    // 生成植物心声
    const generateThought = () => {
      // 这一阶段的实现先用固定的模板生成植物心声
      // 后续接入LLM后可以使用更复杂的逻辑
      
      const templates = [
        "今天看到主人又完成了一个任务，真是勤劳呢！希望能一直保持这样的热情。",
        "看着窗外的阳光，感觉自己又长高了一点，主人的关心让我每天都很开心。",
        "最近主人似乎很忙的样子，希望不要忘记照顾好自己哦。",
        "今天的天气真好，适合户外活动，主人要不要去外面走走？",
        "刚看到主人写的说说，感觉主人的心情很不错，我也跟着开心起来了。",
        "主人的任务列表上有好多事情还没完成，要加油哦！",
        "我感觉自己快要开花了，这都是因为主人平时的悉心照料。",
        "今天感受到了一些阳光，能量满满，希望主人也能保持活力。",
        "主人最近心情似乎不太好，有什么事情可以和我分享吗？",
        "我已经长到这么大了，回想起来真是一段美好的旅程，谢谢主人的陪伴。"
      ]
      
      // 根据可用的信息生成更具体的内容
      let thoughtContent = ""
      
      // 看有没有最近完成的任务
      if (taskStore.completedTasks.length > 0) {
        const recentTask = taskStore.completedTasks[0]
        thoughtContent = `主人最近完成了"${recentTask.title}"任务，真是太棒了！继续加油，我会一直陪伴着你成长。`
      } 
      // 看有没有最近发布的说说
      else if (postStore.posts.length > 0) {
        thoughtContent = `我看到主人最近发布了新的说说，从中感受到了主人的心情。希望每一天都能充满阳光！`
      }
      // 如果没有特定信息，则随机选择一条模板
      else {
        const randomIndex = Math.floor(Math.random() * templates.length)
        thoughtContent = templates[randomIndex]
      }
      
      // 添加到心声列表
      plantStore.addThought(thoughtContent)
      
      // 提示用户
      ElMessage({
        message: '植物有新的心声啦！',
        type: 'success'
      })
    }
    
    // 更新心情
    const updateMood = (mood) => {
      plantStore.setMood(mood)
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
    }
    
    // 获取植物表情
    const getPlantEmoji = () => {
      const state = plantStore.plant.state
      if (state === 'growing') return '🌱'
      if (state === 'flowering') return '🌸'
      if (state === 'fruiting') return '🍎'
      return '🌱'
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
    
    onMounted(() => {
      // 如果没有心声，自动生成一条
      if (plantStore.plant.thoughts.length === 0) {
        generateThought()
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