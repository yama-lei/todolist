import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 认证相关的API服务
const API_URL = process.env.VUE_APP_API_URL || 'http://115.175.12.31/plantodo/api'

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
      
      // 用户注册成功后，自动创建5种默认植物
      try {
        // 获取token
        const registrationToken = response.data.token
        
        // 设置axios默认请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${registrationToken}`
        
        // 创建5种默认植物
        const defaultPlants = [
          { name: '绯色絮语', type: '玫瑰', emoji: '🌹', isMainPlant: true },
          { name: '沙屿星芒', type: '仙人掌', emoji: '🌵', isMainPlant: false },
          { name: '冰爵士', type: '郁金香', emoji: '🌸', isMainPlant: false },
          { name: '云归处', type: '白百何', emoji: '🌲', isMainPlant: false },
          { name: '日轮礼赞', type: '向日葵', emoji: '🌻', isMainPlant: false }
        ]
        
        // 依次创建每个植物
        for (const plant of defaultPlants) {
          await axios.post(`${API_URL}/plants`, plant)
        }
        
        console.log('已成功为新用户创建5个默认植物')
      } catch (plantError) {
        console.error('为新用户创建植物失败:', plantError)
        // 不阻止注册流程，即使植物创建失败
      }
      
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
      // 确保更新完整的用户信息，包括头像
      if (response.data) {
        // 如果服务器返回了完整的用户对象，直接替换
        if (response.data.avatar !== undefined) {
          user.value = response.data
        } else {
          // 如果服务器只返回了部分字段，保留其他字段
          user.value = { ...user.value, ...response.data }
          // 特别确保avatar字段得到保留
          if (profileData.avatar && !response.data.avatar) {
            user.value.avatar = profileData.avatar
          }
        }
      }
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