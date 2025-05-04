<template>
  <div class="garden-page">
    <div class="container">
      <div class="garden-header card">
        <h2 class="card-title">我的后花园</h2>
        <p class="garden-description">
          在这里，你可以选择和购买各种植物，打造属于自己的花园。
        </p>
      </div>
      
      <div class="garden-content">
        <el-row :gutter="20">
          <el-col :sm="24" :md="8">
            <div class="shop-section card">
              <h3 class="section-title">植物商店</h3>
              <p class="section-description">使用你的金币购买新植物和肥料</p>
              
              <div class="shop-balance">
                <span class="coin-icon">🪙</span>
                <span class="coin-amount">{{ currencyStore.coins }}</span>
              </div>
              
              <el-tabs v-model="activeShopTab">
                <el-tab-pane label="植物" name="plants">
                  <div class="shop-items">
                    <div v-for="plant in shopPlants" :key="plant.id" class="shop-item">
                      <div class="item-image">{{ plant.emoji }}</div>
                      <div class="item-info">
                        <div class="item-name">{{ plant.name }}</div>
                        <div class="item-price">
                          <span class="coin-icon">🪙</span>
                          <span>{{ plant.price }}</span>
                        </div>
                      </div>
                      <el-button 
                        type="primary" 
                        size="small" 
                        :disabled="currencyStore.coins < plant.price"
                        @click="buyPlant(plant)"
                      >
                        购买
                      </el-button>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="肥料" name="fertilizers">
                  <div class="shop-items">
                    <div v-for="fertilizer in shopFertilizers" :key="fertilizer.id" class="shop-item">
                      <div class="item-image">{{ fertilizer.emoji }}</div>
                      <div class="item-info">
                        <div class="item-name">{{ fertilizer.name }}</div>
                        <div class="item-description">{{ fertilizer.description }}</div>
                        <div class="item-price">
                          <span class="coin-icon">🪙</span>
                          <span>{{ fertilizer.price }}</span>
                        </div>
                      </div>
                      <el-button 
                        type="primary" 
                        size="small" 
                        :disabled="currencyStore.coins < fertilizer.price"
                        @click="buyFertilizer(fertilizer)"
                      >
                        购买
                      </el-button>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-col>
          
          <el-col :sm="24" :md="16">
            <div class="my-garden-section card">
              <h3 class="section-title">我的花园</h3>
              
              <div class="empty-garden" v-if="myPlants.length === 0">
                <el-empty description="你的花园还没有植物，去商店购买吧！" />
              </div>
              
              <div v-else class="garden-grid">
                <div v-for="plant in myPlants" :key="plant.id" class="garden-plant-item">
                  <div class="plant-avatar">
                    <WeatherCanvas :weather="plant.weather || 'sunny'" :width="200" :height="200" />
                    <span class="plant-emoji">{{ plant.emoji }}</span>
                    
                    <!-- 添加植物对话框 -->
                    <PlantDialog 
                      :text="selectedPlantForDialog && selectedPlantForDialog.id === plant.id ? generatePlantThought() : ''" 
                      :is-visible="showPlantThoughtDialog && selectedPlantForDialog && selectedPlantForDialog.id === plant.id"
                      @primary-action="showPlantThoughtDialog = false"
                    />
                  </div>
                  
                  <div class="plant-details">
                    <div class="plant-name">{{ plant.name }}</div>
                    <div class="plant-level">等级: {{ plant.level }}</div>
                    <el-progress :percentage="calculatePlantExp(plant)" :format="expFormat" />
                    
                    <!-- 添加主植物标记 -->
                    <div v-if="plant.isMainPlant" class="main-plant-badge">
                      <el-tag type="success" effect="dark">主要植物</el-tag>
                    </div>
                    
                    <!-- 添加天气选择器 -->
                    <div class="plant-weather-selector">
                      <span class="weather-label">环境:</span>
                      <div class="weather-options">
                        <span 
                          class="weather-option" 
                          :class="{ active: plant.weather === 'sunny' || !plant.weather }"
                          @click="updatePlantWeather(plant, 'sunny')"
                        >☀️</span>
                        <span 
                          class="weather-option" 
                          :class="{ active: plant.weather === 'rainy' }"
                          @click="updatePlantWeather(plant, 'rainy')"
                        >🌧️</span>
                        <span 
                          class="weather-option" 
                          :class="{ active: plant.weather === 'cloudy' }"
                          @click="updatePlantWeather(plant, 'cloudy')"
                        >☁️</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="plant-actions">
                    <el-button size="small" @click="useFertilizer(plant)">
                      使用肥料
                    </el-button>
                    <el-button size="small" type="primary" @click="showDialog(plant)">
                      聆听心声
                    </el-button>
                    <el-button 
                      size="small" 
                      type="success" 
                      @click="setAsMainPlant(plant)"
                      :disabled="plant.isMainPlant"
                    >
                      设为主植物
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
    
    <!-- 使用肥料对话框 -->
    <el-dialog
      v-model="showFertilizerDialog"
      title="使用肥料"
      width="30%"
    >
      <div v-if="myFertilizers.length === 0" class="empty-fertilizers">
        <el-empty description="你还没有肥料，去商店购买吧！" />
      </div>
      
      <div v-else class="fertilizer-list">
        <div v-for="fert in myFertilizers" :key="fert.id" class="fertilizer-item">
          <div class="item-image">{{ fert.emoji }}</div>
          <div class="item-info">
            <div class="item-name">{{ fert.name }}</div>
            <div class="item-description">{{ fert.description }}</div>
            <div class="item-count">数量: {{ fert.count }}</div>
          </div>
          <el-button 
            type="primary" 
            size="small" 
            :disabled="fert.count <= 0"
            @click="applyFertilizer(fert)"
          >
            使用
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showFertilizerDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useCurrencyStore } from '../stores/currency'
import { usePlantStore } from '../stores/plant'
import { ElMessage } from 'element-plus'
import WeatherCanvas from '@/components/WeatherCanvas.vue'
import PlantDialog from '@/components/PlantDialog.vue'

