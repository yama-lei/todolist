<template>
  <div class="posts-container">
    <div class="page-header">
      <h1 class="page-title">心情空间</h1>
      <p class="page-subtitle">记录生活的点滴，分享心情的瞬间</p>
    </div>
    
    <div class="content-card">
      <div class="thought-input-area" @click="openPostDialog('thought')">
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
      <TimeLinePage 
        :stories="filteredPosts" 
        @delete-post="deletePost"
        @edit-post="editPost"
      ></TimeLinePage>
    </div>
    
    <!-- 新增/编辑说说/日记对话框 -->
    <el-dialog
      v-model="showPostDialog"
      :title="isEditing ? (postType === 'diary' ? '编辑日记' : '编辑说说') : (postType === 'diary' ? '写日记' : '发说说')"
      width="65%"
      custom-class="post-dialog"
      destroy-on-close
      :fullscreen="false"
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
      
      <div class="diary-header" v-if="postType === 'diary'">
        <div class="diary-date">
          <div class="diary-day">{{ new Date().getDate() }}</div>
          <div class="diary-month-year">{{ new Date().toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' }) }}</div>
        </div>
        <div class="diary-weather-mood" v-if="newPost.weather || newPost.mood">
          <span v-if="newPost.weather" class="diary-weather">
            {{ {sunny: '☀️ 晴天', rainy: '🌧️ 下雨', cloudy: '☁️ 多云', snowy: '❄️ 下雪'}[newPost.weather] || '' }}
          </span>
          <span v-if="newPost.mood" class="diary-mood">{{ getMoodText(newPost.mood) }}</span>
        </div>
      </div>
      
      <el-form class="diary-form">
        <el-form-item v-if="postType === 'diary'" class="diary-title-item">
          <el-input
            v-model="newPost.title"
            placeholder="给今天写个标题..."
            :prefix-icon="Document"
            class="diary-title-input"
            :size="postType === 'diary' ? 'large' : 'default'"
          />
        </el-form-item>
        
        <el-form-item class="diary-content-item">
          <el-input
            v-model="newPost.content"
            type="textarea"
            :rows="postType === 'diary' ? 10 : 6"
            :placeholder="postType === 'diary' ? '今天发生了什么...\n\n写下此刻的心情，记录生活的点滴...' : '此刻的想法...'"
            class="diary-content"
            resize="none"
          />
        </el-form-item>
        
        <div class="diary-toolbar" v-if="postType === 'diary'">
          <div class="toolbar-group">
          <div class="option-item" @click="toggleMood">
            <el-icon><SmileFilled /></el-icon>
            <span>{{ newPost.mood ? `心情：${getMoodText(newPost.mood)}` : '添加心情' }}</span>
          </div>
          
          <div class="option-item" @click="locationVisible = !locationVisible">
            <el-icon><Location /></el-icon>
            <span>{{ locationVisible ? '隐藏位置' : '添加位置' }}</span>
          </div>
          
            <div class="option-item" @click="weatherVisible = !weatherVisible">
            <el-icon><Sunny /></el-icon>
            <span>{{ weatherVisible ? '隐藏天气' : '添加天气' }}</span>
            </div>
          </div>
          
          <div class="toolbar-group">
            <div class="diary-image-count" v-if="newPost.images.length > 0">
              已添加 {{ newPost.images.length }} 张图片
            </div>
            <el-button size="small" @click="scrollToUpload">添加图片</el-button>
          </div>
        </div>
        
        <el-form-item v-if="postType !== 'diary'" class="thought-options">
          <div class="post-options">
            <div class="option-item" @click="toggleMood">
              <el-icon><SmileFilled /></el-icon>
              <span>{{ newPost.mood ? `心情：${getMoodText(newPost.mood)}` : '添加心情' }}</span>
            </div>
            
            <div class="option-item" @click="locationVisible = !locationVisible">
              <el-icon><Location /></el-icon>
              <span>{{ locationVisible ? '隐藏位置' : '添加位置' }}</span>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item v-if="locationVisible">
          <el-input 
            v-model="newPost.location" 
            placeholder="我在哪里..." 
            :prefix-icon="Location"
            class="location-input"
          />
        </el-form-item>
        
        <el-form-item v-if="weatherVisible && postType === 'diary'" class="weather-selector">
          <div class="weather-options">
            <div 
              v-for="(label, value) in { sunny: '☀️ 晴天', rainy: '🌧️ 下雨', cloudy: '☁️ 多云', snowy: '❄️ 下雪' }" 
              :key="value"
              class="weather-option"
              :class="{ active: newPost.weather === value }"
              @click="newPost.weather = value"
            >
              <span class="weather-icon">{{ label.split(' ')[0] }}</span>
              <span>{{ label.split(' ')[1] }}</span>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item v-if="showMoodSelector" class="mood-item">
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
        
        <el-form-item id="upload-section">
          <div class="upload-area" :class="{ 'diary-upload': postType === 'diary' }">
            <div class="upload-title" v-if="postType === 'diary'">添加图片记录美好瞬间</div>
            <el-upload
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :file-list="fileList"
              :on-preview="handlePictureCardPreview"
            >
              <template #default>
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span class="upload-text">添加图片</span>
              </template>
            </el-upload>
            <el-dialog v-model="dialogVisible">
              <img w-full :src="dialogImageUrl" alt="预览图片" />
            </el-dialog>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPostDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :disabled="!isPostValid" :size="postType === 'diary' ? 'large' : 'default'">
            {{ isEditing ? '保存修改' : (postType === 'diary' ? '保存日记' : '发布说说') }}
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
import { ElMessage, ElLoading } from 'element-plus'
import TimeLinePage from '@/components/TimeLinePage.vue'
import ossApi from '@/services/ossApi' // 导入OSS API服务

const postStore = usePostStore()

const showPostDialog = ref(false)
const locationVisible = ref(false)
const weatherVisible = ref(false)
const showMoodSelector = ref(false)
const postType = ref('thought')
const activeFilter = ref('all')
const isEditing = ref(false)
const editingPostId = ref(null)
const fileList = ref([]) // 文件列表
const dialogImageUrl = ref('') // 预览图片URL
const dialogVisible = ref(false) // 预览对话框显示状态
const uploadLoading = ref(false) // 上传加载状态

const newPost = ref({
  title: '',
  content: '',
  images: [],
  uploadFiles: [], // 清空上传文件列表
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

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '刚刚'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    console.warn('无效的日期格式:', dateString)
    return '刚刚'
  }
  
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 格式化时间
const formatPostTime = (createdAt) => {
  if (!createdAt) {
    console.warn('缺少创建时间，使用当前时间');
    return format(new Date(), 'yyyy-MM-dd HH:mm');
  }
  
  try {
    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) {
      return format(date, 'yyyy-MM-dd HH:mm');
    } else {
      console.warn('无效的日期格式:', createdAt);
    }
  } catch (error) {
    console.error('日期格式化错误:', error);
  }
  
  return format(new Date(), 'yyyy-MM-dd HH:mm');
}

// 添加帖子
const addPost = async () => {
  if (!isPostValid.value) return
  
  try {
    const postData = {
      ...newPost.value,
      createdAt: new Date().toISOString() // 确保设置创建时间
    }
    
    const success = await postStore.addCustomPost(postData)
    if (success) {
      resetForm()
      showPostDialog.value = false
      await loadPosts()
    }
  } catch (error) {
    console.error('发布失败:', error)
    ElMessage.error('发布失败，请稍后再试')
  }
}

// 格式化并过滤帖子数据以适应TimeLinePage组件
const filteredPosts = computed(() => {
  if (!Array.isArray(postStore.posts)) {
    console.warn('posts 不是数组:', postStore.posts)
    return []
  }
  
  let result = [...postStore.posts]
  
  // 调试：打印原始数据
  console.log('原始帖子数据:', result)
  
  // 按类型过滤
  if (activeFilter.value !== 'all') {
    result = result.filter(post => post.type === activeFilter.value)
  }
  
  // 按日期排序（降序）
  result.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateB - dateA
  })
  
  return result.map(post => {
    // 调试：打印每个帖子的日期
    console.log('后端返回的帖子：', post);
    console.log('处理帖子日期:', {
      id: post._id,
      createdAt: post.createdAt,
    })
    
    // 构建标题: 日记显示标题，说说显示位置或心情
    let title = post.title || ''
    if (!title) {
      if (post.location) {
        title = `📍 ${post.location}`
      } else if (post.mood) {
        const mood = moods.find(m => m.value === post.mood)
        title = mood ? `${mood.emoji} ${mood.text}` : ''
      } else {
        title = post.type === 'diary' ? '无标题日记' : ''
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
    
    return {
      time: post.createdAt, // 直接使用后端返回的创建时间
      title: title,
      description: description,
      imageSrc: post.images && post.images.length > 0 ? post.images[0] : null,
      galleryImages: post.images || [], // 确保是数组
      id: post._id,
      postType: post.type,
      // 添加原始属性以便编辑时正确保存
      location: post.location,
      mood: post.mood,
      weather: post.weather
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

// 重置表单
const resetForm = () => {
  newPost.value = {
    title: '',
    content: '',
    images: [],
    uploadFiles: [], // 清空上传文件列表
    location: '',
    mood: 'neutral',
    weather: 'sunny',
    type: postType.value
  }
  // 清空文件列表
  fileList.value = []
  locationVisible.value = false
  weatherVisible.value = false
  showMoodSelector.value = false
  isEditing.value = false
  editingPostId.value = null
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

// 处理图片预览
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url || URL.createObjectURL(file.raw)
  dialogVisible.value = true
}

// 处理文件选择
const handleFileChange = (file) => {
  // 保留文件对象用于上传
  if (!newPost.value.uploadFiles) {
    newPost.value.uploadFiles = []
  }
  newPost.value.uploadFiles.push(file.raw)
  
  // 创建临时URL用于显示
  const tempUrl = URL.createObjectURL(file.raw)
  file.url = tempUrl // 添加临时URL用于预览
  
  // 只在上传成功后才会添加到最终的images数组
}

// 处理文件移除
const handleFileRemove = (file) => {
  // 移除上传文件列表中的文件
  if (newPost.value.uploadFiles) {
    const index = newPost.value.uploadFiles.findIndex(f => {
      return f === file.raw
    })
    if (index !== -1) {
      newPost.value.uploadFiles.splice(index, 1)
    }
  }
  
  // 如果已上传，则也从images中移除
  if (file.url && file.url.startsWith('http')) {
    const imageIndex = newPost.value.images.indexOf(file.url)
    if (imageIndex !== -1) {
      newPost.value.images.splice(imageIndex, 1)
    }
  }
}

// 上传所有选中的图片到OSS
const uploadImages = async () => {
  if (!newPost.value.uploadFiles || newPost.value.uploadFiles.length === 0) {
    return []
  }
  
  uploadLoading.value = true
  try {
    console.log('准备上传图片，数量:', newPost.value.uploadFiles.length);
    
    // 调用OSSApi上传多个文件
    const imageUrls = await ossApi.uploadMultipleFiles(newPost.value.uploadFiles);
    
    console.log('图片上传成功，URL列表:', imageUrls);
    
    // 清空上传文件列表
    newPost.value.uploadFiles = [];
    
    // 返回图片URL数组
    return imageUrls || [];
  } catch (error) {
    console.error('上传图片失败:', error);
    ElMessage.error(`上传图片失败: ${error.message || '未知错误'}`);
    return [];
  } finally {
    uploadLoading.value = false;
  }
}

// 滚动到上传区域
const scrollToUpload = () => {
  document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })
}

// 每次显示对话框时，更新postType到newPost
watch(postType, (newVal) => {
  newPost.value.type = newVal
  console.log('切换类型为:', newVal)
})

// 初始化对话框时设置类型
const openPostDialog = (type = 'thought') => {
  isEditing.value = false
  editingPostId.value = null
  postType.value = type
  newPost.value = {
    title: '',
    content: '',
    images: [],
    uploadFiles: [], // 确保上传文件列表为空
    location: '',
    mood: 'neutral',
    weather: 'sunny',
    type: type
  }
  // 清空文件列表
  fileList.value = []
  showPostDialog.value = true
}

// 编辑帖子
const editPost = (post) => {
  isEditing.value = true
  editingPostId.value = post.id
  postType.value = post.postType
  
  // 填充表单数据
  newPost.value = {
    title: post.title,
    content: post.description,
    images: post.galleryImages || [],
    uploadFiles: [], // 新上传的文件初始为空
    location: post.location || '',
    mood: post.mood || '',
    weather: post.weather || '',
    type: post.postType,
    createdAt: post.time // 保留原始创建时间
  }
  
  // 准备文件列表显示已有图片
  fileList.value = (post.galleryImages || []).map((url, index) => {
    return {
      name: `已有图片${index + 1}`,
      url: url,
      status: 'success'
    }
  })
  
  // 显示相关选项
  if (newPost.value.location) {
    locationVisible.value = true
  }
  if (newPost.value.weather) {
    weatherVisible.value = true
  }
  
  showPostDialog.value = true
}

// 处理提交（新增或编辑）
const handleSubmit = async () => {
  if (!isPostValid.value) return
  
  try {
    // 显示加载提示
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在处理图片和提交内容，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    // 先上传所有选中的图片到OSS
    let imageUrls = []
    if (newPost.value.uploadFiles && newPost.value.uploadFiles.length > 0) {
      imageUrls = await uploadImages()
    }
    
    // 准备帖子数据，包含已上传的图片URL和原有图片（如果有）
    let postImages = [...(newPost.value.images || [])]
    
    // 只添加新上传的图片URL
    postImages = [...postImages, ...imageUrls]
    
    const postData = {
      ...newPost.value,
      images: postImages,
      // 只在新建时设置时间，编辑时保留原始时间
      createdAt: isEditing.value ? newPost.value.createdAt : new Date().toISOString()
    }
    
    // 删除上传文件列表，避免发送到后端
    delete postData.uploadFiles
    
    console.log('准备提交的帖子数据:', postData);
    
    let success
    if (isEditing.value) {
      success = await postStore.updatePost(editingPostId.value, postData)
    } else {
      success = await postStore.addCustomPost(postData)
    }
    
    // 关闭加载提示
    loadingInstance.close()
    
    if (success) {
      // 清空表单并关闭对话框
      resetForm()
      showPostDialog.value = false
      // 重新加载帖子列表
      await loadPosts()
      
      ElMessage.success(isEditing.value ? '更新成功' : '发布成功')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请稍后再试')
  }
}
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
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 20px;
  background-color: #F5F7FA;
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
  background-color: #E6F1FF;
}

.thought-input-placeholder {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #606266;
}

.thought-input-placeholder .el-icon {
  font-size: 20px;
}

.filter-tabs {
  display: flex;
  gap: 16px;
  border-bottom: 1px solid #DCDFE6;
  padding-bottom: 12px;
}

.filter-tab {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 16px;
  transition: all 0.3s;
  font-size: 14px;
  background-color: #EBEEF5;
}

.filter-tab:hover {
  color: #409EFF;
  background-color: #DBECFF;
}

.filter-tab.active {
  color: white;
  background-color: #409EFF;
  font-weight: 500;
}

.content-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.write-diary-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  background-color: #E6F1FF;
}

.post-type-option.active {
  background-color: #409EFF;
  color: white;
  border-color: #409EFF;
}

.post-type-option.active .el-icon {
  color: white;
}

/* 日记特有样式 */
.diary-form {
  max-width: 100%;
  margin: 0 auto;
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #DCDFE6;
}

.diary-date {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.diary-day {
  font-size: 28px;
  font-weight: 700;
  color: #409EFF;
}

.diary-month-year {
  font-size: 14px;
  color: #606266;
}

.diary-weather-mood {
  display: flex;
  gap: 15px;
  font-size: 16px;
}

.diary-title-item {
  margin-bottom: 24px;
}

.diary-title-input :deep(input) {
  font-size: 18px;
  height: 48px;
  font-weight: 600;
}

.diary-content {
  font-size: 15px;
  line-height: 1.7;
}

.diary-content :deep(.el-textarea__inner) {
  padding: 15px;
  border-radius: 8px;
  background-color: #fafafa;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
  font-family: inherit;
}

.diary-content :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.2);
}

.diary-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 15px;
  padding: 10px 12px;
  background-color: #E6F1FF;
  border-radius: 8px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.diary-image-count {
  font-size: 14px;
  color: #606266;
}

.weather-selector {
  margin-top: 10px;
}

.weather-options {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.weather-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.3s;
}

.weather-option:hover {
  background-color: #E6F1FF;
}

.weather-option.active {
  background-color: #DBECFF;
  border-color: #409EFF;
  color: #409EFF;
}

.weather-icon {
  font-size: 22px;
  margin-bottom: 5px;
}

.diary-upload {
  margin-top: 20px;
  padding: 15px;
  background-color: #E6F1FF;
  border-radius: 8px;
  border: 1px dashed #c0c4cc;
}

.upload-title {
  margin-bottom: 12px;
  font-size: 15px;
  color: #606266;
  text-align: center;
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
  background-color: #EBEEF5;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.option-item:hover {
  background-color: #DBECFF;
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
  background-color: #E6F1FF;
}

.mood-item.active {
  background-color: #DBECFF;
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
  
  .diary-day {
    font-size: 28px;
  }
  
  .weather-options {
    flex-wrap: wrap;
  }
}

/* 添加编辑按钮样式 */
.edit-button {
  color: #409EFF;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-button:hover {
  color: #66b1ff;
}
</style> 