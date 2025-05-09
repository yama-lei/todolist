import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 认证相关的API服务
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const loading = ref(false)
  const error = ref(null)
  
  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const userInfo = computed(() => user.value || {})
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  // 登录方法
  const login = async (credentials) => {
    loading.value = true
    error.value = null
    
    try {
      // 传递给API的登录数据
      const loginData = {
        email: credentials.email,
        password: credentials.password
      }
      
      const response = await axios.post(`${API_URL}/auth/login`, loginData)
      const { token: newToken, user: userData } = response.data
      
      // 保存token和用户数据
      token.value = newToken
      user.value = userData
      
      // 将token存储到localStorage或cookie，根据记住我的选择
      if (credentials.remember) {
        // 如果用户选择了"记住我"，使用localStorage长期保存
        localStorage.setItem('token', newToken)
      } else {
        // 如果没有选择"记住我"，也暂时存入localStorage
        // 在实际项目中可以考虑使用session storage或有效期较短的cookie
      localStorage.setItem('token', newToken)
      }
      
      // 设置axios默认请求头
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      ElMessage.success('登录成功!')
      return response.data
    } catch (err) {
      console.error('登录失败:', err)
      error.value = err.response?.data?.message || '登录失败，请检查您的邮箱和密码'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 注册方法
  const register = async (userData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData)
      ElMessage.success('注册成功！请登录您的账号。')
      return response.data
    } catch (err) {
      console.error('注册失败:', err)
      error.value = err.response?.data?.message || '注册失败，请稍后再试'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 忘记密码
  const forgotPassword = async (email) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email })
      return response.data
    } catch (err) {
      console.error('发送重置密码邮件失败:', err)
      error.value = err.response?.data?.message || '发送重置密码邮件失败，请稍后再试'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 重置密码
  const resetPassword = async (resetData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, resetData)
      return response.data
    } catch (err) {
      console.error('重置密码失败:', err)
      error.value = err.response?.data?.message || '重置密码失败，请稍后再试'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 获取当前用户信息
  const fetchUserInfo = async () => {
    if (!token.value) return null
    
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_URL}/auth/me`)
      user.value = response.data
      console.log('已获取用户信息:', user.value)
      return response.data
    } catch (err) {
      console.error('获取用户信息失败:', err)
      if (err.response?.status === 401) {
        // 如果未授权，执行登出操作
        logout()
      }
      error.value = err.response?.data?.message || '获取用户信息失败'
      return null
    } finally {
      loading.value = false
    }
  }
  
  // 登出方法
  const logout = () => {
    // 清除用户数据和token
    user.value = null
    token.value = ''
    
    // 清除localStorage中的token
    localStorage.removeItem('token')
    
    // 清除axios默认请求头
    delete axios.defaults.headers.common['Authorization']
    
    // 跳转到登录页的逻辑在路由守卫中处理
  }
  
  // 初始化认证状态
  const initAuth = async () => {
    if (token.value) {
      // 设置axios默认请求头
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      // 获取用户信息
      try {
        const userData = await fetchUserInfo()
        if (!userData) {
          // 如果获取用户信息失败，可能是token无效
          console.warn('初始化认证状态时获取用户信息失败，清除token')
          logout()
          return false
        }
        return true
      } catch (err) {
        console.error('初始化认证状态失败:', err)
        logout()
        return false
      }
    }
    return false
  }
  
  // 修改密码
  const changePassword = async (passwordData) => {
    try {
      loading.value = true
      error.value = null
      
      const data = await axios.post(`${API_URL}/auth/change-password`, passwordData)
      ElMessage.success('密码修改成功！')
      
      return data
    } catch (err) {
      error.value = err.response?.data?.message || '修改密码失败，请稍后再试'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新用户资料
  const updateProfile = async (profileData) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await axios.put(`${API_URL}/auth/profile`, profileData)
      user.value = { ...user.value, ...response.data }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || '更新个人资料失败，请稍后再试'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    // 状态
    user,
    token,
    loading,
    error,
    
    // 计算属性
    isAuthenticated,
    userInfo,
    isAdmin,
    
    // 方法
    login,
    register,
    forgotPassword,
    resetPassword,
    fetchUserInfo,
    logout,
    initAuth,
    changePassword,
    updateProfile
  }
}) 