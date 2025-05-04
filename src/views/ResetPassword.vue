<template>
  <div class="reset-container">
    <div class="reset-card">
      <div class="reset-header">
        <div class="app-logo">
          <el-icon class="logo-icon"><Sunny /></el-icon>
          <h1>植物日记</h1>
        </div>
        <p class="reset-subtitle">重置您的账户密码</p>
      </div>
      
      <div class="reset-form">
        <p class="instruction">请设置您的新密码。密码应至少为6个字符，并包含数字和字母。</p>
        
        <el-form 
          ref="resetForm" 
          :model="resetForm" 
          :rules="rules" 
          label-position="top"
          @keyup.enter="handleSubmit"
        >
          <el-form-item label="新密码" prop="password">
            <el-input 
              v-model="resetForm.password" 
              type="password" 
              placeholder="请输入新密码" 
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input 
              v-model="resetForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入新密码" 
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              class="submit-button" 
              :loading="authStore.loading"
              @click="handleSubmit"
            >
              重置密码
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="back-link">
          <router-link to="/login">
            <el-icon><Back /></el-icon> 返回登录页
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Sunny, Lock, Back } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'ResetPasswordPage',
  components: {
    Sunny,
    Lock,
    Back
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const resetForm = ref(null)
    
    // 从路由参数中获取重置令牌
    const token = route.params.token
    
    const formData = reactive({
      password: '',
      confirmPassword: ''
    })
    
    // 验证密码是否一致
    const validatePass2 = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== formData.password) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }
    
    const rules = {
      password: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, validator: validatePass2, trigger: 'blur' }
      ]
    }
    
    const handleSubmit = async () => {
      if (!resetForm.value) return
      
      if (!token) {
        ElMessage.error('无效的重置链接，请重新获取')
        router.push('/forgot-password')
        return
      }
      
      await resetForm.value.validate(async (valid) => {
        if (valid) {
          try {
            await authStore.resetPassword({
              token,
              password: formData.password
            })
            
            // 成功重置后提示用户
            ElMessage.success('密码已成功重置，请使用新密码登录！')
            
            // 短暂延迟后跳转到登录页
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          } catch (error) {
            // 错误已在authStore中处理
            console.error('重置密码失败:', error)
          }
        } else {
          ElMessage.warning('请正确填写密码信息')
          return false
        }
      })
    }
    
    return {
      resetForm,
      resetForm: formData,
      rules,
      authStore,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.reset-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;
}

.reset-card {
  width: 100%;
  max-width: 450px;
  margin: auto;
  padding: 40px;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  z-index: 2;
  position: relative;
}

.reset-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.logo-icon {
  font-size: 48px;
  color: #4caf50;
  margin-bottom: 10px;
}

.app-logo h1 {
  font-size: 28px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.reset-subtitle {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.reset-form {
  margin-top: 20px;
}

.instruction {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.submit-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border: none;
}

.back-link {
  text-align: center;
  margin-top: 30px;
}

.back-link a {
  display: inline-flex;
  align-items: center;
  color: #4caf50;
  text-decoration: none;
  font-size: 14px;
}

.back-link a:hover {
  text-decoration: underline;
}

.back-link .el-icon {
  margin-right: 5px;
}

.reset-decoration {
  position: fixed;
  top: -20px;
  left: -20px;
  width: 50%;
  max-width: 700px;
  opacity: 0.5;
  z-index: 1;
}

.reset-decoration img {
  width: 100%;
  height: auto;
}

@media (max-width: 768px) {
  .reset-card {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
    padding: 30px 20px;
  }
  
  .reset-decoration {
    display: none;
  }
}
</style> 