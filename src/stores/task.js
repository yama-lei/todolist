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
      // 确保important是布尔类型
      const importantBool = task.important === true || task.important === 'true'
      
      const response = await taskApi.createTask({
        title: task.title,
        description: task.description || '',
        deadline: task.deadline || '',
        important: importantBool
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
      
      // 确保important是布尔类型
      const importantBool = important === true || important === 'true'
      
      // 保存更新前的任务状态，以便在请求失败时恢复
      const originalTaskIndex = tasks.value.findIndex(t => t._id === _id)
      const originalTask = originalTaskIndex !== -1 ? { ...tasks.value[originalTaskIndex] } : null
      
      // 先更新本地状态，让UI立即响应
      if (originalTaskIndex !== -1) {
        tasks.value[originalTaskIndex] = { 
          ...tasks.value[originalTaskIndex],
          title,
          description,
          deadline,
          important: importantBool
        }
      }
      
      // 然后发送请求更新服务器状态
      const response = await taskApi.updateTask(_id, {
        title,
        description,
        deadline,
        important: importantBool
      })
      
      // 如果服务器响应成功，使用服务器返回的数据更新本地状态
      if (response && response.task) {
        const finalIndex = tasks.value.findIndex(t => t._id === _id)
        if (finalIndex !== -1) {
          tasks.value[finalIndex] = response.task
        }
      }
      
      ElMessage.success('任务已更新')
    } catch (error) {
      console.error('更新任务失败:', error)
      
      // 如果请求失败，恢复原始状态
      const failedIndex = tasks.value.findIndex(t => t._id === updatedTask._id)
      if (failedIndex !== -1 && originalTask) {
        tasks.value[failedIndex] = originalTask
      }
      
      ElMessage.error('更新任务失败')
    }
  }
  
  // 切换任务重要性
  const toggleTaskImportance = async (id) => {
    const task = tasks.value.find(t => t._id === id)
    if (task) {
      try {
        // 先临时更新本地状态，让UI立即响应
        console.log('切换任务重要性 - 当前状态:', task.important, '类型:', typeof task.important)
        
        // 将字符串类型的important转换为布尔类型
        const currentImportant = task.important === true || task.important === 'true'
        const newImportantState = !currentImportant
        console.log('切换任务重要性 - 新状态:', newImportantState)
        
        const taskIndex = tasks.value.findIndex(t => t._id === id)
        if (taskIndex !== -1) {
          // 创建一个任务的副本并修改其重要性
          const updatedTask = { ...tasks.value[taskIndex], important: newImportantState }
          tasks.value[taskIndex] = updatedTask
        }
        
        // 然后发送请求更新服务器状态
        const response = await taskApi.updateTask(id, {
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          important: newImportantState
        })
        
        // 如果服务器响应成功，使用服务器返回的数据更新本地状态
        if (response && response.task) {
          const finalIndex = tasks.value.findIndex(t => t._id === id)
          if (finalIndex !== -1) {
            tasks.value[finalIndex] = response.task
          }
        }
        
        ElMessage.success(`任务已${newImportantState ? '标记为重要' : '取消重要标记'}`)
      } catch (error) {
        console.error('更新任务重要性失败:', error)
        // 如果请求失败，恢复原始状态
        const failedIndex = tasks.value.findIndex(t => t._id === id)
        if (failedIndex !== -1) {
          // 恢复原始状态，注意保持原来的类型
          tasks.value[failedIndex] = { ...tasks.value[failedIndex], important: task.important }
        }
        ElMessage.error('更新任务重要性失败')
      }
    }
  }

  // 重新排序任务
  const reorderTasks = (newOrder) => {
    if (!newOrder || !Array.isArray(newOrder)) return;
    
    // 确保任务的important字段是正确处理的
    const processedOrder = newOrder.map(task => {
      // 处理important字段类型
      const importantBool = task.important === true || task.important === 'true';
      return {
        ...task,
        important: importantBool
      }
    });
    
    // 更新任务顺序
    tasks.value = processedOrder;
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
    toggleTaskImportance,
    reorderTasks
  }
}) 