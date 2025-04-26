import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCurrencyStore } from './currency'

export const useTaskStore = defineStore('task', () => {
  // 所有任务数据
  const tasks = ref([
    {
      id: 1,
      title: '完成水培植物App的原型设计',
      description: '设计一个简单的界面，包括植物状态、任务列表等基本功能',
      deadline: '2023-05-15T16:00:00',
      completed: false,
      important: true,
      createdAt: '2023-05-10T09:00:00'
    },
    {
      id: 2,
      title: '完成前端基本框架搭建',
      description: '使用Vue3和Element Plus完成基本框架搭建',
      deadline: '2023-05-16T18:00:00',
      completed: false,
      createdAt: '2023-05-10T10:30:00'
    },
    {
      id: 3,
      title: '实现任务管理基本功能',
      description: '实现添加、完成、删除任务的基本功能',
      deadline: '2023-05-18T14:00:00',
      completed: false,
      createdAt: '2023-05-11T11:00:00'
    }
  ])

  // 系统任务
  const systemTasks = ref([
    {
      id: 's1',
      title: '给植物浇水',
      description: '确保植物有足够的水分',
      completed: false,
      frequency: 'daily',
      icon: '💧'
    },
    {
      id: 's2',
      title: '调整光照',
      description: '确保植物接收到适当的光照',
      completed: false,
      frequency: 'daily',
      icon: '☀️'
    },
    {
      id: 's3',
      title: '添加营养液',
      description: '确保植物有足够的营养',
      completed: false,
      frequency: 'weekly',
      icon: '🧪'
    }
  ])
  
  // 已完成的任务
  const completedTasks = ref([
    {
      id: 'c1',
      title: '准备项目需求文档',
      description: '编写详细的项目需求文档',
      completedAt: '2023-05-09T15:30:00',
      createdAt: '2023-05-07T10:00:00'
    },
    {
      id: 'c2',
      title: '市场调研',
      description: '调研市场上现有的水培植物应用',
      completedAt: '2023-05-08T14:00:00',
      createdAt: '2023-05-06T09:00:00'
    }
  ])

  // 计算属性：待完成任务
  const pendingTasks = computed(() => tasks.value.filter(task => !task.completed))
  
  // 添加任务
  const addTask = (task) => {
    const id = Date.now()
    tasks.value.push({
      id,
      title: task.title,
      description: task.description || '',
      deadline: task.deadline || '',
      completed: false,
      important: task.important || false,
      createdAt: new Date().toISOString()
    })
  }
  
  // 完成任务
  const completeTask = (id) => {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.completed = true
      
      // 将任务移到已完成列表
      const {completed, ...taskWithoutCompleted} = task
      completedTasks.value.unshift({
        ...taskWithoutCompleted,
        completedAt: new Date().toISOString()
      })
      
      // 从待办任务中移除
      tasks.value = tasks.value.filter(t => t.id !== id)
    }
  }
  
  // 完成系统任务
  const completeSystemTask = (id) => {
    const task = systemTasks.value.find(t => t.id === id)
    if (task) {
      task.completed = true
      
      // 如果是每日任务，创建一个计时器，在24小时后重置状态
      if (task.frequency === 'daily') {
        setTimeout(() => {
          task.completed = false
        }, 24 * 60 * 60 * 1000) // 24小时
      }
      
      // 如果是每周任务，创建一个计时器，在7天后重置状态
      if (task.frequency === 'weekly') {
        setTimeout(() => {
          task.completed = false
        }, 7 * 24 * 60 * 60 * 1000) // 7天
      }
    }
  }
  
  // 移除任务
  const removeTask = (id) => {
    tasks.value = tasks.value.filter(task => task.id !== id)
  }
  
  // 删除已完成任务
  const removeCompletedTask = (id) => {
    completedTasks.value = completedTasks.value.filter(task => task.id !== id)
  }
  
  // 更新任务
  const updateTask = (updatedTask) => {
    const index = tasks.value.findIndex(t => t.id === updatedTask.id)
    if (index !== -1) {
      tasks.value[index] = { ...updatedTask }
    }
  }
  
  // 切换任务重要性
  const toggleTaskImportance = (id) => {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.important = !task.important
    }
  }
  
  // 重新排序任务
  const reorderTasks = (newOrder) => {
    tasks.value = tasks.value.map(task => {
      const newTask = newOrder.find(t => t.id === task.id)
      return newTask || task
    })
  }

  return {
    tasks,
    systemTasks,
    completedTasks,
    pendingTasks,
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