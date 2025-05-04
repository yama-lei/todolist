<template>
  <div class="posts-container">
    <div class="page-header">
      <h1 class="page-title">心情空间</h1>
      <p class="page-subtitle">记录生活的点滴，分享心情的瞬间</p>
    </div>
    
    <div class="content-card">
      <div class="thought-input-area" @click="showPostDialog = true">
        <div class="thought-input-placeholder">
          <el-icon><Edit /></el-icon>
          <span>写下心中碎碎念...</span>
        </div>
      </div>
      
      <div class="filter-tabs">
        <div 
          class="filter-tab" 
          :class="{ active: activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          全部
        </div>
        <div 
          class="filter-tab" 
          :class="{ active: activeFilter === 'diary' }"
          @click="activeFilter = 'diary'"
        >
          日记
        </div>
        <div 
          class="filter-tab" 
          :class="{ active: activeFilter === 'thought' }"
          @click="activeFilter = 'thought'"
        >
          说说
        </div>
      </div>
    </div>
    
    <div class="timeline-wrapper">
      <TimeLinePage :stories="filteredPosts" @delete-post="deletePost"></TimeLinePage>
    </div>
    
    <!-- 新增说说/日记对话框 -->
    <el-dialog
      v-model="showPostDialog"
      :title="postType === 'diary' ? '写日记' : '发说说'"
      width="500px"
      custom-class="post-dialog"
      destroy-on-close
    >
      <div class="post-type-selector">
        <div 
          class="post-type-option" 
          :class="{ active: postType === 'thought' }"
          @click="postType = 'thought'"
        >
          <el-icon><ChatDotRound /></el-icon>
          <span>说说</span>
        </div>
        <div 
          class="post-type-option" 
          :class="{ active: postType === 'diary' }"
          @click="postType = 'diary'"
        >
          <el-icon><Notebook /></el-icon>
          <span>日记</span>
        </div>
      </div>
      
      <el-form>
        <el-form-item v-if="postType === 'diary'">
          <el-input
            v-model="newPost.title"
            placeholder="日记标题"
            :prefix-icon="Document"
          />
        </el-form-item>
        
        <el-form-item>
          <el-input
            v-model="newPost.content"
            type="textarea"
            :rows="postType === 'diary' ? 6 : 4"
            :placeholder="postType === 'diary' ? '今天发生了什么...' : '此刻的想法...'"
          />
        </el-form-item>
        
        <el-form-item>
          <div class="upload-area">
            <el-upload
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
            >
              <template #default>
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span class="upload-text">添加图片</span>
              </template>
            </el-upload>
          </div>
        </el-form-item>
        
        <div class="post-options">
          <div class="option-item" @click="toggleMood">
            <el-icon><SmileFilled /></el-icon>
            <span>{{ newPost.mood ? `心情：${getMoodText(newPost.mood)}` : '添加心情' }}</span>
          </div>
          
          <div class="option-item" @click="locationVisible = !locationVisible">
            <el-icon><Location /></el-icon>
            <span>{{ locationVisible ? '隐藏位置' : '添加位置' }}</span>
          </div>
          
          <div v-if="postType === 'diary'" class="option-item" @click="weatherVisible = !weatherVisible">
            <el-icon><Sunny /></el-icon>
            <span>{{ weatherVisible ? '隐藏天气' : '添加天气' }}</span>
          </div>
        </div>
        
        <el-form-item v-if="locationVisible">
          <el-input 
            v-model="newPost.location" 
            placeholder="我在哪里..." 
            :prefix-icon="Location"
          />
        </el-form-item>
        
        <el-form-item v-if="weatherVisible && postType === 'diary'">
          <el-select v-model="newPost.weather" placeholder="今天的天气" style="width: 100%">
            <el-option label="☀️ 晴天" value="sunny" />
            <el-option label="🌧️ 下雨" value="rainy" />
            <el-option label="☁️ 多云" value="cloudy" />
            <el-option label="❄️ 下雪" value="snowy" />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="showMoodSelector">
          <div class="mood-selector">
            <div 
              v-for="mood in moods" 
              :key="mood.value" 
              class="mood-item"
              :class="{ active: newPost.mood === mood.value }"
              @click="selectMood(mood.value)"
            >
              <span class="mood-emoji">{{ mood.emoji }}</span>
              <span class="mood-text">{{ mood.text }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPostDialog = false">取消</el-button>
          <el-button type="primary" @click="addPost" :disabled="!isPostValid">
            {{ postType === 'diary' ? '保存日记' : '发布说说' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { usePostStore } from '../stores/post'
import { format } from 'date-fns'
import { 
  Plus, 
  Location, 
  Edit, 
  Document,
  ChatDotRound, 
  Notebook,
  SmileFilled,
  Sunny
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import TimeLinePage from '@/components/TimeLinePage.vue'

const postStore = usePostStore()

const showPostDialog = ref(false)
const locationVisible = ref(false)
const weatherVisible = ref(false)
const showMoodSelector = ref(false)
const postType = ref('thought') // 'thought' 或 'diary'
const activeFilter = ref('all')

const newPost = ref({
  title: '',
  content: '',
  images: [],
  location: '',
  mood: '',
  weather: '',
  type: 'thought'
})

// 心情选项
const moods = [
  { emoji: '😊', text: '开心', value: 'happy' },
  { emoji: '😢', text: '伤心', value: 'sad' },
  { emoji: '😡', text: '生气', value: 'angry' },
  { emoji: '😴', text: '疲惫', value: 'tired' },
  { emoji: '🥰', text: '爱意', value: 'love' },
  { emoji: '🤔', text: '思考', value: 'thinking' }
]

// 获取心情文本
const getMoodText = (moodValue) => {
  const mood = moods.find(m => m.value === moodValue)
  return mood ? `${mood.emoji} ${mood.text}` : ''
}

// 切换心情选择器
const toggleMood = () => {
  showMoodSelector.value = !showMoodSelector.value
}

// 选择心情
const selectMood = (moodValue) => {
  newPost.value.mood = moodValue
  showMoodSelector.value = false
}

// 检查发布内容是否有效
const isPostValid = computed(() => {
  if (postType.value === 'diary') {
    return newPost.value.title.trim() && newPost.value.content.trim()
  } else {
    return newPost.value.content.trim()
  }
})

// 格式化并过滤帖子数据以适应TimeLinePage组件
const filteredPosts = computed(() => {
  let posts = postStore.posts
  
  if (activeFilter.value !== 'all') {
    posts = posts.filter(post => post.type === activeFilter.value)
  }
  
  return posts.map(post => {
    // 构建标题: 日记显示标题，说说显示位置或心情
    let title = post.title || ''
    if (!title) {
      if (post.location) {
        title = `📍 ${post.location}`
      } else if (post.mood) {
        const mood = moods.find(m => m.value === post.mood)
        title = mood ? `${mood.emoji} ${mood.text}` : '无标题'
      } else {
        title = post.type === 'diary' ? '无标题日记' : '无位置说说'
      }
    }
    
    // 构建描述: 可能包含天气等信息
    let description = post.content
    if (post.weather && post.type === 'diary') {
      const weatherEmoji = {
        'sunny': '☀️ 晴天',
        'rainy': '🌧️ 下雨',
        'cloudy': '☁️ 多云',
        'snowy': '❄️ 下雪'
      }
      description = `${weatherEmoji[post.weather] || ''}\n${description}`
    }
    
    // 安全处理日期格式化，确保有效的日期值
    let formattedTime = ''
    try {
      const dateObj = new Date(post.date)
      if (!isNaN(dateObj.getTime())) {
        formattedTime = format(dateObj, 'yyyy-MM-dd HH:mm')
      } else {
        formattedTime = '无日期'
      }
    } catch (error) {
      console.error('日期格式化错误:', error)
      formattedTime = '无日期'
    }
    
    return {
      time: formattedTime,
      title: title,
      description: description,
      imageSrc: post.images.length > 0 ? post.images[0] : null,
      galleryImages: post.images,
      comments: '',
      id: post.id,
      postType: post.type
    }
  })
})

// 初始化时加载帖子
const loadPosts = async () => {
  await postStore.fetchPosts(activeFilter.value === 'all' ? '' : activeFilter.value)
}

// 监听筛选器变化重新加载帖子
watch(activeFilter, async () => {
  await loadPosts()
})

// 添加帖子
const addPost = async () => {
  if (!isPostValid.value) return
  
  const success = await postStore.addCustomPost({
    title: newPost.value.title,
    content: newPost.value.content,
    images: newPost.value.images,
    location: newPost.value.location,
    mood: newPost.value.mood,
    weather: newPost.value.weather,
    type: postType.value
  })
  
  if (success) {
    // 清空表单
    resetForm()
    // 关闭对话框
    showPostDialog.value = false
    // 重新加载帖子
    loadPosts()
  }
}

// 重置表单
const resetForm = () => {
  newPost.value = {
    title: '',
    content: '',
    images: [],
    location: '',
    mood: '',
    weather: '',
    type: postType.value
  }
  locationVisible.value = false
  weatherVisible.value = false
  showMoodSelector.value = false
}

// 删除帖子
const deletePost = async (id) => {
  const success = await postStore.removePost(id)
  if (success) {
    // 重新加载帖子
    loadPosts()
  }
}

// 初始化时加载帖子
onMounted(() => {
  loadPosts()
})

// 处理文件选择
const handleFileChange = (file) => {
  newPost.value.images.push(file)
}

// 处理文件移除
const handleFileRemove = (file) => {
  const index = newPost.value.images.indexOf(file)
  if (index !== -1) {
    newPost.value.images.splice(index, 1)
  }
}

// 每次显示对话框时，更新postType到newPost
watch(postType, (newVal) => {
  newPost.value.type = newVal
})
</script>

<style scoped>
.posts-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  color: #409EFF;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #909399;
}

.content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 20px;
}

.thought-input-area {
  border: 1px dashed #DCDFE6;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.thought-input-area:hover {
  border-color: #409EFF;
  background-color: #F5F7FA;
}

.thought-input-placeholder {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #909399;
}

.thought-input-placeholder .el-icon {
  font-size: 20px;
}

.filter-tabs {
  display: flex;
  gap: 16px;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 12px;
}

.filter-tab {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 16px;
  transition: all 0.3s;
  font-size: 14px;
}

.filter-tab:hover {
  color: #409EFF;
  background-color: #F0F9FF;
}

.filter-tab.active {
  color: white;
  background-color: #409EFF;
  font-weight: 500;
}

.timeline-wrapper {
  margin-top: 30px;
}

/* 对话框相关样式 */
:deep(.post-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.post-type-selector {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.post-type-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #EBEEF5;
}

.post-type-option .el-icon {
  font-size: 24px;
  color: #909399;
}

.post-type-option:hover {
  background-color: #F5F7FA;
}

.post-type-option.active {
  background-color: #409EFF;
  color: white;
  border-color: #409EFF;
}

.post-type-option.active .el-icon {
  color: white;
}

.upload-area {
  margin-top: 8px;
}

:deep(.upload-icon) {
  font-size: 20px;
  color: #909399;
}

:deep(.upload-text) {
  margin-top: 8px;
  color: #909399;
}

.post-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  background-color: #F5F7FA;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.option-item:hover {
  background-color: #EBEEF5;
}

.option-item .el-icon {
  font-size: 16px;
  color: #909399;
}

.mood-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.mood-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #EBEEF5;
}

.mood-item:hover {
  background-color: #F5F7FA;
}

.mood-item.active {
  background-color: #ECF5FF;
  border-color: #409EFF;
}

.mood-emoji {
  font-size: 24px;
}

.mood-text {
  font-size: 12px;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

@media (max-width: 768px) {
  .posts-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .page-subtitle {
    font-size: 14px;
  }
  
  .mood-selector {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 