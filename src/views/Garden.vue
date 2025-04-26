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
import { ref, reactive } from 'vue'
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
    const shopPlants = [
      { id: 1, name: '向日葵', emoji: '🌻', price: 50, exp: 0, level: 1 },
      { id: 2, name: '玫瑰', emoji: '🌹', price: 100, exp: 0, level: 1 },
      { id: 3, name: '郁金香', emoji: '🌷', price: 80, exp: 0, level: 1 },
      { id: 4, name: '仙人掌', emoji: '🌵', price: 60, exp: 0, level: 1 },
      { id: 5, name: '樱花', emoji: '🌸', price: 120, exp: 0, level: 1 }
    ]
    
    // 商店肥料列表
    const shopFertilizers = [
      { id: 1, name: '普通肥料', emoji: '💩', price: 20, description: '增加少量经验值', expBoost: 10 },
      { id: 2, name: '高级肥料', emoji: '✨', price: 50, description: '增加中量经验值', expBoost: 30 },
      { id: 3, name: '特级肥料', emoji: '🌟', price: 100, description: '增加大量经验值', expBoost: 60 }
    ]
    
    // 我的植物和肥料（使用本地存储）
    const myPlants = reactive(JSON.parse(localStorage.getItem('myPlants') || '[]'))
    const myFertilizers = reactive(JSON.parse(localStorage.getItem('myFertilizers') || '[]'))
    
    // 保存我的植物到本地存储
    const savePlants = () => {
      localStorage.setItem('myPlants', JSON.stringify(myPlants))
    }
    
    // 保存我的肥料到本地存储
    const saveFertilizers = () => {
      localStorage.setItem('myFertilizers', JSON.stringify(myFertilizers))
    }
    
    // 购买植物
    const buyPlant = (plant) => {
      if (currencyStore.useCoins(plant.price)) {
        const newPlant = { ...plant }
        myPlants.push(newPlant)
        savePlants()
        
        ElMessage({
          message: `成功购买 ${plant.name}！`,
          type: 'success'
        })
      } else {
        ElMessage({
          message: '金币不足！',
          type: 'error'
        })
      }
    }
    
    // 购买肥料
    const buyFertilizer = (fertilizer) => {
      if (currencyStore.useCoins(fertilizer.price)) {
        // 检查是否已有该肥料
        const existingFertilizer = myFertilizers.find(f => f.id === fertilizer.id)
        
        if (existingFertilizer) {
          existingFertilizer.count += 1
        } else {
          const newFertilizer = { ...fertilizer, count: 1 }
          myFertilizers.push(newFertilizer)
        }
        
        saveFertilizers()
        
        ElMessage({
          message: `成功购买 ${fertilizer.name}！`,
          type: 'success'
        })
      } else {
        ElMessage({
          message: '金币不足！',
          type: 'error'
        })
      }
    }
    
    // 使用肥料对话框
    const useFertilizer = (plant) => {
      selectedPlant.value = plant
      showFertilizerDialog.value = true
    }
    
    // 应用肥料
    const applyFertilizer = (fertilizer) => {
      if (selectedPlant.value && fertilizer.count > 0) {
        // 增加植物经验
        selectedPlant.value.exp += fertilizer.expBoost
        
        // 检查是否升级
        const maxExp = selectedPlant.value.level * 100
        if (selectedPlant.value.exp >= maxExp) {
          selectedPlant.value.level += 1
          selectedPlant.value.exp -= maxExp
        }
        
        // 减少肥料数量
        fertilizer.count -= 1
        
        // 保存更改
        savePlants()
        saveFertilizers()
        
        // 给主植物也增加一些经验
        plantStore.gainExperience(fertilizer.expBoost / 2)
        
        ElMessage({
          message: `成功使用肥料，${selectedPlant.value.name} 获得 ${fertilizer.expBoost} 点经验！`,
          type: 'success'
        })
        
        // 如果肥料用完，关闭对话框
        if (myFertilizers.every(f => f.count <= 0)) {
          showFertilizerDialog.value = false
        }
      }
    }
    
    // 计算植物经验百分比
    const calculatePlantExp = (plant) => {
      const maxExp = plant.level * 100
      return (plant.exp / maxExp) * 100
    }
    
    // 经验格式化
    const expFormat = () => {
      if (!selectedPlant.value) return ''
      return `${selectedPlant.value.exp}/${selectedPlant.value.level * 100}`
    }
    
    // 显示植物对话框
    const showDialog = (plant) => {
      selectedPlantForDialog.value = plant
      showPlantThoughtDialog.value = true
    }
    
    // 产生随机的植物语录
    const generatePlantThought = () => {
      const thoughts = [
        "我感觉自己又长高了一点！",
        "阳光真好，我超喜欢这种感觉~",
        "谢谢你的照顾，我很开心！",
        "今天天气真好，适合光合作用！",
        "我觉得自己越来越漂亮了，你觉得呢？",
        "我有时候会想，云朵是什么味道的...",
        "雨水让我感觉很清爽，谢谢大自然！"
      ]
      return thoughts[Math.floor(Math.random() * thoughts.length)]
    }
    
    // 更新植物天气
    const updatePlantWeather = (plant, newWeather) => {
      plant.weather = newWeather
      savePlants()
      
      ElMessage({
        message: `${plant.name} 的环境已更新！`,
        type: 'success'
      })
    }
    
    return {
      currencyStore,
      activeShopTab,
      shopPlants,
      shopFertilizers,
      myPlants,
      myFertilizers,
      showFertilizerDialog,
      selectedPlant,
      buyPlant,
      buyFertilizer,
      useFertilizer,
      applyFertilizer,
      calculatePlantExp,
      expFormat,
      selectedPlantForDialog,
      showPlantThoughtDialog,
      showDialog,
      generatePlantThought,
      updatePlantWeather
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

@media screen and (max-width: 768px) {
  .garden-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 