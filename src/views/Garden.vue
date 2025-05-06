<template>
  <div class="garden-page">
    <div class="garden-background"></div>
    
    <div class="container">
      <div class="garden-header card">
        <h2 class="card-title">花语坊</h2>
        <p class="garden-description">
          在这里，你可以查看和管理你的植物，打造属于自己的花园。
        </p>
        <div class="garden-stats">
          <div class="stats-item plants">
            <span class="stats-icon">🌱</span>
            <span class="stats-value">{{ myPlants.length }}</span>
            <span class="stats-label">植物</span>
          </div>
        </div>
      </div>
      
      <div class="garden-content">
        <div class="my-garden-section card">
          <div class="section-header">
            <h3 class="section-title">未完成的春天</h3>
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
                    <el-tag size="small" type="success" effect="dark">主要植物</el-tag>
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
              </div>
              
              <div class="plant-actions">
                <el-button size="small" type="primary" @click="showDialog(plant)">
                  <span class="button-icon">💬</span>聆听心声
                </el-button>
                <el-button 
                  size="small" 
                  type="success" 
                  plain
                  @click="setAsMainPlant(plant)"
                  :disabled="plant.isMainPlant"
                >
                  <span class="button-icon">⭐</span>设为主植物
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="plant-companionship" v-if="myPlants.length > 0">
            不知不觉中，植物已经陪伴你{{ plantDays }}天了,陪你完成了{{ completedTasksCount }}个任务
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useCurrencyStore } from '../stores/currency'
import { usePlantStore } from '../stores/plant'
import { useTaskStore } from '../stores/task'
import { ElMessage } from 'element-plus'
import WeatherCanvas from '@/components/WeatherCanvas.vue'
import PlantDialog from '@/components/PlantDialog.vue'

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
      const type = plant.type.trim() // 移除可能存在的前后空格
      const level = plant.level || 1
      
      // 检查植物类型和等级限制
      const clamplLevel = Math.min(Math.max(level, 1), 3) // 限制等级在1-3之间
      
      // 根据植物类型返回对应图片
      if (type === '玫瑰') {
        return plantImages['玫瑰'][clamplLevel]
      } else if (type === '仙人掌') {
        return plantImages['仙人掌'][clamplLevel]
      } else if (type === '郁金香') {
        return plantImages['郁金香'][clamplLevel]
      } else if (type === '白百何') {
        return plantImages['白百何'][clamplLevel]
      } else if (type === '向日葵') {
        return plantImages['向日葵'][clamplLevel]
      }
      
      // 默认返回第一张图片
      return plant1Level1
    }
    
    // 所有植物列表 (已解锁)
    const allPlants = reactive([
      { id: 'plant1', name: '绯色絮语', type: '玫瑰', emoji: '🌹', level: 1, experience: 0, weather: 'sunny', isMainPlant: false },
      { id: 'plant2', name: '沙屿星芒', type: '仙人掌', emoji: '🌵', level: 1, experience: 0, weather: 'sunny', isMainPlant: false },
      { id: 'plant3', name: '冰爵士', type: ' 郁金香', emoji: '🌸', level: 1, experience: 0, weather: 'sunny', isMainPlant: false },
      { id: 'plant4', name: '云归处', type: ' 白百何', emoji: '🌲', level: 1, experience: 0, weather: 'sunny', isMainPlant: false },
      { id: 'plant5', name: '日轮礼赞', type: ' 向日葵', emoji: '🌻', level: 1, experience: 0, weather: 'sunny', isMainPlant: false }
    ])
    
    // 加载植物列表
    onMounted(async () => {
      await plantStore.fetchPlants()
      
      // 初始化植物数据
      for (const plant of allPlants) {
        // 检查是否已存在该类型的植物
        const existingPlant = plantStore.plants.find(p => p.type === plant.type)
        if (!existingPlant) {
          try {
            const newPlant = await plantStore.createPlant({
              name: plant.name,
              type: plant.type,
              emoji: plant.emoji,
              isMainPlant: plant.isMainPlant
            })
            console.log('创建新植物成功:', newPlant)
          } catch (error) {
            console.error('创建植物失败:', error)
            ElMessage.error('创建植物失败')
          }
        }
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
      
      await taskStore.fetchTasks()
    })
    
    // 计算植物经验百分比
    const calculatePlantExp = (plant) => {
      const currentExp = plant.experience || 0
      const level = plant.level || 1
      return Math.min(100, (currentExp / (level * 100)) * 100)
    }
    
    // 经验格式化
    const expFormat = (percentage) => {
      if (!selectedPlantForDialog.value) return ''
      const plant = plantStore.plants.find(p => 
        (p._id === selectedPlantForDialog.value._id) || 
        (p.id === selectedPlantForDialog.value.id)
      )
      if (!plant) return ''
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
    
    // 显示植物心声对话框
    const showDialog = async (plant) => {
      // 获取正确的植物ID
      const plantId = plant._id || plant.id
      if (!plantId) {
        console.error('无法显示植物心声: 植物ID无效', plant)
        ElMessage.error('无法显示植物心声：植物ID无效')
        return
      }
      
      selectedPlantForDialog.value = plant
      showPlantThoughtDialog.value = true
      
      // 获取植物心声
      try {
        await plantStore.fetchPlantThoughts(plantId)
      } catch (error) {
        console.error('获取植物心声失败:', error)
        ElMessage.error('获取植物心声失败')
      }
    }
    
    // 生成植物心声
    const generatePlantThought = async (plant) => {
      // 获取正确的植物ID
      const plantId = plant._id || plant.id
      if (!plantId) {
        console.error('无法生成植物心声: 植物ID无效', plant)
        ElMessage.error('生成失败：植物ID无效')
        return
      }
      
      try {
        const context = {
          weather: plant.weather || 'sunny',
          level: plant.level || 1,
          experience: plant.experience || 0,
          growthStage: plant.growthStage || 1
        }
        
        await plantStore.generatePlantThought(plantId, context)
        ElMessage.success('植物心声已生成')
      } catch (error) {
        console.error('生成植物心声失败:', error)
        ElMessage.error(`生成失败: ${error.message || '未知错误'}`)
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
        await plantStore.updatePlant(plantId, { isMainPlant: true })
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
      
      // 方法
      calculatePlantExp,
      expFormat,
      updatePlantWeather,
      showDialog,
      generatePlantThought,
      setAsMainPlant,
      getPlantImage
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
  gap: 8px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.button-icon {
  margin-right: 5px;
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
}
</style> 