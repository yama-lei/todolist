<template>
  <div class="garden-page">
    <div class="garden-background"></div>
    
    <div class="container">
      <div class="garden-header card">
        <h2 class="card-title">花语坊</h2>
        <p class="garden-description">
          在这里，你可以查看和管理你的植物，打造属于自己的花园。
        </p>
      </div>
      
      <div class="garden-content">
        <div class="my-garden-section card">
          <div class="section-header">
            <h3 class="section-title">未完成的春天</h3>
          </div>
          <div class="plant-companionship" v-if="myPlants.length > 0">
            不知不觉中，植物已经陪伴你{{ plantDays }}天了,陪你完成了{{ completedTasksCount }}个任务
          </div>
          <div class="empty-garden" v-if="myPlants.length === 0">
            <el-empty description="你的花园还空空如也~">
              <template #image>
                <div class="empty-image">🏡</div>
              </template>
            </el-empty>
          </div>
          
          <div v-else class="garden-plants-row">
            <div 
              v-for="plant in filteredPlants" 
              :key="plant.id" 
              class="garden-plant-item"
              :class="{ 'is-main-plant': plant.isMainPlant }"
            >
              <div class="plant-avatar">
                <WeatherCanvas :weather="plant.weather || 'sunny'" :width="200" :height="200" />
                <!-- 使用图片替代emoji -->
                <img :src="getPlantImage(plant)" class="plant-image" alt="植物图片" />
              </div>
              
              <div class="plant-details">
                <div class="plant-header">
                  <div class="plant-name">{{ plant.name }}</div>
                  <div v-if="plant.isMainPlant" class="main-plant-badge">
                    <el-tag size="small" type="success" effect="dark">展示植物</el-tag>
                  </div>
                </div>
                
                <div class="plant-level-container">
                  <div class="plant-level">等级: <span class="level-value">{{ plant.level }}</span></div>
                  <el-progress 
                    :percentage="calculatePlantExp(plant)" 
                    :format="expFormat" 
                    :stroke-width="10"
                    class="plant-exp-progress"
                  />
                </div>
                
                <!-- 添加天气选择器 -->
                <div class="plant-weather-selector">
                  <span class="weather-label">环境:</span>
                  <div class="weather-options">
                    <span 
                      class="weather-option" 
                      :class="{ active: plant.weather === 'sunny' || !plant.weather }"
                      title="晴天"
                      @click="updatePlantWeather(plant, 'sunny')"
                    >☀️</span>
                    <span 
                      class="weather-option" 
                      :class="{ active: plant.weather === 'rainy' }"
                      title="下雨"
                      @click="updatePlantWeather(plant, 'rainy')"
                    >🌧️</span>
                    <span 
                      class="weather-option" 
                      :class="{ active: plant.weather === 'cloudy' }"
                      title="多云"
                      @click="updatePlantWeather(plant, 'cloudy')"
                    >☁️</span>
                  </div>
                </div>
                
                <!-- 添加植物心声显示区 -->
                <div class="plant-thought-bubble" 
                  v-if="(plant.id === showingThoughtForPlantId || plant._id === showingThoughtForPlantId) && currentThought">
                  <div class="thought-bubble-pointer"></div>
                  <div class="thought-content">
                    <!-- 已显示的文本 -->
                    <span v-for="(segment, index) in displayedSegments" :key="index" class="message-segment">
                      {{ segment }}
                    </span>
                    <!-- 当前正在打字的文本 -->
                    <span class="typing-segment">{{ currentTypingText }}</span>
                    <!-- 打字指示器 -->
                    <span v-if="isTyping" class="typing-cursor">|</span>
                  </div>
                  <div class="thought-time">{{ formatThoughtTime(currentThought.timestamp) }}</div>
                </div>

                <!-- 添加回植物介绍文本 -->
                <div class="plant-introduction">
                  <div class="intro-title">植物介绍</div>
                  <div class="intro-text">{{ getPlantIntroduction(plant.type) }}</div>
                </div>
              </div>
              
              <div class="plant-actions">
                <button class="custom-btn listen-btn" @click="listenToPlantThought(plant)">
                  <span class="btn-icon">💬</span>
                  <span class="btn-text">聆听心声</span>
                </button>
                <button 
                  class="custom-btn main-btn" 
                  @click="setAsMainPlant(plant)"
                  :disabled="plant.isMainPlant"
                  :class="{ 'disabled': plant.isMainPlant }"
                >
                  <span class="btn-icon">⭐</span>
                  <span class="btn-text">设为展示植物</span>
                </button>
              </div>
            </div>
          </div>
          

        </div>
      </div>
    </div>
    
    <PlantDialog 
      :messages="plantStore.thoughts"
      :is-visible="showPlantThoughtDialog"
      :show-buttons="false"
      @primary-action="showPlantThoughtDialog = false"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { useCurrencyStore } from '../stores/currency'
