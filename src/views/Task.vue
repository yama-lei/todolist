<template>
  <div class="task-page">
    <div class="container">
      <div class="task-header">
        <h1>任务管理</h1>
        <div class="task-actions">
          <el-button type="primary" @click="openTaskForm">
            <el-icon><Plus /></el-icon> 新建任务
          </el-button>
        </div>
      </div>
      
      <!-- 系统任务 -->
      <div class="system-tasks-card card">
        <div class="card-header">
          <h2>每日任务</h2>
          <div class="task-info">
            完成任务可以获得经验值，帮助植物成长
          </div>
        </div>
        
        <div class="tasks-list system-tasks">
          <div
            v-for="task in taskStore.systemTasks"
            :key="task._id"
            class="task-item"
            :class="{ 'completed': task.completed }"
          >
            <div class="task-icon">{{ task.icon }}</div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-description">{{ task.description }}</div>
            </div>
            <div class="task-actions">
              <el-button
                :type="task.completed ? 'success' : 'primary'"
                :disabled="task.completed"
                @click="completeSystemTask(task._id)"
              >
                {{ task.completed ? '已完成' : '完成' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 用户任务 -->
      <div class="user-tasks-card card">
        <div class="card-header">
          <h2>我的任务</h2>
          <div class="task-status">
            <span>{{ taskStore.pendingTasks.length }} 个待完成</span>
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
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-description">{{ task.description }}</div>
              <div class="task-meta">
                <span v-if="task.deadline" class="task-deadline">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(task.deadline) }}
                </span>
              </div>
            </div>
            <div class="task-actions">
              <el-button-group>
                <el-button
                  type="primary"
                  @click="completeUserTask(task._id)"
                >
                  完成
                </el-button>
                <el-button
                  type="default"
                  @click="editTask(task)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  @click="deleteTask(task._id)"
                >
                  删除
                </el-button>
              </el-button-group>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 已完成任务 -->
      <div class="completed-tasks-card card" v-if="taskStore.completedTasks.length > 0">
        <div class="card-header">
          <h2>已完成任务</h2>
          <div class="completed-count">
            {{ taskStore.completedTasks.length }} 个任务
          </div>
        </div>
        
        <div class="tasks-list completed-tasks">
          <div
            v-for="task in taskStore.completedTasks"
            :key="task._id"
            class="task-item completed"
          >
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
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
    
    <!-- 任务表单对话框 -->
    <el-dialog
      v-model="showTaskForm"
      :title="editingTask ? '编辑任务' : '新建任务'"
      width="500px"
    >
      <el-form :model="taskForm" label-position="top">
        <el-form-item label="任务标题" required>
          <el-input v-model="taskForm.title" placeholder="输入任务标题" />
        </el-form-item>
        
        <el-form-item label="任务描述">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="输入任务描述"
          />
        </el-form-item>
        
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="taskForm.deadline"
            type="datetime"
            placeholder="选择截止日期"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="taskForm.important">标记为重要</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTaskForm = false">取消</el-button>
          <el-button type="primary" @click="saveTask">
            保存
          </el-button>
        </span>
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
import { Plus, Clock } from '@element-plus/icons-vue'

export default {
  name: 'TaskPage',
  components: {
    Plus,
    Clock
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
  height: 100%;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: all 0.3s;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.task-item.important {
  border-left: 4px solid var(--el-color-danger);
}

.task-item.completed {
  opacity: 0.7;
  background-color: #f5f7fa;
}

.task-icon {
  font-size: 24px;
  margin-right: 15px;
}

.task-content {
  flex: 1;
}

.task-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.task-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.task-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.task-deadline {
  display: flex;
  align-items: center;
  gap: 5px;
}

.empty-tasks {
  padding: 30px 0;
}

.system-tasks .task-item {
  background-color: rgba(var(--el-color-primary-rgb), 0.05);
}

.completed-tasks .task-item {
  padding: 12px 15px;
}

@media (max-width: 768px) {
  .task-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-actions {
    margin-top: 10px;
    align-self: flex-end;
  }
}
</style> 