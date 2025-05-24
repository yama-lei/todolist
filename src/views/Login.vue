<template>
  <div class="login-container">
    <div class="login-background"></div>
    
    <div class="login-card">
      <div class="login-header">
        <div class="app-logo">
          <el-icon class="logo-icon"><Sunny /></el-icon>
          <h1>植物日记</h1>
        </div>
        <p class="login-subtitle">欢迎回来，请登录您的账户</p>
      </div>
      
      <div class="login-form">
        <el-form 
          ref="loginForm" 
          :model="formModel" 
          :rules="rules" 
          label-position="top"
          @keyup.enter="handleLogin"
          class="login-form-container"
        >
          <el-form-item label="邮箱" prop="email">
            <el-input 
              v-model="formModel.email" 
              placeholder="请输入邮箱" 
              type="email"
              prefix-icon="Message"
              clearable
              :input-style="{ height: '44px' }"
              autocomplete="email"
            />
          </el-form-item>
          
          <el-form-item label="密码" prop="password">
            <el-input 
              v-model="formModel.password" 
              type="password" 
              placeholder="请输入密码" 
              prefix-icon="Lock"
              show-password
              clearable
              :input-style="{ height: '44px' }"
              autocomplete="current-password"
            />
          </el-form-item>
          
          <!--           <div class="form-options">
            <el-checkbox v-model="formModel.remember" size="large">记住我</el-checkbox>
            <router-link to="/forgot-password" class="forgot-link">忘记密码?</router-link>
          </div>-->
          
          <el-form-item>
            <el-button 
              type="primary" 
              class="login-button" 
              :loading="authStore.loading"
              @click="handleLogin"
              size="large"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-divider">
          <span>或者</span>
        </div>
        
        <div class="register-link">
          <span>还没有账号?</span>
          <router-link to="/register">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Sunny, Message, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'LoginPage',
  components: {
    Sunny,
    Message,
    Lock
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const loginForm = ref(null)
    
    const formData = reactive({
      email: '',
      password: '',
      remember: false
    })
    
    const rules = {
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      if (!loginForm.value) return
      
      await loginForm.value.validate(async (valid) => {
        if (valid) {
          try {
            await authStore.login({
              email: formData.email,
              password: formData.password,
              remember: formData.remember
            })
            
            // 成功登录后，如果有重定向路径，则跳转到对应页面
            const redirectPath = route.query.redirect || '/'
            router.push(redirectPath)
          } catch (error) {
            // 错误已在authStore中处理
            console.error('登录失败:', error)
          }
        } else {
          ElMessage.warning('请正确填写登录信息')
          return false
        }
      })
    }
    
    return {
      loginForm,
      formModel: formData,
      rules,
      authStore,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f0f2f5;
  position: relative;
  overflow: hidden;
  justify-content: center;
  align-items: center;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(120deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.3) 100%);
  z-index: 0;
}

.login-card {
  width: 100%;
  max-width: 420px;
  margin: 20px;
  padding: 36px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  z-index: 2;
  position: relative;
  backdrop-filter: blur(10px);
  transition: transform 0.3s, box-shadow 0.3s;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.login-header {
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
  font-size: 52px;
  color: #4caf50;
  margin-bottom: 10px;
  filter: drop-shadow(0 2px 5px rgba(76, 175, 80, 0.3));
}

.app-logo h1 {
  font-size: 28px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.login-subtitle {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.login-form {
  margin-top: 20px;
}

.login-form-container :deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  padding-bottom: 6px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.forgot-link {
  color: #4caf50;
  text-decoration: none;
  transition: color 0.3s;
  font-weight: 500;
}

.forgot-link:hover {
  color: #388e3c;
  text-decoration: underline;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border: none;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.login-button:hover {
  background: linear-gradient(135deg, #43a047, #2e7d32);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  transform: translateY(-2px);
}

.login-divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #999;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #eee;
}

.login-divider span {
  padding: 0 16px;
  font-size: 14px;
}

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 15px;
  color: #666;
}

.register-link a {
  color: #4caf50;
  font-weight: 500;
  text-decoration: none;
  margin-left: 8px;
  transition: color 0.3s;
}

.register-link a:hover {
  color: #388e3c;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .login-card {
    padding: 24px;
    margin: 16px;
  }
}
</style> 