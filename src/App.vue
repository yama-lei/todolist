<template>
  <div class="app">
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <h1 class="logo">生活小助手</h1>
          <div class="currency">
            <el-tooltip content="当前金币数量" placement="bottom">
              <span class="coin-icon">🪙</span>
            </el-tooltip>
            <span class="coin-amount">{{ currencyStore.coins }}</span>
          </div>
        </div>
      </div>
    </header>
    
    <div class="main-content">
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <router-link to="/" class="nav-item">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </router-link>
          <router-link to="/plant-voice" class="nav-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>植物心声</span>
          </router-link>
          <router-link to="/posts" class="nav-item">
            <el-icon><Document /></el-icon>
            <span>说说</span>
          </router-link>
          <router-link to="/garden" class="nav-item">
            <el-icon><Sunny /></el-icon>
            <span>后花园</span>
          </router-link>
        </nav>
        
        <div class="plant-preview">
          <h3>{{ plantStore.plant.name }}</h3>
          <div class="plant-level">等级: {{ plantStore.currentLevel }}</div>
          <el-progress :percentage="plantExp" :format="plantExpFormat" />
        </div>
      </aside>
      
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import { HomeFilled, ChatDotRound, Document, Sunny } from '@element-plus/icons-vue'
import { useCurrencyStore } from './stores/currency'
import { usePlantStore } from './stores/plant'
import { computed } from 'vue'

export default {
  name: 'App',
  components: {
    HomeFilled,
    ChatDotRound,
    Document,
    Sunny
  },
  setup() {
    const currencyStore = useCurrencyStore()
    const plantStore = usePlantStore()
    
    const plantExp = computed(() => {
      const maxExp = plantStore.plant.level * 100
      return (plantStore.plant.experience / maxExp) * 100
    })
    
    const plantExpFormat = () => {
      return `${plantStore.plant.experience}/${plantStore.plant.level * 100}`
    }
    
    return {
      currencyStore,
      plantStore,
      plantExp,
      plantExpFormat
    }
  }
}
</script>

<style>
/* 应用布局样式 */
.app-header {
  background-color: var(--primary-color);
  color: white;
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: 60px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.currency {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 5px 10px;
  border-radius: 20px;
}

.coin-icon {
  font-size: 1.2rem;
}

.coin-amount {
  font-weight: bold;
}

.sidebar-nav {
  margin-bottom: 30px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 5px;
  border-radius: var(--border-radius);
  color: var(--secondary-color);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: var(--light-gray);
}

.nav-item.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.nav-item i {
  margin-right: 10px;
}

.plant-preview {
  padding: 15px;
  background-color: var(--light-gray);
  border-radius: var(--border-radius);
}

.plant-level {
  margin: 10px 0;
  font-size: 0.9rem;
}
</style>
