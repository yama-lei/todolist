import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePlantStore } from './plant'
import { taskApi } from '../services/api'
import { ElMessage } from 'element-plus'

export const useTaskStore = defineStore('task', () => {
  // 所有任务数据
  const tasks = ref([])
  const systemTasks = ref([])
  const completedTasks = ref([])
  const loading = ref(false)
  
  // 计算属性：待完成任务
  const pendingTasks = computed(() => tasks.value.filter(task => !task.completed))
  
  // 获取所有任务
  const fetchTasks = async () => {
    try {
      loading.value = true
      const response = await taskApi.getTasks()
      tasks.value = response.tasks.filter(task => !task.completed)
      completedTasks.value = response.tasks.filter(task => task.completed)
    } catch (error) {
      ElMessage.error('获取任务列表失败')
    } finally {
      loading.value = false
    }
  }
  
  // 获取系统任务
  const fetchSystemTasks = async () => {
    try {
      loading.value = true
      const response = await taskApi.getSystemTasks()
      systemTasks.value = response.tasks
    } catch (error) {
      ElMessage.error('获取系统任务失败')
    } finally {
      loading.value = false
    }
  }
  
  // 添加任务
  const addTask = async (task) => {
    try {
      const response = await taskApi.createTask({
        title: task.title,
        description: task.description || '',
        deadline: task.deadline || '',
        important: task.important || false
      })
      
      // 添加到本地状态
      tasks.value.push(response.task)
      
      // 不再给创建任务增加经验值
      ElMessage.success('任务创建成功')
    } catch (error) {
      ElMessage.error('创建任务失败')
    }
  }
  
  // 完成任务
  const completeTask = async (id) => {
    try {
      const response = await taskApi.completeTask(id)
      
      // 从任务列表中移除
      const task = tasks.value.find(t => t._id === id)
      if (task) {
        // 将任务移动到已完成列表
        completedTasks.value.unshift({
          ...task,
          completed: true,
          completedAt: new Date().toISOString()
        })
        // 从待办任务中移除
        tasks.value = tasks.value.filter(t => t._id !== id)
      }
      
      // 增加植物经验值
      const plantStore = usePlantStore()
      if (plantStore.plants && plantStore.plants.length > 0) {
        // 获取主植物
        const mainPlant = plantStore.plants.find(p => p.isMainPlant)
        if (mainPlant) {
          const plantId = mainPlant._id || mainPlant.id
          if (plantId) {
            // 根据任务是否重要，增加不同的经验值
            // 普通任务25点，重要任务50点
            const expAmount = task && task.important ? 50 : 25;
            await plantStore.gainExperience(plantId, expAmount)
            
            // 显示具体获得的经验值
            ElMessage.success(`任务已完成，获得 ${expAmount} 点经验值！`)
          }
        }
      } else {
        ElMessage.success('任务已完成')
      }
    } catch (error) {
      ElMessage.error('完成任务失败')
    }
  }
  
  // 完成系统任务
  const completeSystemTask = async (id) => {
    try {
      const plantStore = usePlantStore()
      if (!plantStore.currentPlant) {
        ElMessage.warning('请先添加一个植物')
        return false
      }
      
      const response = await taskApi.completeSystemTask(id)
      
      // 更新任务状态
      const index = systemTasks.value.findIndex(t => t._id === id)
      if (index !== -1) {
        systemTasks.value[index].completed = true
      }
      
      // 如果后端已经处理了经验值奖励，则显示相应的提示
      if (response.rewards) {
        ElMessage.success(`完成任务获得 ${response.rewards.experience} 点经验`)
      } 
      // 如果后端没有处理经验值奖励，则在前端处理
      else {
        // 获取主植物
        const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
        if (plantId) {
          // 系统任务固定增加35点经验值
          const expAmount = 35;
          await plantStore.gainExperience(plantId, expAmount)
          ElMessage.success(`完成系统任务获得 ${expAmount} 点经验值`)
        }
      }
      
      return true
    } catch (error) {
      if (error.response?.status === 400) {
        ElMessage.warning('今天已经完成过此任务')
      } else {
        ElMessage.error('完成系统任务失败')
      }
      return false
    }
  }
  
  // 移除任务
  const removeTask = async (id) => {
    try {
      // 检查ID是否有效
      if (!id) {
        ElMessage.error('任务ID无效，无法删除')
        return
      }
      
      await taskApi.deleteTask(id)
      tasks.value = tasks.value.filter(task => task._id !== id)
      ElMessage.success('任务已删除')
    } catch (error) {
      console.error('删除任务失败:', error)
      ElMessage.error('删除任务失败')
    }
  }
  
  // 删除已完成任务
  const removeCompletedTask = async (id) => {
    try {
      // 检查ID是否有效
      if (!id) {
        ElMessage.error('任务ID无效，无法删除')
        return
      }
      
      await taskApi.deleteTask(id)
      completedTasks.value = completedTasks.value.filter(task => task._id !== id)
      ElMessage.success('任务已删除')
    } catch (error) {
      console.error('删除任务失败:', error)
      ElMessage.error('删除任务失败')
    }
  }
  
  // 更新任务
  const updateTask = async (updatedTask) => {
    try {
      const { _id, title, description, deadline, important } = updatedTask
      
      const response = await taskApi.updateTask(_id, {
        title,
        description,
        deadline,
        important
      })
      
      // 更新本地状态
      const index = tasks.value.findIndex(t => t._id === _id)
      if (index !== -1) {
        tasks.value[index] = response.task
      }
      
      ElMessage.success('任务已更新')
    } catch (error) {
      ElMessage.error('更新任务失败')
    }
  }
  
  // 切换任务重要性
  const toggleTaskImportance = async (id) => {
    const task = tasks.value.find(t => t._id === id)
    if (task) {
      await updateTask({
        ...task,
        important: !task.important
      })
    }
  }

  return {
    tasks,
    systemTasks,
    completedTasks,
    pendingTasks,
    loading,
    
    fetchTasks,
    fetchSystemTasks,
    addTask,
    completeTask,
    completeSystemTask,
    removeTask,
    removeCompletedTask,
    updateTask,
    toggleTaskImportance
  }
}) 