export default {
  name: 'GardenPage',
  components: {
    WeatherCanvas,
    PlantDialog
  },
  setup() {
    const currencyStore = useCurrencyStore()
    const plantStore = usePlantStore()
    
    const activeShopTab = ref('plants')
    const showFertilizerDialog = ref(false)
    const selectedPlant = ref(null)
    const selectedPlantForDialog = ref(null)
    const showPlantThoughtDialog = ref(false)
    
    // 商店植物列表
    const shopPlants = reactive([
      { id: 'plant1', name: '向日葵', emoji: '🌻', price: 50 },
      { id: 'plant2', name: '仙人掌', emoji: '🌵', price: 30 },
      { id: 'plant3', name: '樱花', emoji: '🌸', price: 80 },
      { id: 'plant4', name: '松树', emoji: '🌲', price: 100 },
      { id: 'plant5', name: '玫瑰', emoji: '🌹', price: 65 }
    ])
    
    // 商店肥料列表
    const shopFertilizers = reactive([
      { 
        id: 'fert1', 
        name: '基础肥料', 
        emoji: '💧', 
        price: 10,
        description: '提供少量经验值',
        expValue: 10
      },
      { 
        id: 'fert2', 
        name: '高级肥料', 
        emoji: '✨', 
        price: 25,
        description: '提供中量经验值',
        expValue: 25
      },
      { 
        id: 'fert3', 
        name: '特级肥料', 
        emoji: '🌟', 
        price: 50,
        description: '提供大量经验值',
        expValue: 50
      }
    ])
    
    // 我的肥料列表
    const myFertilizers = reactive([])
    
    // 加载植物列表
    onMounted(async () => {
      await plantStore.fetchPlants()
    })
    
    // 计算植物经验百分比
    const calculatePlantExp = (plant) => {
      const currentExp = plant.experience || 0
      const level = plant.level || 1
      return Math.min(100, (currentExp / (level * 100)) * 100)
    }
    
    // 经验格式化
    const expFormat = (percentage) => {
      const plant = selectedPlant.value
      if (!plant) return ''
      const currentExp = plant.experience || 0
      const level = plant.level || 1
      const nextLevelExp = level * 100
      return `${currentExp}/${nextLevelExp}`
    }
    
    // 购买植物
    const buyPlant = async (plant) => {
      if (currencyStore.coins < plant.price) {
        ElMessage.warning('金币不足，无法购买')
        return
      }
      
      // 创建植物
      const plantData = {
        name: plant.name,
        type: plant.name,
        emoji: plant.emoji,
        isMainPlant: plantStore.plants.length === 0 // 如果是第一个植物，设为主植物
      }
      
      const newPlant = await plantStore.createPlant(plantData)
      
      if (newPlant) {
        // 扣除金币
        currencyStore.deductCoins(plant.price)
        ElMessage.success(`成功购买 ${plant.name}`)
      }
    }
    
    // 购买肥料
    const buyFertilizer = (fertilizer) => {
      if (currencyStore.coins < fertilizer.price) {
        ElMessage.warning('金币不足，无法购买')
        return
      }
      
      // 扣除金币
      currencyStore.deductCoins(fertilizer.price)
      
      // 添加肥料到我的肥料列表
      const existingFert = myFertilizers.find(f => f.id === fertilizer.id)
      if (existingFert) {
        existingFert.count++
      } else {
        myFertilizers.push({
          ...fertilizer,
          count: 1
        })
      }
      
      ElMessage.success(`成功购买 ${fertilizer.name}`)
    }
    
    // 使用肥料对话框
    const useFertilizer = (plant) => {
      selectedPlant.value = plant
      showFertilizerDialog.value = true
    }
    
    // 使用肥料
    const applyFertilizer = async (fertilizer) => {
      if (!selectedPlant.value) return
      
      if (fertilizer.count <= 0) {
        ElMessage.warning('肥料数量不足')
        return
      }
      
      // 使用肥料增加植物经验
      const result = await plantStore.gainExperience(selectedPlant.value.id, fertilizer.expValue)
      
      if (result) {
        // 减少肥料数量
        fertilizer.count--
        if (fertilizer.count <= 0) {
          const index = myFertilizers.findIndex(f => f.id === fertilizer.id)
          if (index !== -1) {
            myFertilizers.splice(index, 1)
          }
        }
        
        ElMessage.success(`成功使用肥料，${selectedPlant.value.name} 获得了 ${fertilizer.expValue} 点经验`)
        showFertilizerDialog.value = false
      }
    }
    
    // 更新植物天气
    const updatePlantWeather = async (plant, weather) => {
      if (plant.weather === weather) return
      
      await plantStore.updatePlant(plant.id, { weather })
    }
    
    // 显示植物心声对话框
    const showDialog = async (plant) => {
      selectedPlantForDialog.value = plant
      showPlantThoughtDialog.value = true
      
      // 获取有效的植物ID
      const plantId = plant._id || plant.id
      
      console.log('植物信息:', plant)
      console.log('使用的植物ID:', plantId)
      
      try {
        // 生成植物心声
        const result = await plantStore.generatePlantThought(plantId, {
          weather: plant.weather || 'sunny',
          timeOfDay: getTimeOfDay(),
          recentTasks: [] // 可以集成任务数据
        })
        
        console.log('生成植物心声结果:', result)
      } catch (error) {
        console.error('生成植物心声错误:', error)
        ElMessage.error(`聆听心声失败: ${error.message || '未知错误'}`)
      }
    }
    
    // 获取当前时间段
    const getTimeOfDay = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) return 'morning'
      if (hour >= 12 && hour < 18) return 'afternoon'
      return 'evening'
    }
    
    // 生成植物心声
    const generatePlantThought = () => {
      if (!selectedPlantForDialog.value) return ''
      
      const thoughts = plantStore.thoughts || plantStore.recentThoughts
      if (thoughts && thoughts.length > 0) {
        return thoughts[0].content
      }
      
      return '...'
    }
    
    // 设置为主植物
    const setAsMainPlant = async (plant) => {
      // 获取有效的植物ID
      const plantId = plant._id || plant.id
      
      if (!plantId) {
        console.error('无法设置主植物: 植物ID无效', plant)
        ElMessage.error('设置失败：无法获取植物ID')
        return
      }
      
      console.log('设置主植物，植物ID:', plantId)
      try {
        await plantStore.updatePlant(plantId, { isMainPlant: true })
        ElMessage.success(`${plant.name} 已设置为主植物`)
      } catch (error) {
        console.error('设置主植物失败:', error)
        ElMessage.error(`设置主植物失败: ${error.message || '未知错误'}`)
      }
    }
    
    return {
      currencyStore,
      plantStore,
      activeShopTab,
      shopPlants,
      shopFertilizers,
      myFertilizers,
      showFertilizerDialog,
      selectedPlant,
      selectedPlantForDialog,
      showPlantThoughtDialog,
      myPlants: computed(() => plantStore.plants),
      
      // 方法
      buyPlant,
      buyFertilizer,
      calculatePlantExp,
      expFormat,
      useFertilizer,
      applyFertilizer,
      updatePlantWeather,
      showDialog,
      generatePlantThought,
      setAsMainPlant
    }
  }
}
</script>

