<!-- Timeline.vue -->
<template>
  <div class="timeline-container">
    <div class="timeline">
      <div v-for="(story, index) in sortedStories" :key="story.id" class="timeline-item">
        <div class="timeline-date">
          <div class="date-bubble">{{ formatDate(story.time) }}</div>
          <div class="time-text">{{ formatTime(story.time) }}</div>
        </div>
        
        <div class="timeline-content" :class="{ 'is-diary': story.postType === 'diary' }">
          <!-- 帖子类型标签 -->
          <div class="post-type-tag" :class="{ 'diary': story.postType === 'diary' }">
            {{ story.postType === 'diary' ? '日记' : '说说' }}
          </div>
          
          <!-- 帖子标题区域，只有在标题存在时显示 -->
          <div v-if="story.title && (story.postType === 'diary' || story.title.trim() !== '')" class="content-header">
            <h3 class="content-title">{{ story.title }}</h3>
          </div>
          
          <!-- 帖子内容 -->
          <div class="content-body">
            <p class="content-text">{{ story.description }}</p>
            
            <!-- 图片展示区域 -->
            <div v-if="story.imageSrc" class="content-images">
              <el-image
                :src="story.imageSrc"
                :preview-src-list="story.galleryImages || [story.imageSrc]"
                fit="cover"
                class="content-image"
              />
              
              <div v-if="(story.galleryImages?.length || 0) > 1" class="image-count">
                +{{ story.galleryImages.length - 1 }}
              </div>
            </div>
          </div>
          
          <!-- 帖子底部区域 -->
          <div class="content-footer">
            <div class="post-actions">
              <el-button 
                size="small" 
                type="primary" 
                text 
                @click="editPost(story)"
              >
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                text 
                @click="confirmDelete(story.id)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="stories.length === 0" class="empty-timeline">
        <el-empty description="还没有内容，快来发布一条吧！"></el-empty>
      </div>
    </div>
    
    <!-- 删除确认框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="300px"
    >
      <span>确定要删除这条记录吗？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deletePost">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePostStore } from '../stores/post'
import { Delete, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  stories: {
    type: Array,
    default: () => []
  }
})
const sortedStories = computed(() => {
  return [...props.stories].sort((a, b) => {
    const dateA = new Date(a.time).getTime()
    const dateB = new Date(b.time).getTime()
    return dateB - dateA // 降序排列（最新在前）
  })
})
const postStore = usePostStore()
const deleteDialogVisible = ref(false)
const postToDelete = ref(null)

// 定义事件
const emit = defineEmits(['delete-post', 'edit-post'])

// 删除不需要的方法
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('无效的日期格式:', dateString)
      return '无效时间'
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '无效时间'
  }
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('无效的时间格式:', dateString)
      return ''
    }
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch (error) {
    console.error('时间格式化错误:', error)
    return ''
  }
}

// 打开删除确认框
const confirmDelete = (id) => {
  postToDelete.value = id
  deleteDialogVisible.value = true
}

// 删除帖子
const deletePost = async () => {
  if (postToDelete.value) {
    emit('delete-post', postToDelete.value);
    deleteDialogVisible.value = false
    postToDelete.value = null
  }
}

// 编辑帖子
const editPost = (story) => {
  emit('edit-post', story)
}
</script>

<style scoped>
.timeline-container {
  padding: 20px 0;
}

.timeline {
  position: relative;
  padding: 20px 0;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 80px;
  width: 2px;
  background: #e4e7ed;
}

.timeline-item {
  position: relative;
  display: flex;
  margin-bottom: 30px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-date {
  width: 160px;
  padding-right: 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-top: 5px;
}

.date-bubble {
  background: #f0f9ff;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #409EFF;
  margin-bottom: 4px;
}

.time-text {
  font-size: 12px;
  color: #909399;
}

.timeline-content {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 16px;
  margin-left: 20px;
  position: relative;
  transition: all 0.3s ease;
  border-left: 3px solid #67c23a;
}

.timeline-content.is-diary {
  border-left-color: #409EFF;
}

.timeline-content::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #67c23a;
  border-radius: 50%;
  left: -27px;
  top: 18px;
}

.timeline-content.is-diary::before {
  background: #409EFF;
}

.post-type-tag {
  position: absolute;
  top: -10px;
  right: 20px;
  background: #67c23a;
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.post-type-tag.diary {
  background: #409EFF;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.content-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.content-body {
  margin-bottom: 16px;
}

.content-text {
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-line;
}

.content-images {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  width: fit-content;
  max-width: 100%;
}

.content-image {
  width: 100%;
  max-width: 240px;
  object-fit: contain;
  border-radius: 8px;
}

.image-count {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
}

.content-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f2f5;
}

.post-actions {
  display: flex;
  gap: 8px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.post-actions:hover {
  opacity: 1;
}

.timeline-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.empty-timeline {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .timeline::before {
    left: 30px;
  }
  
  .timeline-date {
    width: 90px;
    padding-right: 20px;
  }
  
  .date-bubble {
    padding: 2px 8px;
    font-size: 12px;
  }
  
  .timeline-content {
    margin-left: 10px;
  }
  
  .timeline-content::before {
    left: -17px;
  }
  
  .content-image {
    width: 100%;
    height: auto;
  }
}
</style>