import { usePlantStore } from '../stores/plant'
import { useTaskStore } from '../stores/task'
import { ElMessage } from 'element-plus'
import WeatherCanvas from '@/components/WeatherCanvas.vue'
import PlantDialog from '@/components/PlantDialog.vue'
import { format, formatDistance } from 'date-fns'
import zhCN from 'date-fns/locale/zh-CN'

// 导入植物图片
import plant1Level1 from '@/assets/images/plant/1-1.png'
import plant1Level2 from '@/assets/images/plant/1-2.png'
import plant1Level3 from '@/assets/images/plant/1-3.png'
import plant2Level1 from '@/assets/images/plant/2-1.png'
import plant2Level2 from '@/assets/images/plant/2-2.png'
import plant2Level3 from '@/assets/images/plant/2-3.png'
import plant3Level1 from '@/assets/images/plant/3-1.png'
import plant3Level2 from '@/assets/images/plant/3-2.png'
import plant3Level3 from '@/assets/images/plant/3-3.png'
import plant4Level1 from '@/assets/images/plant/4-1.png'
import plant4Level2 from '@/assets/images/plant/4-2.png'
import plant4Level3 from '@/assets/images/plant/4-3.png'
import plant5Level1 from '@/assets/images/plant/5-1.png'
import plant5Level2 from '@/assets/images/plant/5-2.png'
import plant5Level3 from '@/assets/images/plant/5-3.png'