<style scoped>
.garden-header {
  margin-bottom: 20px;
}

.garden-description {
  color: #666;
  margin-top: 10px;
}

.section-title {
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.section-description {
  color: #666;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.shop-balance {
  display: inline-flex;
  align-items: center;
  background-color: var(--light-gray);
  padding: 5px 15px;
  border-radius: 20px;
  margin-bottom: 20px;
}

.coin-icon {
  margin-right: 5px;
}

.coin-amount {
  font-weight: bold;
}

.shop-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.shop-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: var(--border-radius);
  background-color: var(--light-gray);
}

.item-image {
  font-size: 2rem;
  margin-right: 15px;
  width: 40px;
  text-align: center;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: bold;
}

.item-description {
  font-size: 0.8rem;
  color: #666;
  margin-top: 3px;
}

.item-price {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: var(--accent-color);
  font-weight: bold;
  margin-top: 5px;
}

.garden-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.garden-plant-item {
  background-color: var(--light-gray);
  border-radius: var(--border-radius);
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.plant-avatar {
  font-size: 3rem;
  margin-bottom: 10px;
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.plant-emoji {
  font-size: 5rem;
  z-index: 3;
  position: relative;
}

.plant-details {
  width: 100%;
  text-align: center;
  margin-bottom: 15px;
}

.plant-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.plant-level {
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.plant-weather-selector {
  display: flex;
  align-items: center;
  margin-top: 10px;
  justify-content: center;
}

.weather-label {
  margin-right: 10px;
  font-size: 0.9rem;
  color: #666;
}

.weather-options {
  display: flex;
  gap: 10px;
}

.weather-option {
  font-size: 1.4rem;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.2s;
}

.weather-option:hover {
  transform: scale(1.2);
}

.weather-option.active {
  opacity: 1;
  transform: scale(1.2);
}

.plant-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

.empty-garden, .empty-fertilizers {
  padding: 40px 0;
}

.fertilizer-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.fertilizer-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: var(--border-radius);
  background-color: var(--light-gray);
}

.item-count {
  font-size: 0.8rem;
  color: #666;
  margin-top: 3px;
}

.main-plant-badge {
  margin-top: 10px;
  margin-bottom: 10px;
}

@media screen and (max-width: 768px) {
  .garden-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 