<template>
  <div class="task-page">
    <div class="container">
      <div class="task-header">
        <h1 class="section-title">任务管理</h1>
        <div class="task-actions">
          <button class="add-task-button" @click="openTaskForm">
            <el-icon><Plus /></el-icon>
            <span>新建任务</span>
          </button>
        </div>
      </div>
      
      <!-- 系统任务 -->
      <div class="system-tasks-card card">
        <div class="card-header">
          <h2 class="section-title">每日任务</h2>
          <div class="task-info">
            <el-tag type="success" size="small" effect="plain">
              <el-icon><Trophy /></el-icon>
              完成任务可获得经验值，帮助植物成长
            </el-tag>
          </div>
        </div>
        
        <div class="tasks-list system-tasks">
          <div
            v-for="task in taskStore.systemTasks"
            :key="task._id"
            class="task-item"
            :class="{ 'completed': task.completed }"
          >
            <div class="task-left">
              <div class="task-icon">{{ task.icon || '🎯' }}</div>
              <div class="task-content">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-description">{{ task.description }}</div>
                <div class="task-meta" v-if="task.completed">
                  <span class="completed-at">
                    <el-icon><Check /></el-icon>
                    完成于 {{ formatDate(task.completedAt) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="task-actions">
              <el-button
                :type="task.completed ? 'success' : 'primary'"
                :icon="task.completed ? 'Check' : ''"
                :disabled="task.completed"
                class="complete-button"
                @click="completeSystemTask(task._id)"
              >
                {{ task.completed ? '已完成' : '完成任务' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 用户任务 -->
      <div class="user-tasks-card card">
        <div class="card-header">
          <h2 class="section-title">我的任务</h2>
          <div class="task-status">
            <el-tag type="primary" size="small" effect="dark" class="task-count-tag">
              {{ taskStore.pendingTasks.length }} 个待完成
            </el-tag>
          </div>
        </div>
        
        <div v-if="taskStore.pendingTasks.length === 0" class="empty-tasks">
          <el-empty description="暂无任务，点击右上角添加新任务吧！" />
        </div>
        
        <div v-else class="tasks-list user-tasks">
          <div
            v-for="task in taskStore.pendingTasks"
            :key="task._id"
            class="task-item"
            :class="{ 'important': task.important }"
          >
            <div class="task-left">
              <div class="task-checkbox">
                <el-checkbox @change="() => completeUserTask(task._id)"></el-checkbox>
              </div>
              <div class="task-content">
                <div class="task-title-row">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="star-icon" v-if="task.important">
                    <el-icon color="#F7BA2A" :size="20"><Star filled /></el-icon>
                  </div>
                </div>
                <div class="task-description">{{ task.description }}</div>
                <div class="task-meta">
                  <span v-if="task.deadline" class="task-deadline">
                    <el-tag type="info" size="small">
                      <el-icon><Clock /></el-icon>
                      {{ formatDate(task.deadline) }}
                    </el-tag>
                  </span>
                </div>
              </div>
            </div>
            <div class="task-actions">
              <el-button type="primary" text size="small" @click="editTask(task)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" text size="small" @click="deleteTask(task._id)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 已完成任务 -->
      <div class="completed-tasks-card card" v-if="taskStore.completedTasks.length > 0">
        <div class="card-header">
          <h2 class="section-title">已完成任务</h2>
          <div class="completed-count">
            <el-tag type="success" size="small" effect="dark" class="task-count-tag">
              {{ taskStore.completedTasks.length }} 个任务
            </el-tag>
          </div>
        </div>
        
        <div class="tasks-list completed-tasks">
          <div
            v-for="task in taskStore.completedTasks"
            :key="task._id"
            class="task-item completed"
          >
            <div class="task-left">
              <div class="task-checkbox">
                <el-checkbox :modelValue="true" disabled></el-checkbox>
              </div>
              <div class="task-content">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-description" v-if="task.description">{{ task.description }}</div>
                <div class="task-meta">
                  <span class="completed-at">
                    完成于 {{ formatDate(task.completedAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 任务表单对话框 -->
    <el-dialog
      v-model="showTaskForm"
      :title="editingTask ? '编辑任务' : '新建任务'"
      width="500px"
      custom-class="modern-dialog task-edit-dialog"
    >
      <el-form :model="taskForm" label-position="top" class="modern-form">
        <el-form-item label="任务标题" required class="form-item-animated">
          <el-input 
            v-model="taskForm.title" 
            placeholder="输入任务标题" 
            class="modern-input"
          />
        </el-form-item>
        
        <el-form-item label="任务描述" class="form-item-animated">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="4"
            placeholder="输入任务描述"
            class="modern-textarea"
          />
        </el-form-item>
        
        <el-form-item label="截止日期" class="form-item-animated">
          <el-date-picker
            v-model="taskForm.deadline"
            type="datetime"
            placeholder="选择截止日期"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
            class="modern-date-picker"
          />
        </el-form-item>
        
        <el-form-item class="form-item-animated importance-item">
          <div class="importance-toggle-container">
            <el-switch
              v-model="taskForm.important"
              active-color="#F7BA2A"
              inactive-color="#DCDFE6"
              class="modern-switch"
            />
            <div 
              class="importance-label"
              :class="{ 'active': taskForm.important }"
              @click="taskForm.important = !taskForm.important"
            >
              <el-icon><Star /></el-icon>
              <span>{{ taskForm.important ? '重要任务' : '普通任务' }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showTaskForm = false" class="cancel-button">取消</el-button>
          <el-button type="primary" @click="saveTask" class="save-button">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useTaskStore } from '../stores/task'
import { usePlantStore } from '../stores/plant'
import { ElMessageBox } from 'element-plus'
import { format, parseISO } from 'date-fns'
import { Plus, Clock, Check, Trophy, Edit, Delete, Star } from '@element-plus/icons-vue'

export default {
  name: 'TaskPage',
  components: {
    Plus,
    Clock,
    Check,
    Trophy,
    Edit,
    Delete,
    Star
  },
  setup() {
    const taskStore = useTaskStore()
    const plantStore = usePlantStore()
    
    const showTaskForm = ref(false)
    const editingTask = ref(null)
    
    const taskForm = reactive({
      id: null,
      title: '',
      description: '',
      deadline: '',
      important: false
    })
    
    // 获取任务数据
    onMounted(async () => {
      console.log('任务页面加载')
      // 如果植物商店没有加载，获取植物
      if (!plantStore.currentPlant) {
        await plantStore.fetchPlants()
      }
      
      // 获取任务和系统任务
      try {
      await Promise.all([
        taskStore.fetchTasks(),
        taskStore.fetchSystemTasks()
      ])
        console.log('任务数据加载成功')
      } catch (error) {
        console.error('加载任务数据失败:', error)
      }
    })
    
    // 打开任务表单
    const openTaskForm = () => {
      resetTaskForm()
      showTaskForm.value = true
    }
    
    // 重置表单
    const resetTaskForm = () => {
      taskForm.id = null
      taskForm.title = ''
      taskForm.description = ''
      taskForm.deadline = ''
      taskForm.important = false
      editingTask.value = null
    }
    
    // 完成系统任务
    const completeSystemTask = async (taskId) => {
      // 确保有当前植物
      if (!plantStore.currentPlant) {
        ElMessageBox.alert('请先在花园中添加一个植物', '提示', {
          confirmButtonText: '确定'
        })
        return
      }
      
      // 完成任务
      await taskStore.completeSystemTask(taskId)
    }
    
    // 完成用户任务
    const completeUserTask = async (taskId) => {
      await taskStore.completeTask(taskId)
    }
    
    // 编辑任务
    const editTask = (task) => {
      editingTask.value = task
      taskForm.id = task._id
      taskForm.title = task.title
      taskForm.description = task.description || ''
      taskForm.deadline = task.deadline || ''
      taskForm.important = task.important || false
      showTaskForm.value = true
    }
    
    // 删除任务
    const deleteTask = (taskId) => {
      ElMessageBox.confirm(
        '确定要删除这个任务吗？',
        '删除任务',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        taskStore.removeTask(taskId)
      }).catch(() => {})
    }
    
    // 保存任务
    const saveTask = () => {
      if (!taskForm.title.trim()) {
        ElMessageBox.alert('请输入任务标题', '提示', {
          confirmButtonText: '确定'
        })
        return
      }
      
      if (editingTask.value) {
        // 更新任务
        taskStore.updateTask({
          _id: taskForm.id,
          title: taskForm.title,
          description: taskForm.description,
          deadline: taskForm.deadline,
          important: taskForm.important
        })
      } else {
        // 添加新任务
        taskStore.addTask({
          title: taskForm.title,
          description: taskForm.description,
          deadline: taskForm.deadline,
          important: taskForm.important
        })
      }
      
      showTaskForm.value = false
      resetTaskForm()
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      
      try {
        return format(parseISO(dateString), 'yyyy-MM-dd HH:mm')
      } catch (e) {
        return dateString
      }
    }
    
    return {
      taskStore,
      plantStore,
      showTaskForm,
      taskForm,
      editingTask,
      
      openTaskForm,
      completeSystemTask,
      completeUserTask,
      editTask,
      deleteTask,
      saveTask,
      formatDate
    }
  }
}
</script>

<style scoped>
.task-page {
  padding: 12px;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  margin: 0;
  color: #303133;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  display: block;
  width: 4px;
  height: 18px;
  background: linear-gradient(to bottom, #42b983, #2d9cdb);
  border-radius: 2px;
}

.task-header .section-title {
  font-size: 24px;
}

.task-header .section-title::before {
  height: 24px;
}

.add-task-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 30px;
  border: none;
  background: linear-gradient(135deg, #42b983, #2d9cdb);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 12px rgba(66, 185, 131, 0.25);
}

.add-task-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(66, 185, 131, 0.35);
}

.add-task-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.card {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 12px;
}

.task-count-tag {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  padding: 12px 14px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  border-left: 3px solid #409EFF;
  position: relative;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.task-item.important {
  border-left-color: #F7BA2A;
  background-color: #fffdf7;
}

.task-item.completed {
  background-color: #f7f8fa;
  border-left-color: #909399;
  opacity: 0.85;
}

.system-tasks .task-item {
  border-left-color: #67C23A;
  background-color: #f9fdf9;
}

.task-left {
  display: flex;
  flex: 1;
  align-items: flex-start;
  gap: 10px;
  overflow: hidden;
}

.task-icon {
  font-size: 24px;
  margin-right: 5px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(103, 194, 58, 0.1);
  border-radius: 50%;
  color: #67C23A;
}

.task-checkbox {
  padding: 4px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.task-checkbox:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.task-checkbox :deep(.el-checkbox__inner) {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 2px solid #DCDFE6;
  transition: all 0.2s;
}

.task-checkbox :deep(.el-checkbox__inner::after) {
  height: 9px;
  left: 6px;
  width: 4px;
  border-width: 2px;
}

.task-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
}

.task-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.task-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-description {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 10px;
}

.task-deadline {
  display: flex;
  align-items: center;
  gap: 5px;
}

.empty-tasks {
  padding: 30px 0;
  text-align: center;
}

.completed-at {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
}

.task-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.complete-button {
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.complete-button:hover {
  transform: scale(1.05);
}

/* 对话框和表单样式 */
.modern-dialog {
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modern-form {
  padding: 24px;
}

.form-item-animated {
  margin-bottom: 20px;
  animation: fadeInUp 0.5s ease;
  animation-fill-mode: both;
}

.form-item-animated:nth-child(1) {
  animation-delay: 0.1s;
}

.form-item-animated:nth-child(2) {
  animation-delay: 0.2s;
}

.form-item-animated:nth-child(3) {
  animation-delay: 0.3s;
}

.form-item-animated:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modern-input :deep(.el-input__wrapper),
.modern-textarea :deep(.el-textarea__inner),
.modern-date-picker :deep(.el-input__wrapper) {
  border-radius: 10px;
  border: 1px solid #e0e7ff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: all 0.3s;
}

.modern-input :deep(.el-input__wrapper:hover),
.modern-textarea :deep(.el-textarea__inner:hover),
.modern-date-picker :deep(.el-input__wrapper:hover) {
  border-color: #42b983;
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.1);
}

.modern-input :deep(.el-input__wrapper.is-focus),
.modern-textarea :deep(.el-textarea__inner:focus),
.modern-date-picker :deep(.el-input__wrapper.is-focus) {
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.importance-toggle-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #f9fafc;
  border-radius: 10px;
  border: 1px solid #e0e7ff;
  transition: all 0.3s;
}

.importance-toggle-container:hover {
  background: #f5f7fa;
  border-color: #e0e7ff;
}

.importance-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.importance-label:hover {
  transform: scale(1.05);
}

.importance-label.active {
  color: #F7BA2A;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;
}

.cancel-button,
.save-button {
  padding: 10px 20px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.save-button {
  background: linear-gradient(135deg, #42b983, #2d9cdb);
  border: none;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(66, 185, 131, 0.35);
}

.modern-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #42b983, #2d9cdb);
}

.modern-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 20px;
  font-weight: 500;
}

.modern-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.9);
}

.modern-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #606266;
  padding-bottom: 8px;
}

/* 响应式适配 */
@media screen and (max-width: 768px) {
  .task-page {
    padding: 10px;
  }
  
  .card {
    padding: 15px;
  }
  
  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .task-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-actions {
    margin-top: 10px;
    align-self: flex-end;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style> 