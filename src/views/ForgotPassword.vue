<template>
  <div class="forgot-container">
    <div class="forgot-card">
      <div class="forgot-header">
        <div class="app-logo">
          <el-icon class="logo-icon"><Sunny /></el-icon>
          <h1>植物日记</h1>
        </div>
        <p class="forgot-subtitle">找回密码</p>
      </div>
      
      <div class="forgot-form">
        <p class="instruction">请输入您注册时使用的电子邮箱地址，我们将向您发送密码重置链接。</p>
        
        <el-form 
          ref="forgotForm" 
          :model="forgotForm" 
          :rules="rules" 
          label-position="top"
          @keyup.enter="handleSubmit"
        >
          <el-form-item label="电子邮箱" prop="email">
            <el-input 
              v-model="forgotForm.email" 
              type="email" 
              placeholder="请输入您的邮箱地址" 
              prefix-icon="Message"
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
              发送重置链接
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Sunny, Message, Back } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'ForgotPasswordPage',
  components: {
    Sunny,
    Message,
    Back
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const forgotForm = ref(null)
    
    const formData = reactive({
      email: ''
    })
    
    const rules = {
      email: [
        { required: true, message: '请输入电子邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的电子邮箱地址', trigger: 'blur' }
      ]
    }
    
    const handleSubmit = async () => {
      if (!forgotForm.value) return
      
      await forgotForm.value.validate(async (valid) => {
        if (valid) {
          try {
            await authStore.forgotPassword(formData.email)
            
            // 成功发送重置邮件后提示用户
            ElMessage.success('密码重置链接已发送到您的邮箱，请查收！')
            
            // 短暂延迟后跳转到登录页
            setTimeout(() => {
              router.push('/login')
            }, 3001)
          } catch (error) {
            // 错误已在authStore中处理
            console.error('发送重置邮件失败:', error)
          }
        } else {
          ElMessage.warning('请正确填写电子邮箱')
          return false
        }
      })
    }
    
    return {
      forgotForm,
      forgotForm: formData,
      rules,
      authStore,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.forgot-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.forgot-card {
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

.forgot-header {
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

.forgot-subtitle {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.forgot-form {
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

.forgot-decoration {
  position: fixed;
  top: -20px;
  right: -20px;
  width: 50%;
  max-width: 700px;
  opacity: 0.5;
  z-index: 1;
}

.forgot-decoration img {
  width: 100%;
  height: auto;
}

@media (max-width: 768px) {
  .forgot-card {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
    padding: 30px 20px;
  }
  
  .forgot-decoration {
    display: none;
  }
}
</style> 