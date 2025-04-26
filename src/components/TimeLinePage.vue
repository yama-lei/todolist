<!-- Timeline.vue -->
<template>
  <div class="timeline-container">
    <div class="timeline">
      <div v-for="(story, index) in stories" :key="story.id" class="timeline-item">
        <div class="timeline-date">
          <div class="date-bubble">{{ formatDate(story.time) }}</div>
          <div class="time-text">{{ formatTime(story.time) }}</div>
        </div>
        
        <div class="timeline-content" :class="{ 'is-diary': story.postType === 'diary' }">
          <!-- 帖子类型标签 -->
          <div class="post-type-tag" :class="{ 'diary': story.postType === 'diary' }">
            {{ story.postType === 'diary' ? '日记' : '说说' }}
          </div>
          
          <!-- 帖子标题区域 -->
          <div class="content-header">
            <h3 class="content-title">{{ story.title }}</h3>
            <div class="content-actions">
              <el-button size="small" :icon="Star" circle @click="likePost(story.id)"></el-button>
            </div>
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
            <div class="interaction-stats">
              <span class="likes-count">
                <el-icon><Star /></el-icon> {{ getRandomLikes() }}
              </span>
            </div>
            
            <div class="delete-action">
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
import { ref } from 'vue'
import { usePostStore } from '../stores/post'
import { Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  stories: {
    type: Array,
    default: () => []
  }
})

const postStore = usePostStore()
const deleteDialogVisible = ref(false)
const postToDelete = ref(null)

// 格式化日期部分
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 格式化时间部分
const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 获取随机点赞数（仅用于演示）
const getRandomLikes = () => {
  return Math.floor(Math.random() * 10)
}

// 点赞帖子
const likePost = (id) => {
  postStore.likePost(id)
  ElMessage({
    message: '点赞成功！',
    type: 'success'
  })
}

// 打开删除确认框
const confirmDelete = (id) => {
  postToDelete.value = id
  deleteDialogVisible.value = true
}

// 删除帖子
const deletePost = () => {
  if (postToDelete.value) {
    postStore.removePost(postToDelete.value)
    deleteDialogVisible.value = false
    postToDelete.value = null
    
    ElMessage({
      message: '删除成功！',
      type: 'success'
    })
  }
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

.content-actions {
  display: flex;
  gap: 8px;
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
}

.content-image {
  width: 240px;
  height: 160px;
  object-fit: cover;
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
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f2f5;
}

.interaction-stats {
  display: flex;
  gap: 16px;
}

.likes-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 14px;
}

.likes-count .el-icon {
  color: #F7BA2A;
}

.delete-action {
  opacity: 0.6;
  transition: opacity 0.3s;
}

.delete-action:hover {
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