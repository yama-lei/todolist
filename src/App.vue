<template>
  <div class="app-container" :class="{ 'auth-page': isAuthRoute }">
    <!-- 认证页面路由视图 -->
    <router-view v-if="isAuthRoute" />
    
    <!-- 主应用布局 -->
    <template v-else>
      <!-- 添加视频背景 -->
      <div class="video-background">
        <video autoplay muted loop playsinline>
          <source src="https://yamapicgo.oss-cn-nanjing.aliyuncs.com/picgoImage/bg2.mp4" type="video/mp4">
        </video>
      </div>
      
      <el-container class="main-container">
        <!-- 侧边栏 -->
        <el-aside width="240px" class="sidebar">
          <div class="logo-container">
            <div class="logo">
              <img src="https://yamapicgo.oss-cn-nanjing.aliyuncs.com/picgoImage/logo.png" alt="logo" class="logo-image">
              <span>植语心声</span>
            </div>
          </div>
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            router
          >
            <el-menu-item index="/">
              <el-icon><House /></el-icon>
              <span>心灵起点</span>
            </el-menu-item>
            <el-menu-item index="/tasks">
              <el-icon><List /></el-icon>
              <span>待办清单</span>
            </el-menu-item>
            <el-menu-item index="/garden">
              <el-icon><PriceTag /></el-icon>
              <span>植物花园</span>
            </el-menu-item>
            <!--?            <el-menu-item index="/plant-voice">
              <el-icon><ChatDotRound /></el-icon>
              <span>植物心声</span>
            </el-menu-item>-->
            <el-menu-item index="/plant-chat">
              <el-icon><ChatLineRound /></el-icon>
              <span>心灵树洞</span>
            </el-menu-item>
            <el-menu-item index="/posts">
              <el-icon><Reading /></el-icon>
              <span>生活手札</span>
            </el-menu-item>
            <el-menu-item index="/calendar">
              <el-icon><Calendar /></el-icon>
              <span>成长轨迹</span>
            </el-menu-item>
          </el-menu>
          
          <div class="user-panel">
            <div class="user-info" @click="showUserMenu = !showUserMenu">
              <el-avatar :size="36" :src="userAvatar"></el-avatar>
              <span class="username">{{ username }}</span>
              <el-icon><CaretTop :class="{ 'rotate-icon': showUserMenu }" /></el-icon>
            </div>
            
            <div class="user-dropdown" v-if="showUserMenu">
              <div class="dropdown-item" @click="goToProfile">
                <el-icon><User /></el-icon>
                <span>个人资料</span>
              </div>
<!--              <div class="dropdown-item" @click="goToSettings">
                <el-icon><Setting /></el-icon>
                <span>设置</span>
              </div>-->
              <div class="dropdown-item logout" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </div>
            </div>
          </div>
        </el-aside>
        
        <!-- 主内容区 -->
        <el-main>
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { usePlantStore } from './stores/plant'
import {
  Sunny, House, List, PriceTag, ChatDotRound, ChatLineRound,
  Reading, Calendar, CaretTop, User, Setting, SwitchButton
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import axios from 'axios'
export default {
  name: 'App',
  components: {
    Sunny, House, List, PriceTag, ChatDotRound, ChatLineRound,
    Reading, Calendar, CaretTop, User, Setting, SwitchButton
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const plantStore = usePlantStore()
    
    const showUserMenu = ref(false)
    
    // 判断当前是否为认证相关路由（登录/注册/忘记密码等）
    const isAuthRoute = computed(() => {
      const authRoutes = ['/login', '/register', '/forgot-password']
      // 检查当前路径是否以这些路径开头
      return authRoutes.some(path => route.path.startsWith(path)) ||
             route.path.startsWith('/reset-password')
    })
    
    // 当前激活的菜单项
    const activeMenu = computed(() => route.path)
    
    // 用户信息
    const username = computed(() => authStore.userInfo?.username || '未登录')
    const userAvatar = computed(() => authStore.userInfo?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png')
    
    // 处理退出登录
    const handleLogout = () => {
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        authStore.logout()
        router.push('/login')
      }).catch(() => {})
    }
    
    // 个人资料页面
    const goToProfile = () => {
      showUserMenu.value = false
      router.push('/profile')
    }
    
    // 设置页面
    const goToSettings = () => {
      showUserMenu.value = false
      // router.push('/settings')
      ElMessageBox.alert('设置功能正在开发中', '提示', {
        confirmButtonText: '确定'
      })
    }
    
    // 点击页面其他区域关闭用户菜单
    const handleClickOutside = (event) => {
      const userPanel = document.querySelector('.user-panel')
      if (userPanel && !userPanel.contains(event.target) && showUserMenu.value) {
        showUserMenu.value = false
      }
    }
    
    // 组件挂载和卸载时处理全局点击事件
    onMounted(async () => {
      document.addEventListener('click', handleClickOutside)
      
      console.log('App组件挂载，检查认证状态')
      // 确认token有效性并加载用户信息
      const token = localStorage.getItem('token')
      if (token && token.trim() !== '') {
        console.log('检测到有存储的token，确保用户数据已加载')
        // 确保axios headers已设置
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        try {
          // 无论是否有用户信息，都重新获取以确保数据最新
          console.log('加载用户信息')
          const userData = await authStore.fetchUserInfo()
          
          if (userData) {
            console.log('用户信息加载成功', userData)
            // 用户已登录，加载植物数据
            await plantStore.fetchPlants()
            console.log('植物数据加载成功')
          } else {
            console.warn('获取用户信息失败，清除无效token')
            authStore.logout()
            if (!isAuthRoute.value) {
              router.push('/login')
            }
          }
        } catch (error) {
          console.error('初始化应用状态失败:', error)
          authStore.logout()
          if (!isAuthRoute.value) {
            router.push('/login')
          }
        }
      } else {
        console.log('未检测到有效token')
        // 如果当前不在认证页面，重定向到登录
        if (!isAuthRoute.value) {
          console.log('重定向到登录页面')
          router.push('/login')
        }
      }
    })
    
    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside)
    })
    
    return {
      isAuthRoute,
      activeMenu,
      username,
      userAvatar,
      showUserMenu,
      handleLogout,
      goToProfile,
      goToSettings
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  background-color: #f5f7fa;
}

