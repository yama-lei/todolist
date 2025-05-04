<template>
  <div class="garden-page">
    <div class="garden-background"></div>
    
    <div class="container">
      <div class="garden-header card">
        <h2 class="card-title">我的后花园</h2>
        <p class="garden-description">
          在这里，你可以选择和购买各种植物，打造属于自己的花园。
        </p>
        <div class="garden-stats">
          <div class="stats-item coins">
            <span class="stats-icon">🪙</span>
            <span class="stats-value">{{ currencyStore.coins }}</span>
            <span class="stats-label">金币</span>
          </div>
          <div class="stats-item plants">
            <span class="stats-icon">🌱</span>
            <span class="stats-value">{{ myPlants.length }}</span>
            <span class="stats-label">植物</span>
          </div>
        </div>
      </div>
      
      <div class="garden-content">
        <el-row :gutter="24">
          <el-col :sm="24" :md="8">
            <div class="shop-section card">
              <div class="section-header">
                <h3 class="section-title">植物商店</h3>
                <div class="shop-balance">
                  <span class="coin-icon">🪙</span>
                  <span class="coin-amount">{{ currencyStore.coins }}</span>
                </div>
              </div>
              <p class="section-description">使用你的金币购买新植物和肥料</p>
              
              <el-tabs v-model="activeShopTab" class="garden-tabs">
                <el-tab-pane label="植物" name="plants">
                  <div class="shop-items">
                    <div v-for="plant in shopPlants" :key="plant.id" class="shop-item">
                      <div class="item-image-container">
                        <div class="item-image">{{ plant.emoji }}</div>
                      </div>
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
                        class="buy-button"
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
                      <div class="item-image-container">
                        <div class="item-image">{{ fertilizer.emoji }}</div>
                      </div>
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
                        class="buy-button"
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
              <div class="section-header">
                <h3 class="section-title">我的花园</h3>
                <el-input 
                  v-if="myPlants.length > 0"
                  placeholder="搜索我的植物..." 
                  prefix-icon="Search"
                  v-model="searchPlant"
                  class="search-input"
                />
              </div>
              
              <div class="empty-garden" v-if="myPlants.length === 0">
                <el-empty description="你的花园还没有植物，去商店购买吧！">
                  <template #image>
                    <div class="empty-image">🏡</div>
                  </template>
                  <el-button type="primary" @click="activeShopTab = 'plants'">去购买植物</el-button>
                </el-empty>
              </div>
              
              <div v-else class="garden-grid">
                <div 
                  v-for="plant in filteredPlants" 
                  :key="plant.id" 
                  class="garden-plant-item"
                  :class="{ 'is-main-plant': plant.isMainPlant }"
                >
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
                    <el-button size="small" type="info" plain @click="useFertilizer(plant)">
                      <span class="button-icon">💧</span>施肥
                    </el-button>
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
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
    
    <!-- 使用肥料对话框 -->
    <el-dialog
      v-model="showFertilizerDialog"
      title="使用肥料"
      width="400px"
      custom-class="fertilizer-dialog"
    >
      <div v-if="myFertilizers.length === 0" class="empty-fertilizers">
        <el-empty description="你还没有肥料，去商店购买吧！">
          <template #image>
            <div class="empty-image">✨</div>
          </template>
          <el-button type="primary" @click="activeShopTab = 'fertilizers'; showFertilizerDialog = false">
            去购买肥料
          </el-button>
        </el-empty>
      </div>
      
      <div v-else class="fertilizer-list">
        <h4 class="dialog-subtitle" v-if="selectedPlant">为 {{ selectedPlant.name }} 选择肥料</h4>
        
        <div v-for="fert in myFertilizers" :key="fert.id" class="fertilizer-item">
          <div class="item-image-container">
            <div class="item-image">{{ fert.emoji }}</div>
          </div>
          <div class="item-info">
            <div class="item-name">{{ fert.name }}</div>
            <div class="item-description">{{ fert.description }}</div>
            <div class="item-count"><span class="count-label">数量:</span> {{ fert.count }}</div>
          </div>
          <el-button 
            type="primary" 
            size="small" 
            class="use-button"
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
    const searchPlant = ref('')
    
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
    
    // 过滤后的植物列表
    const filteredPlants = computed(() => {
      if (!searchPlant.value) return plantStore.plants
      
      const search = searchPlant.value.toLowerCase()
      return plantStore.plants.filter(plant => 
        plant.name.toLowerCase().includes(search)
      )
    })
    
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
      searchPlant,
      myPlants: computed(() => plantStore.plants),
      filteredPlants,
      
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

.section-description {
  color: #666;
  margin-bottom: 20px;
  font-size: 15px;
}

.shop-section, .my-garden-section {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  background-color: white;
  overflow: hidden;
  transition: transform 0.3s;
}

.shop-section:hover, .my-garden-section:hover {
  transform: translateY(-5px);
}

.shop-balance {
  display: inline-flex;
  align-items: center;
  background-color: #f0f7ff;
  padding: 6px 15px;
  border-radius: 20px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
}

.coin-icon {
  margin-right: 5px;
}

.coin-amount {
  font-weight: bold;
  color: #ff9800;
}

.garden-tabs :deep(.el-tabs__nav) {
  border-radius: 8px;
  background-color: #f5f5f5;
  padding: 3px;
}

.garden-tabs :deep(.el-tabs__item) {
  height: 36px;
  line-height: 36px;
  border-radius: 6px;
  transition: all 0.3s;
}

.garden-tabs :deep(.el-tabs__item.is-active) {
  color: white;
  background-color: #4caf50;
}

.garden-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.shop-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.shop-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 12px;
  background-color: #f9f9f9;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #eee;
}

.shop-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border-color: #e0e0e0;
}

.item-image-container {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #ebf8ee 0%, #e3f2fd 100%);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.item-image {
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.item-description {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
  line-height: 1.4;
}

.item-price {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #ff9800;
  font-weight: bold;
  margin-top: 8px;
}

.buy-button {
  min-width: 70px;
}

.search-input {
  max-width: 200px;
}

.garden-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.garden-plant-item {
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

.plant-emoji {
  font-size: 80px;
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

.empty-garden, .empty-fertilizers {
  padding: 40px 0;
  text-align: center;
}

.empty-image {
  font-size: 60px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

.fertilizer-dialog {
  border-radius: 16px;
}

.dialog-subtitle {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #666;
  text-align: center;
}

.fertilizer-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.fertilizer-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 12px;
  background-color: #f9f9f9;
  transition: all 0.3s;
  border: 1px solid #eee;
}

.fertilizer-item:hover {
  background-color: #f0f7ff;
}

.item-count {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
  display: flex;
  align-items: center;
}

.count-label {
  margin-right: 5px;
  color: #999;
}

.use-button {
  min-width: 70px;
}

@media screen and (max-width: 768px) {
  .garden-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .garden-plant-item {
    padding: 15px;
  }
  
  .plant-avatar {
    width: 140px;
    height: 140px;
  }
  
  .plant-emoji {
    font-size: 60px;
  }
  
  .garden-content .el-col {
    margin-bottom: 20px;
  }
  
  .plant-actions {
    flex-direction: column;
  }
}
</style> 