export default {
  name: 'GardenPage',
  components: {
    WeatherCanvas,
    PlantDialog
  },
  setup() {
    const currencyStore = useCurrencyStore()
    const plantStore = usePlantStore()
    const taskStore = useTaskStore()
    
    const selectedPlantForDialog = ref(null)
    const showPlantThoughtDialog = ref(false)
    const searchPlant = ref('')
    
    // 植物心声相关变量
    const showingThoughtForPlantId = ref(null)
    const currentThought = ref(null)
    const displayedSegments = ref([])
    const currentTypingText = ref('')
    const isTyping = ref(false)
    const typeInterval = ref(null)
    const typingSpeed = 50 // 打字速度(毫秒/字符)
    const segmentDelay = 1000 // 段落之间的延迟(毫秒)
    
    // 将消息拆分为段落
    const splitMessageIntoSegments = (message) => {
      if (!message) return []
      // 按双换行或单换行分割
      return message.split(/\n\n|\n/).filter(segment => segment.trim() !== '')
    }
    
    // 开始打字效果
    const startTypingEffect = (message) => {
      // 停止任何正在进行的打字效果
      stopTypingEffect()
      
      // 如果消息为空，直接返回
      if (!message) {
        return
      }
      
      try {
        // 重置状态
        displayedSegments.value = []
        currentTypingText.value = ''
        isTyping.value = true
        
        // 将消息拆分为段落
        const segments = splitMessageIntoSegments(message)
        
        // 如果没有段落，显示整个消息
        if (segments.length === 0) {
          displayedSegments.value = [message]
          isTyping.value = false
          return
        }
        
        let currentSegmentIndex = 0
        
        const typeNextSegment = () => {
          if (currentSegmentIndex >= segments.length) {
            // 所有段落都已显示完成
            finishTyping()
            return
          }
          
          const currentSegment = segments[currentSegmentIndex]
          let charIndex = 0
          
          // 清除之前的打字效果定时器
          if (typeInterval.value) clearInterval(typeInterval.value)
          
          // 逐字显示当前段落
          typeInterval.value = setInterval(() => {
            if (charIndex <= currentSegment.length) {
              currentTypingText.value = currentSegment.substring(0, charIndex)
              charIndex++
            } else {
              // 当前段落打字完成
              clearInterval(typeInterval.value)
              
              // 将完成的段落添加到已显示段落数组
              displayedSegments.value.push(currentSegment)
              currentTypingText.value = ''
              
              // 移动到下一段
              currentSegmentIndex++
              
              // 延迟一会儿再显示下一段
              if (currentSegmentIndex < segments.length) {
                setTimeout(typeNextSegment, segmentDelay)
              } else {
                // 所有段落都已显示完成
                finishTyping()
              }
            }
          }, typingSpeed)
        }
        
        // 开始显示第一段
        typeNextSegment()
      } catch (error) {
        console.error('打字效果出错:', error)
        // 发生错误时显示整个消息
        displayedSegments.value = [message]
        isTyping.value = false
      }
    }
    
    // 完成打字效果
    const finishTyping = () => {
      isTyping.value = false
      if (typeInterval.value) {
        clearInterval(typeInterval.value)
        typeInterval.value = null
      }
    }
    
    // 停止打字效果
    const stopTypingEffect = () => {
      isTyping.value = false
      if (typeInterval.value) {
        clearInterval(typeInterval.value)
        typeInterval.value = null
      }
      displayedSegments.value = []
      currentTypingText.value = ''
    }
    
    // 获取当前时间段
    const getTimeOfDay = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) return 'morning'
      if (hour >= 12 && hour < 18) return 'afternoon'
      return 'evening'
    }
    
    // 获取植物介绍文本
    const getPlantIntroduction = (type) => {
      if (!type) return ''
      
      const plantIntros = {
        '向日葵': '向日葵并不关心世界是否在崩溃，她只关心阳光够不够晒到她的脸。她早晨起得比闹钟还早，晚上睡得比月亮还迟。她的梦想很简单——开一场阳光发布会，最好还能有早餐提供。',
        '仙人掌': '没有人真正了解仙人掌。甚至连仙人掌自己也不是很确定，他到底是植物，还是某种硬核的情绪集合体。他喜欢独处，不是因为孤独，而是因为社交时要说"你好"太麻烦。',
        '郁金香': '"优雅"两个字，如果有具象化，那一定是郁金香——当然，是他自己说的。他不屑于参加普通植物的舞会，只在严寒的午夜出场，然后一言不发地……香了一下。',
        '白百合': '她不是安静，她是带着回声的沉默。白百合总是在别人崩溃边缘时，递上一句"要不要喝点热水？"她喜欢站在风里发呆，说那样能听见遥远星系的心跳——虽然其他植物觉得那是空气流通的声音。',
        '白百何': '她不是安静，她是带着回声的沉默。白百合总是在别人崩溃边缘时，递上一句"要不要喝点热水？"她喜欢站在风里发呆，说那样能听见遥远星系的心跳——虽然其他植物觉得那是空气流通的声音。',
        '玫瑰': '她总是自带BGM登场，哪怕背景是一片荒芜草地，她也能走出红毯既视感。玫瑰没兴趣当墙角里的盆栽，她要做花园的女主角，还是自编自导自演的那种。'
      }
      
      return plantIntros[type.trim()] || ''
    }
    
    // 在组件销毁时清除定时器
    onUnmounted(() => {
      stopTypingEffect()
    })
    
    // 植物图片映射
    const plantImages = {
      '玫瑰': {
        1: plant1Level1,
        2: plant1Level2,
        3: plant1Level3
      },
      '仙人掌': {
        1: plant2Level1,
        2: plant2Level2,
        3: plant2Level3
      },
      '郁金香': {
        1: plant3Level1,
        2: plant3Level2,
        3: plant3Level3
      },
      '白百何': {
        1: plant4Level1,
        2: plant4Level2,
        3: plant4Level3
      },
      '向日葵': {
        1: plant5Level1,
        2: plant5Level2,
        3: plant5Level3
      }
    }
    
    // 获取植物图片
    const getPlantImage = (plant) => {
      if (!plant || !plant.type) {
        return plant1Level1 // 返回默认图片
      }

      const type = plant.type.trim() // 移除可能存在的前后空格
      const level = plant.level || 1
      
      // 检查植物类型和等级限制
      const clampLevel = Math.min(Math.max(level, 1), 3) // 限制等级在1-3之间
      
      // 根据植物类型返回对应图片
      const plantTypeImages = plantImages[type]
      if (!plantTypeImages) {
        return plant1Level1 // 如果找不到对应类型的图片，返回默认图片
      }

      return plantTypeImages[clampLevel] || plant1Level1 // 如果找不到对应等级的图片，返回默认图片
    }
    
    // 加载植物列表
    onMounted(async () => {
      // 只有当植物列表为空时才重新获取，避免重复请求
      if (plantStore.plants.length === 0) {
        await plantStore.fetchPlants()
      }
      
      // 如果没有主植物，将第一个设为主植物
      const mainPlant = plantStore.plants.find(p => p.isMainPlant)
      if (!mainPlant && plantStore.plants.length > 0) {
        const firstPlant = plantStore.plants[0]
        const plantId = firstPlant._id || firstPlant.id
        if (plantId) {
          try {
            await plantStore.updatePlant(plantId, { isMainPlant: true })
            console.log('设置主植物成功:', firstPlant.name)
          } catch (error) {
            console.error('设置主植物失败:', error)
            ElMessage.error('设置主植物失败')
          }
        }
      }
      
      // 只有当任务列表为空时才重新获取
      if (taskStore.completedTasks.length === 0) {
        await taskStore.fetchTasks()
      }
    })
    
    // 计算植物经验百分比
    const calculatePlantExp = (plant) => {
      const currentExp = plant.experience || 0
      const level = plant.level || 1
      return Math.min(100, (currentExp / (level * 100)) * 100)
    }
    
    // 经验格式化
    const expFormat = (percentage) => {
      // 修复：通过percentage可以找到对应的植物，不需要依赖selectedPlantForDialog
      // 在进度条中显示时，会传入当前实际的percentage
      const plant = plantStore.plants.find(p => 
        calculatePlantExp(p) === percentage
      )
      
      // 如果找不到匹配的植物，返回百分比
      if (!plant) {
        // 回退到通过selectedPlantForDialog查找植物
        if (selectedPlantForDialog.value) {
          const fallbackPlant = plantStore.plants.find(p => 
            (p._id === selectedPlantForDialog.value._id) || 
            (p.id === selectedPlantForDialog.value.id)
          )
          if (fallbackPlant) {
            const currentExp = fallbackPlant.experience || 0
            const level = fallbackPlant.level || 1
            const nextLevelExp = level * 100
            return `${currentExp}/${nextLevelExp}`
          }
        }
        return `${Math.round(percentage)}%`
      }
      
      const currentExp = plant.experience || 0
      const level = plant.level || 1
      const nextLevelExp = level * 100
      return `${currentExp}/${nextLevelExp}`
    }
    
    // 更新植物天气
    const updatePlantWeather = async (plant, weather) => {
      if (plant.weather === weather) return
      
      // 获取正确的植物ID
      const plantId = plant._id || plant.id
      if (!plantId) {
        console.error('无法更新植物天气: 植物ID无效', plant)
        ElMessage.error('更新失败：无法获取植物ID')
        return
      }
      
      console.log('更新植物天气，植物ID:', plantId, '天气:', weather)
      try {
        await plantStore.updatePlant(plantId, { weather })
        ElMessage.success('植物环境已更新')
      } catch (error) {
        console.error('更新植物天气失败:', error)
        ElMessage.error(`更新失败: ${error.message || '未知错误'}`)
      }
    }
    
    // 格式化心声时间为相对时间
    const formatThoughtTime = (dateString) => {
      if (!dateString) return ''
      
      try {
        return formatDistance(new Date(dateString), new Date(), {
          addSuffix: true,
          locale: zhCN
        })
      } catch (error) {
        console.error('格式化日期失败:', error)
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
      }
    }
    
    // 显示植物心声对话框
    const showDialog = async (plant) => {
      // 获取正确的植物ID
      const plantId = plant._id || plant.id
      if (!plantId) {
        console.error('无法显示植物心声: 植物ID无效', plant)
        ElMessage.error('无法显示植物心声：植物ID无效')
        return
      }
      
      try {
        // 设置当前选中的植物，并展示心声对话框
        selectedPlantForDialog.value = plant
        showPlantThoughtDialog.value = true
        
        // 获取植物心声
        const thoughts = await plantStore.fetchPlantThoughts(plantId)
        // 将植物心声转换为消息格式
        plantStore.thoughts = thoughts.map(thought => ({
          type: 'plant',
          content: thought.content,
          timestamp: thought.timestamp
        }))
      } catch (error) {
        console.error('获取植物心声失败:', error)
        ElMessage.error('获取植物心声失败')
      }
    }
    
    // 生成植物心声的方法，用于点击"聆听心声"时调用
    const listenToPlantThought = async (plant) => {
      // 获取正确的植物ID
      const plantId = plant._id || plant.id
      if (!plantId) {
        console.error('无法获取植物心声: 植物ID无效', plant)
        ElMessage.error('无法获取植物心声：植物ID无效')
        return
      }
      
      try {
        // 设置正在显示心声的植物ID
        showingThoughtForPlantId.value = plantId
        
        // 获取或生成一条植物心声
        const context = {
          weather: plant.weather || 'sunny',
          timeOfDay: getTimeOfDay(),
          recentTasks: taskStore.completedTasks.slice(0, 3).map(task => ({
            id: task._id || task.id,
            title: task.title,
            completed: true
          }))
        }
        
        const newThought = await plantStore.generatePlantThought(plantId, context)
        
        if (newThought) {
          // 更新当前心声
          currentThought.value = newThought
          
          // 开始打字效果
          startTypingEffect(newThought.content)
          
          ElMessage({
            message: '植物想和你说话了！',
            type: 'success'
          })
          
          // 延长植物心声显示时间
          setTimeout(() => {
            if (showingThoughtForPlantId.value === plantId) {
              showingThoughtForPlantId.value = null
              stopTypingEffect()
            }
          }, 15000) // 15秒后自动关闭
        } else {
          ElMessage.warning('植物似乎不想说话...')
        }
      } catch (error) {
        console.error('获取植物心声失败', error)
        ElMessage.error('获取植物心声失败')
      }
    }
    
    // 设置主植物
    const setAsMainPlant = async (plant) => {
      if (plant.isMainPlant) return
      
      // 获取正确的植物ID
      const plantId = plant._id || plant.id
      if (!plantId) {
        console.error('无法设置主植物: 植物ID无效', plant)
        ElMessage.error('设置失败：无法获取植物ID')
        return
      }
      
      console.log('设置主植物，植物ID:', plantId)
      try {
        // 先将所有植物的主植物状态设置为false
        for (const p of plantStore.plants) {
          if (p.isMainPlant) {
            const prevMainPlantId = p._id || p.id
            await plantStore.updatePlant(prevMainPlantId, { isMainPlant: false })
          }
        }
        
        // 设置新的主植物
        await plantStore.updatePlant(plantId, { isMainPlant: true })
        
        // 更新植物心声
        await plantStore.fetchPlantThoughts(plantId)
        
        // 如果当前正在显示植物心声对话框，更新选中的植物
        if (showPlantThoughtDialog.value) {
          selectedPlantForDialog.value = plant
        }
        
        ElMessage.success('已设置为主植物')
      } catch (error) {
        console.error('设置主植物失败:', error)
        ElMessage.error(`设置失败: ${error.message || '未知错误'}`)
      }
    }
    
    // 过滤后的植物列表
    const filteredPlants = computed(() => {
      if (!searchPlant.value) return plantStore.plants
      
      const search = searchPlant.value.toLowerCase()
      return plantStore.plants.filter(plant => 
        plant.name.toLowerCase().includes(search)
      )
    })
    
    // 计算植物陪伴的天数
    const plantDays = computed(() => {
      if (plantStore.plants.length === 0) return 0
      
      // 使用第一个植物的创建时间计算
      const firstPlant = plantStore.plants[0]
      if (!firstPlant || !firstPlant.createdAt) return 0
      
      const createdDate = new Date(firstPlant.createdAt)
      const today = new Date()
      const diffTime = Math.abs(today - createdDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays
    })
    
    // 获取完成的任务数量
    const completedTasksCount = computed(() => {
      return taskStore.completedTasks.length
    })
    
    // 监听主植物的变化
    watch(() => plantStore.plants.find(p => p.isMainPlant), async (newMainPlant) => {
      if (newMainPlant) {
        // 更新选中的植物
        selectedPlantForDialog.value = newMainPlant
        
        // 更新植物心声
        const plantId = newMainPlant._id || newMainPlant.id
        if (plantId) {
          try {
            const thoughts = await plantStore.fetchPlantThoughts(plantId)
            
            // 保存最新的一条心声用于显示在花园中
            if (thoughts && thoughts.length > 0) {
              currentThought.value = thoughts[0]
            }
            
            // 如果对话框是打开的，更新植物心声列表
            if (showPlantThoughtDialog.value) {
              plantStore.thoughts = thoughts.map(thought => ({
                type: 'plant',
                content: thought.content,
                timestamp: thought.timestamp
              }))
            }
          } catch (error) {
            console.error('更新植物心声失败:', error)
            ElMessage.error('更新植物心声失败')
          }
        }
      } else {
        currentThought.value = null
      }
    }, { immediate: true })
    
    return {
      currencyStore,
      plantStore,
      taskStore,
      selectedPlantForDialog,
      showPlantThoughtDialog,
      searchPlant,
      myPlants: computed(() => plantStore.plants),
      filteredPlants,
      plantDays,
      completedTasksCount,
      
      // 打字机效果相关
      showingThoughtForPlantId,
      currentThought,
      displayedSegments,
      currentTypingText,
      isTyping,
      
      // 方法
      calculatePlantExp,
      expFormat,
      updatePlantWeather,
      showDialog,
      listenToPlantThought,
      setAsMainPlant,
      getPlantImage,
      formatThoughtTime,
      getPlantIntroduction,
      startTypingEffect,
      stopTypingEffect
    }
  }
}
</script>

