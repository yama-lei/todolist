<template>
  <div class="app-container" :class="{ 'auth-page': isAuthRoute }">
    <!-- 认证页面路由视图 -->
    <router-view v-if="isAuthRoute" />
    
    <!-- 主应用布局 -->
    <template v-else>
      <!-- 添加视频背景 -->
      <div class="video-background">
        <video autoplay muted loop playsinline>
          <source src="@/assets/videos/test.mp4" type="video/mp4">
        </video>
      </div>
      
      <el-container class="main-container">
        <!-- 侧边栏 -->
        <el-aside width="220px" class="sidebar">
          <div class="logo-container">
            <div class="logo">
              <el-icon><Sunny /></el-icon>
              <span>植物日记</span>
            </div>
          </div>
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            router
          >
            <el-menu-item index="/">
              <el-icon><House /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/tasks">
              <el-icon><List /></el-icon>
              <span>任务</span>
            </el-menu-item>
            <el-menu-item index="/garden">
              <el-icon><PriceTag /></el-icon>
              <span>植物花园</span>
            </el-menu-item>
            <el-menu-item index="/plant-voice">
              <el-icon><ChatDotRound /></el-icon>
              <span>植物心声</span>
            </el-menu-item>
            <el-menu-item index="/plant-chat">
              <el-icon><ChatLineRound /></el-icon>
              <span>植物对话</span>
            </el-menu-item>
            <el-menu-item index="/posts">
              <el-icon><Reading /></el-icon>
              <span>动态</span>
            </el-menu-item>
            <el-menu-item index="/calendar">
              <el-icon><Calendar /></el-icon>
              <span>日历</span>
            </el-menu-item>
          </el-menu>
          
          <div class="user-panel">
            <div class="user-info" @click="showUserMenu = !showUserMenu">
              <el-avatar :size="32" :src="userAvatar" v-if="userAvatar"></el-avatar>
              <el-avatar :size="32" icon="UserFilled" v-else></el-avatar>
              <span class="username">{{ username }}</span>
              <el-icon><CaretTop :class="{ 'rotate-icon': showUserMenu }" /></el-icon>
            </div>
            
            <div class="user-dropdown" v-if="showUserMenu">
              <div class="dropdown-item" @click="goToProfile">
                <el-icon><User /></el-icon>
                <span>个人资料</span>
              </div>
              <div class="dropdown-item" @click="goToSettings">
                <el-icon><Setting /></el-icon>
                <span>设置</span>
              </div>
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
    const userAvatar = computed(() => authStore.userInfo?.avatar || '')
    
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
      // router.push('/profile')
      ElMessageBox.alert('个人资料功能正在开发中', '提示', {
        confirmButtonText: '确定'
      })
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
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  width: 220px; /* 明确指定侧边栏宽度 */
}

/* Logo容器 */
.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #4caf50;
}

.logo .el-icon {
  margin-right: 10px;
  font-size: 24px;
}

/* 垂直菜单 */
.el-menu-vertical {
  border-right: none;
  flex: 1;
}

/* 主内容区域 */
.el-main {
  padding: 20px;
  margin-left: 220px; /* 与侧边栏宽度对应 */
  min-height: 100vh;
  width: calc(100% - 220px); /* 减去侧边栏宽度 */
  position: relative;
  z-index: 1;
}

/* 用户面板 */
.user-panel {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  margin: 0 8px;
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin: 0 16px 8px;
  overflow: hidden;
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}

.dropdown-item .el-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #606266;
}

.dropdown-item span {
  font-size: 14px;
  color: #333;
}

.dropdown-item.logout {
  border-top: 1px solid #f0f0f0;
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
  opacity: 0.3;
}
</style>