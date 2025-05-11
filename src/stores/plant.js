import { defineStore } from 'pinia'
import { plantApi } from '../services/api'
import { ElMessage } from 'element-plus'

export const usePlantStore = defineStore('plant', {
  state: () => ({
    plants: [],
    currentPlant: null,
    loading: false,
      thoughts: [],
    conversations: [],
    hasMoreConversations: false
  }),
  
  actions: {
    // 获取用户所有植物
    async fetchPlants() {
      try {
        this.loading = true
        const response = await plantApi.getPlants()
        this.plants = response.plants
        
        // 如果有主植物，则设置为当前植物
        const mainPlant = this.plants.find(p => p.isMainPlant)
        if (mainPlant) {
          this.currentPlant = mainPlant
        } else if (this.plants.length > 0) {
          // 否则选择第一个植物
          this.currentPlant = this.plants[0]
        }
      } catch (error) {
        ElMessage.error('获取植物列表失败')
      } finally {
        this.loading = false
      }
    },
    
    // 获取特定植物详情
    async fetchPlantDetail(id) {
      try {
        // 检查ID是否有效
        if (!id) {
          console.error('植物ID无效')
          ElMessage.warning('植物ID无效，无法获取植物详情')
          return null
        }
        
        // 获取正确的ID, MongoDB使用_id作为主键
        const plantId = typeof id === 'object' ? id._id : id
        console.log('准备获取植物详情，使用ID:', plantId)
        
        this.loading = true
        const response = await plantApi.getPlant(plantId)
        
        // 更新植物详情
        const index = this.plants.findIndex(p => p.id === plantId || p._id === plantId)
        if (index !== -1) {
          this.plants[index] = response.plant
        }
        
        // 如果是当前植物，更新当前植物
        if (this.currentPlant && (this.currentPlant.id === plantId || this.currentPlant._id === plantId)) {
          this.currentPlant = response.plant
        }
        
        return response.plant
      } catch (error) {
        console.error('获取植物详情失败:', error)
        ElMessage.error('获取植物详情失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 创建新植物
    async createPlant(plantData) {
      try {
        this.loading = true
        const response = await plantApi.createPlant(plantData)
        this.plants.push(response.plant)
        
        // 如果是主植物，更新当前植物
        if (response.plant.isMainPlant) {
          this.currentPlant = response.plant
        }
        
        ElMessage.success('创建植物成功')
        return response.plant
      } catch (error) {
        ElMessage.error('创建植物失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 更新植物信息
    async updatePlant(id, plantData) {
      try {
        // 检查ID是否有效
        if (!id) {
          console.error('植物ID无效')
          ElMessage.warning('植物ID无效，无法更新植物信息')
          return null
        }
        
        // 获取正确的ID, MongoDB使用_id作为主键
        const plantId = typeof id === 'object' ? id._id : id
        console.log('准备更新植物信息，使用ID:', plantId)
        
        this.loading = true
        const response = await plantApi.updatePlant(plantId, plantData)
        
        if (!response || !response.plant) {
          throw new Error('更新植物信息失败：服务器响应无效')
        }
        
        // 更新本地植物信息
        const plant = response.plant
        const index = this.plants.findIndex(p => p.id === plantId || p._id === plantId)
        
        if (index !== -1) {
          // 保留现有属性，只更新修改的字段
          this.plants[index] = {
            ...this.plants[index],
            ...plant,
            // 确保ID字段保持一致
            id: this.plants[index].id,
            _id: this.plants[index]._id
          }
        }
        
        // 如果是当前植物，更新当前植物
        if (this.currentPlant && (this.currentPlant.id === plantId || this.currentPlant._id === plantId)) {
          // 保留现有属性，只更新修改的字段
          this.currentPlant = {
            ...this.currentPlant,
            ...plant,
            // 确保ID字段保持一致
            id: this.currentPlant.id,
            _id: this.currentPlant._id
          }
        }
        
        return plant
      } catch (error) {
        console.error('更新植物信息失败:', error)
        throw error // 向上传递错误，让调用者处理
      } finally {
        this.loading = false
      }
    },
    
    // 删除植物
    async deletePlant(id) {
      try {
        this.loading = true
        const response = await plantApi.deletePlant(id)
        
        // 从植物列表中移除
        this.plants = this.plants.filter(p => p.id !== id)
        
        // 如果删除的是当前植物，重置当前植物
        if (this.currentPlant && this.currentPlant.id === id) {
          this.currentPlant = this.plants.find(p => p.isMainPlant) || this.plants[0] || null
        }
        
        ElMessage.success(response.message || '删除植物成功')
        return true
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '删除植物失败')
        return false
      } finally {
        this.loading = false
      }
    },
    
    // 增加植物经验
    async gainExperience(id, amount) {
      try {
        const response = await plantApi.increaseExperience(id, amount)
        
        // 更新植物信息
        const plant = response.plant
        const index = this.plants.findIndex(p => p.id === id)
        
        if (index !== -1) {
          this.plants[index].level = plant.level
          this.plants[index].experience = plant.experience
          this.plants[index].state = plant.state
          this.plants[index].growthStage = plant.growthStage
        }
        
        // 如果是当前植物，更新当前植物
        if (this.currentPlant && this.currentPlant.id === id) {
          this.currentPlant.level = plant.level
          this.currentPlant.experience = plant.experience
          this.currentPlant.state = plant.state
          this.currentPlant.growthStage = plant.growthStage
        }
        
        // 检查是否升级
        if (response.levelUp) {
          ElMessage.success(`植物升级了！现在等级为 ${plant.level}`)
        }
        
        // 检查是否阶段变化
        if (response.stageChange) {
          ElMessage.success(`植物进入了新的生长阶段: ${this.getGrowthStageName(plant.growthStage)}`)
        }
        
        return response
      } catch (error) {
        ElMessage.error('增加植物经验失败')
        return null
      }
    },
    
    // 更新植物生长阶段
    async updateGrowthStage(id, stage) {
      try {
        // 检查ID是否有效
        if (!id) {
          console.error('植物ID无效')
          ElMessage.warning('植物ID无效，无法更新生长阶段')
          return null
        }
        
        // 获取正确的ID, MongoDB使用_id作为主键
        const plantId = typeof id === 'object' ? id._id : id
        console.log('准备更新植物生长阶段，使用ID:', plantId)
        
        const response = await plantApi.updateGrowthStage(plantId, stage)
        
        // 更新植物信息
        const plant = response.plant
        const index = this.plants.findIndex(p => p.id === plantId || p._id === plantId)
        
        if (index !== -1) {
          this.plants[index].state = plant.state
          this.plants[index].growthStage = plant.growthStage
        }
        
        // 如果是当前植物，更新当前植物
        if (this.currentPlant && (this.currentPlant.id === plantId || this.currentPlant._id === plantId)) {
          this.currentPlant.state = plant.state
          this.currentPlant.growthStage = plant.growthStage
        }
        
        ElMessage.success(response.message || `植物生长阶段已更新为 ${this.getGrowthStageName(stage)}`)
        return response.plant
      } catch (error) {
        console.error('更新植物生长阶段失败:', error)
        ElMessage.error('更新植物生长阶段失败')
        return null
      }
    },
    
    // 获取生长阶段名称
    getGrowthStageName(stage) {
      const stageMap = {
        1: '幼苗期',
        2: '成长期',
        3: '成熟期'
      }
      return stageMap[stage] || '未知阶段'
    },
    
    // 获取植物心声
    async fetchPlantThoughts(id) {
      try {
        // 检查ID是否有效
        if (!id) {
          console.error('植物ID无效')
          ElMessage.warning('植物ID无效，无法获取植物心声')
          return []
        }
        
        // 获取正确的ID, MongoDB使用_id作为主键
        const plantId = typeof id === 'object' ? id._id : id
        console.log('准备获取植物心声，使用ID:', plantId)
        
        this.loading = true
        const response = await plantApi.getPlantThoughts(plantId)
        this.thoughts = response.thoughts
        return response.thoughts
      } catch (error) {
        console.error('获取植物心声失败:', error)
        ElMessage.error('获取植物心声失败')
        return []
      } finally {
        this.loading = false
      }
    },
    
    // 生成新的植物心声
    async generatePlantThought(id, context) {
      try {
        // 检查ID是否有效
        if (!id) {
          console.error('植物ID无效')
          ElMessage.warning('植物ID无效，无法生成植物心声')
          return null
        }
        
        // 获取正确的ID, MongoDB使用_id作为主键
        const plantId = typeof id === 'object' ? id._id : id
        
        console.log('准备生成植物心声，使用ID:', plantId)
        const response = await plantApi.generatePlantThought(plantId, context)
        // 添加到心声列表
        this.thoughts.unshift(response.thought)
        return response.thought
      } catch (error) {
        console.error('生成植物心声失败:', error)
        ElMessage.error('生成植物心声失败')
        return null
      }
    },
    
    // 获取与植物的对话历史
    async fetchConversations(id, limit = 20, before = null) {
      try {
        // 检查ID是否有效
        if (!id) {
          console.error('植物ID无效')
          ElMessage.warning('植物ID无效，无法获取对话历史')
          return []
        }
        
        // 获取正确的ID, MongoDB使用_id作为主键
        const plantId = typeof id === 'object' ? id._id : id
        console.log('准备获取对话历史，使用ID:', plantId)
        
        this.loading = true
        const response = await plantApi.getConversations(plantId, limit, before)
        
        if (before) {
          // 加载更多消息，添加到现有消息列表
          this.conversations = [...this.conversations, ...response.messages]
        } else {
          // 初始加载，替换消息列表
          this.conversations = response.messages
        }
        
        this.hasMoreConversations = response.hasMore
        return response.messages
      } catch (error) {
        console.error('获取对话历史失败:', error)
        ElMessage.error('获取对话历史失败')
        return []
      } finally {
        this.loading = false
      }
    },
    
    // 发送消息给植物并获取回复
    async sendMessage(id, message, skipUserMessage = false) {
      try {
        // 检查ID是否有效
        if (!id) {
          console.error('植物ID无效')
          ElMessage.warning('植物ID无效，无法发送消息')
          return null
        }
        
        // 获取正确的ID, MongoDB使用_id作为主键
        const plantId = typeof id === 'object' ? id._id : id
        console.log('准备发送消息，使用ID:', plantId)
        
        const response = await plantApi.sendMessage(plantId, message, {})
        
        // 只有当skipUserMessage为false时才添加用户消息
        if (!skipUserMessage) {
          const userMessage = {
            id: Date.now().toString(),
            sender: 'user',
            content: message,
            timestamp: new Date().toISOString()
          }
          this.conversations.push(userMessage)
        }
        
        // 添加植物回复到对话列表
        this.conversations.push(response.response)
        
        // 返回植物的回复消息对象，确保有完整的消息属性
        return response.response
      } catch (error) {
        console.error('发送消息失败:', error)
        ElMessage.error('发送消息失败')
        return null
      }
    },
    
    // 清空与植物的对话
    async clearConversations(id) {
      try {
        // 检查ID是否有效
        if (!id) {
          console.error('植物ID无效')
          ElMessage.warning('植物ID无效，无法清空对话')
          return false
        }
        
        // 获取正确的ID, MongoDB使用_id作为主键
        const plantId = typeof id === 'object' ? id._id : id
        console.log('准备清空对话，使用ID:', plantId)
        
        // 调用API清空对话
        await plantApi.clearConversations(plantId)
        
        // 清空本地对话记录
        this.conversations = []
        return true
      } catch (error) {
        console.error('清空对话失败:', error)
        ElMessage.error('清空对话失败')
        return false
      }
    },
    
    // 设置当前植物
    setCurrentPlant(plant) {
      this.currentPlant = plant
    }
  },
  
  getters: {
    // 获取主植物
    mainPlant: (state) => {
      return state.plants.find(p => p.isMainPlant) || (state.plants.length > 0 ? state.plants[0] : null)
    },
    
    // 当前植物等级
    currentLevel: (state) => {
      return state.currentPlant?.level || 1
    },
    
    // 当前植物的下一级所需经验值
    experienceToNextLevel: (state) => {
      if (!state.currentPlant) return 100
      const currentExp = state.currentPlant.experience || 0
      const level = state.currentPlant.level || 1
      return level * 100 - currentExp
    },
    
    // 当前植物经验百分比
    experiencePercentage: (state) => {
      if (!state.currentPlant) return 0
      const currentExp = state.currentPlant.experience || 0
      const level = state.currentPlant.level || 1
      return Math.min(100, (currentExp / (level * 100)) * 100)
    },
    
    // 获取植物图片路径
    getPlantAvatar: (state) => (plant) => {
      if (!plant) return ''
      const state = plant.state || 'seedling'
      const weather = plant.weather || 'sunny'
      const mood = plant.mood || 'neutral'
      
      // 返回不同状态下的图片路径
      return `/images/plant/${state}_${weather}_${mood}.png`
    },
    
    // 获取最近的植物心声
    recentThoughts: (state) => {
      return state.thoughts.slice(0, 5)
    }
  }
}) 