<style scoped>
.garden-page {
  position: relative;
  min-height: 100vh;
  padding: 30px 0;
}

.garden-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6ffed 100%);
  z-index: -1;
  opacity: 0.6;
}

.garden-header {
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(to right, #ebfaef, #e6f3ff);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  padding: 25px;
}

.garden-header::before {
  content: '';
  position: absolute;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0) 70%);
  top: -30px;
  right: -30px;
  border-radius: 50%;
}

.card-title {
  font-size: 28px;
  color: #2e7d32;
  margin-bottom: 10px;
  position: relative;
}

.garden-description {
  color: #666;
  margin-top: 10px;
  font-size: 16px;
  max-width: 80%;
  line-height: 1.6;
}

.garden-stats {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  padding: 12px 20px;
  border-radius: 12px;
  min-width: 80px;
}

.stats-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.stats-value {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
}

.stats-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 3px;
}

.garden-content {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  margin-bottom: 10px;
  font-size: 22px;
  color: #2e7d32;
  position: relative;
  padding-left: 15px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 20px;
  background-color: #4caf50;
  border-radius: 3px;
}

.my-garden-section {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  background-color: white;
  overflow: hidden;
  transition: transform 0.3s;
  padding: 25px;
}

.my-garden-section:hover {
  transform: translateY(-5px);
}

