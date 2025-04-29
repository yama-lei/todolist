<template>
  <div class="app">    
    <div class="main-content">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="app-logo">
            <el-icon><Sunny /></el-icon>
            <span>植物日记</span>
          </div>
        </div>
        
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
          <router-link to="/calendar" class="nav-item">
            <el-icon><Calendar /></el-icon>
            <span>日历</span>
          </router-link>
        </nav>
        
        <div class="plant-preview">
          <div class="plant-avatar">
            <img :src="plantStore.plant.avatar" alt="Plant Avatar" v-if="plantStore.plant.avatar">
            <el-icon v-else><Sunny /></el-icon>
          </div>
          <h3>{{ plantStore.plant.name }}</h3>
          <div class="plant-level">Lv.{{ plantStore.currentLevel }}</div>
          <div class="exp-progress">
            <el-progress 
              :percentage="plantExp" 
              :format="plantExpFormat" 
              :stroke-width="8"
              color="#4caf50"
              :show-text="false"
            />
            <span class="exp-text">{{ plantExpFormat() }}</span>
          </div>
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
      return `${plantStore.plant.experience}/${plantStore.plant.level * 100} EXP`
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

<style scoped>
:root {
  --primary-color: #4caf50;
  --primary-light: #81c784;
  --primary-dark: #388e3c;
  --secondary-color: #ff9800;
  --text-color: #333;
  --text-light: #666;
  --bg-color: #f9f9f7;
  --sidebar-bg: #ffffff;
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  --transition: all 0.3s ease;
}

.app {
  background-image: url('@/assets/images/bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;

  background-color: var(--bg-color);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.main-content {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  padding: 20px;
  flex-direction: column;
  z-index: 10;
  position: fixed;
  top: 10px;
  left: 5px;
  height: 95vh;
  overflow-y: auto;
  margin: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(5px);
}

.sidebar-header {
  padding: 20px 20px 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.app-logo {
  display: flex;
  align-items: center;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--primary-dark);
}

.app-logo .el-icon {
  font-size: 1.8rem;
  margin-right: 10px;
  color: var(--primary-color);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 30px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: var(--border-radius);
  color: var(--text-light);
  text-decoration: none;
  transition: var(--transition);
  font-size: 0.95rem;
}

.nav-item:hover {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--primary-dark);
}

.nav-item.router-link-active {
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
}

.nav-item .el-icon {
  font-size: 1.2rem;
  margin-right: 12px;
}

.plant-preview {
  margin-top: auto;
  padding: 20px;
  background-color: rgba(76, 175, 80, 0.05);
  border-radius: var(--border-radius);
  text-align: center;
  border: 1px dashed rgba(76, 175, 80, 0.3);
}

.plant-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  border-radius: 50%;
  background-color: rgba(76, 175, 80, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: var(--primary-color);
  overflow: hidden;
}

.plant-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plant-preview h3 {
  margin: 0 0 5px;
  color: var(--text-color);
  font-size: 1.2rem;
}

.plant-level {
  font-size: 0.9rem;
  color: var(--secondary-color);
  margin-bottom: 15px;
  font-weight: 500;
}

.exp-progress {
  margin-top: 15px;
}

.exp-text {
  display: block;
  font-size: 0.8rem;
  color: var(--text-light);
  margin-top: 5px;
}

.content-area {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* 动画效果 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.plant-avatar {
  animation: float 3s ease-in-out infinite;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    padding: 15px;
  }
  
  .content-area {
    padding: 20px;
  }
}
</style>