/* 主容器样式 */
.app-container {
  min-height: 100vh;
  display: flex;
}

/* 认证页面布局 */
.auth-page {
  background-color: #f5f7fa;
}

/* 主布局容器 */
.main-container {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
}

/* 侧边栏样式 */
.sidebar {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  border-right: 1px solid rgba(235, 238, 245, 0.5);
  display: flex;
  flex-direction: column;
  width: 240px; /* 增加侧边栏宽度 */
  transition: all 0.3s ease;
  overflow: hidden;
}

/* Logo容器 */
.logo-container {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(240, 240, 240, 0.6);
  margin-bottom: 10px;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
  color: #42b983;
  letter-spacing: 1px;
}

.logo .el-icon {
  margin-right: 10px;
  font-size: 24px;
}

.logo-image {
  width: 42px;
  height: 42px;
  object-fit: cover;
  margin-right: 10px;
}

/* 垂直菜单 */
.el-menu-vertical {
  border-right: none;
  flex: 1;
  padding: 15px 0;
  background-color: transparent;
}

.el-menu-vertical .el-menu-item {
  height: 50px;
  line-height: 50px;
  margin: 5px 14px;
  border-radius: 8px;
  color: #606266;
  font-size: 15px;
  transition: all 0.3s ease;
}

.el-menu-vertical .el-menu-item:hover {
  background-color: rgba(66, 185, 131, 0.1);
  color: #42b983;
}

.el-menu-vertical .el-menu-item.is-active {
  background-color: rgba(66, 185, 131, 0.15);
  color: #42b983;
  font-weight: 500;
}

.el-menu-vertical .el-menu-item .el-icon {
  margin-right: 12px;
  color: inherit;
  font-size: 18px;
  transition: all 0.2s ease;
}

/* 主内容区域 */
.el-main {
  padding: 25px;
  margin-left: 240px; /* 与侧边栏宽度对应 */
  min-height: 100vh;
  width: calc(100% - 240px); /* 减去侧边栏宽度 */
  position: relative;
  z-index: 1;
}

/* 用户面板 */
.user-panel {
  margin-top: auto;
  padding: 18px 16px;
  border-top: 1px solid rgba(240, 240, 240, 0.6);
  position: relative;
  margin-top: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user-info:hover {
  background-color: rgba(66, 185, 131, 0.08);
}

.username {
  margin: 0 10px;
  flex: 1;
  font-size: 15px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.rotate-icon {
  transform: rotate(180deg);
  transition: transform 0.3s;
}

/* 用户下拉菜单 */
.user-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  margin: 0 16px 8px;
  overflow: hidden;
  z-index: 100;
  border: 1px solid rgba(240, 240, 240, 0.8);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background-color: rgba(66, 185, 131, 0.08);
}

.dropdown-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
  color: #606266;
}

.dropdown-item span {
  font-size: 14px;
  color: #333;
}

.dropdown-item.logout {
  border-top: 1px solid rgba(240, 240, 240, 0.8);
}

.dropdown-item.logout .el-icon,
.dropdown-item.logout span {
  color: #f56c6c;
}

/* 视频背景样式 */
.video-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.video-background video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
}
</style>