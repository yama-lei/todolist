import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import axios from 'axios'
import { useAuthStore } from './stores/auth'

// 默认配置
axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

// 创建Pinia实例
const pinia = createPinia()

// 创建Vue应用
const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})

// 响应拦截器处理常见错误
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // 处理401未授权错误
      if (error.response.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

// 设置默认请求头中的token (如果存在)
const storedToken = localStorage.getItem('token')
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
}

// 初始化应用前先初始化认证状态
const authStore = useAuthStore()

// 立即挂载应用，同时并行初始化认证状态
app.mount('#app')
// 初始化认证状态
authStore.initAuth()