.search-input {
  max-width: 200px;
}

.garden-plants-row {
  display: flex;
  overflow-x: auto;
  padding: 15px 0;
  gap: 20px;
  scrollbar-width: thin;
  margin-top: 20px;
}

.garden-plants-row::-webkit-scrollbar {
  height: 8px;
}

.garden-plants-row::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.garden-plants-row::-webkit-scrollbar-thumb {
  background: #c1e1c5;
  border-radius: 10px;
}

.garden-plants-row::-webkit-scrollbar-thumb:hover {
  background: #4caf50;
}

.garden-plant-item {
  min-width: 220px;
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
  position: relative;
  overflow: hidden;
}

.garden-plant-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.garden-plant-item.is-main-plant {
  border: 2px solid #4caf50;
  background: linear-gradient(to bottom, #f5fff7, white);
}

.garden-plant-item.is-main-plant::after {
  content: '⭐';
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 20px;
  color: #ffc107;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.plant-avatar {
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

/* 植物图片样式 */
.plant-image {
  width: 90%;
  height: 90%;
  object-fit: contain;
  z-index: 3;
  position: relative;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.plant-details {
  width: 100%;
  margin-bottom: 15px;
}

.plant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.plant-name {
  font-weight: bold;
  font-size: 18px;
  color: #333;
}

.main-plant-badge {
  margin-bottom: 5px;
}

.plant-level-container {
  margin-bottom: 15px;
}

.plant-level {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.level-value {
  font-weight: bold;
  color: #4caf50;
}

.plant-exp-progress :deep(.el-progress-bar__outer) {
  border-radius: 10px;
  background-color: #f0f0f0;
}

.plant-exp-progress :deep(.el-progress-bar__inner) {
  border-radius: 10px;
  background: linear-gradient(90deg, #81c784, #4caf50);
}

.plant-weather-selector {
  display: flex;
  align-items: center;
  margin-top: 15px;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-radius: 12px;
}

.weather-label {
  margin-right: 10px;
  font-size: 14px;
  color: #666;
}

.weather-options {
  display: flex;
  gap: 15px;
}

.weather-option {
  font-size: 22px;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.3s;
  filter: grayscale(0.6);
}

.weather-option:hover {
  transform: scale(1.2);
  opacity: 0.8;
  filter: grayscale(0);
}

.weather-option.active {
  opacity: 1;
  transform: scale(1.2);
  filter: grayscale(0);
}

.plant-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
  padding: 0 10px;
}

.empty-garden {
  padding: 40px 0;
  text-align: center;
}

.empty-image {
  font-size: 60px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

.plant-companionship {
  text-align: center;
  margin-top: 30px;
  padding: 15px;
  background: linear-gradient(to right, rgba(236, 253, 245, 0.8), rgba(229, 246, 253, 0.8));
  border-radius: 12px;
  font-size: 16px;
  color: #2e7d32;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  position: relative;
  border-left: 4px solid #4caf50;
}

.plant-companionship::before {
  content: '🌱';
  font-size: 18px;
  margin-right: 8px;
}

/* 媒体查询响应式样式 */
@media screen and (max-width: 768px) {
  .garden-plants-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .garden-plant-item {
    min-width: auto;
    width: 100%;
  }
  
  .plant-avatar {
    width: 140px;
    height: 140px;
  }
  
  .plant-image {
    width: 80%;
    height: 80%;
  }
  
  .plant-actions {
    flex-direction: column;
  }
  
  .plant-companionship {
    font-size: 14px;
    padding: 12px;
  }
  
  .plant-thought-bubble {
    padding: 12px;
    margin-top: 10px;
  }
  
  .thought-content {
    font-size: 13px;
  }
  
  .custom-btn {
    padding: 8px 12px;
  }
  
  .plant-introduction {
    padding: 10px;
  }
  
  .intro-text {
    font-size: 12px;
  }
}

/* 自定义按钮样式 */
.custom-btn {
  border: none;
  padding: 10px 16px;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  width: 90%;
  margin: 0 auto 10px;
  letter-spacing: 0.5px;
}

.custom-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.custom-btn:active {
  transform: translateY(-1px);
}

.custom-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.4), rgba(255,255,255,0.1));
  transition: all 0.5s ease;
}

.custom-btn:hover::before {
  left: 100%;
}

.listen-btn {
  background: linear-gradient(135deg, #7ed6a5 0%, #5bc189 100%);
  color: #ffffff;
  border: 1px solid transparent;
  position: relative;
  z-index: 1;
}

.listen-btn:hover {
  background: linear-gradient(135deg, #8cdeb0 0%, #65ca94 100%);
}

.listen-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, #7ed6a5 0%, #5bc189 100%);
  z-index: -1;
  transition: opacity 0.3s ease;
  border-radius: 16px;
}

.main-btn {
  background: linear-gradient(135deg, #ffe082 0%, #ffd54f 100%);
  color: #7d6226;
  border: 1px solid transparent;
  position: relative;
  z-index: 1;
}

.main-btn:hover {
  background: linear-gradient(135deg, #ffecb3 0%, #ffe082 100%);
}

.main-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, #ffe082 0%, #ffd54f 100%);
  z-index: -1;
  transition: opacity 0.3s ease;
  border-radius: 16px;
}

.main-btn.disabled {
  background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
  color: #757575;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  opacity: 0.7;
}

.main-btn.disabled::before,
.main-btn.disabled::after {
  display: none;
}

.btn-icon {
  margin-right: 6px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-text {
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* 植物心声气泡样式调整 */
.plant-thought-bubble {
  margin-top: 15px;
  padding: 15px;
  background: linear-gradient(to right, #f0f8ff, #f5fff7);
  border-radius: 18px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-width: 100%;
  animation: pulse 3s ease-in-out infinite, bubble-appear 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  min-height: 60px;
}

@keyframes bubble-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
  }
  70% {
    transform: scale(1.05) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes pulse {
  0% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
  50% { box-shadow: 0 6px 18px rgba(66, 185, 131, 0.15); }
  100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
}

.thought-bubble-pointer {
  position: absolute;
  top: -12px;
  left: 25px;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #f0f8ff, #f5fff7);
  transform: rotate(45deg);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.thought-content {
  font-size: 14px;
  line-height: 1.6;
  color: #2e7d32;
  font-style: italic;
  position: relative;
  z-index: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.thought-content::before {
  content: '"';
  font-size: 24px;
  color: #42b983;
  margin-right: 2px;
  vertical-align: sub;
}

.thought-content::after {
  content: '"';
  font-size: 24px;
  color: #42b983;
  margin-left: 2px;
  vertical-align: middle;
}

.thought-time {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: right;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: #666;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.message-segment {
  display: block;
  margin-bottom: 0.5em;
}

.typing-segment {
  display: inline;
}

/* 植物介绍样式 */
.plant-introduction {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border-left: 3px solid #42b983;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 150px;
  overflow-y: auto;
  position: relative;
  transition: all 0.3s ease;
}

.plant-introduction:hover {
  background-color: #f0f7f4;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.15);
  border-left: 3px solid #35a873;
}

.plant-introduction::-webkit-scrollbar {
  width: 4px;
}

.plant-introduction::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.plant-introduction::-webkit-scrollbar-thumb {
  background: #c1e1c5;
  border-radius: 4px;
}

.plant-introduction::-webkit-scrollbar-thumb:hover {
  background: #42b983;
}

.intro-title {
  font-size: 14px;
  font-weight: 600;
  color: #42b983;
  margin-bottom: 8px;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
}

.intro-title::before {
  content: '🌿';
  margin-right: 6px;
  font-size: 16px;
}

.intro-text {
  font-size: 13px;
  line-height: 1.6;
  color: #555;
  font-style: italic;
  text-align: justify;
}
</style> 