<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="app-logo">
          <el-icon class="logo-icon"><Sunny /></el-icon>
          <h1>植物日记</h1>
        </div>
        <p class="register-subtitle">创建您的新账号</p>
      </div>

      <div class="register-form">
        <el-form
          ref="formRef"
          :model="registerForm"
          :rules="rules"
          label-position="top"
          @keyup.enter="handleRegister"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item label="电子邮箱" prop="email">
            <el-input
              v-model="registerForm.email"
              type="email"
              placeholder="请输入电子邮箱"
              prefix-icon="Message"
              clearable
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
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
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-link">
          已有账号？
          <router-link to="/login" class="login-text"> 立即登录 </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Sunny, User, Message, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'RegisterPage',
  components: {
    Sunny,
    User,
    Message,
    Lock
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    // 表单引用（用于调用 validate）
    const formRef = ref(null)

    // 表单数据模型
    const registerForm = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreement: false
    })

    // 验证两次密码是否一致
    const validatePass2 = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== registerForm.password) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }

    // 验证协议是否勾选
    const validateAgreement = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请阅读并同意服务条款和隐私政策'))
      } else {
        callback()
      }
    }

    // 表单验证规则
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度应在3到20个字符之间', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入电子邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的电子邮箱地址', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, validator: validatePass2, trigger: 'blur' }
      ],
      agreement: [
        { validator: validateAgreement, trigger: 'change' }
      ]
    }

    // 提交注册逻辑
    const handleRegister = async () => {
      if (!formRef.value) return

      await formRef.value.validate(async (valid) => {
        if (valid) {
          try {
            await authStore.register({
              username: registerForm.username,
              email: registerForm.email,
              password: registerForm.password
            })

            ElMessage.success('注册成功！即将为您跳转到登录页面。')

            setTimeout(() => {
              router.push('/login')
            }, 2000)
          } catch (error) {
            console.error('注册失败:', error)
          }
        } else {
          ElMessage.warning('请完成所有必填项并正确填写')
          return false
        }
      })
    }

    return {
      formRef,
      registerForm,
      rules,
      authStore,
      handleRegister
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.register-card {
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

.register-header {
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

.register-subtitle {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.register-form {
  margin-top: 20px;
}

.submit-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border: none;
}


.terms-link:hover {
  text-decoration: underline;
}

.login-link {
  text-align: center;
  margin-top: 30px;
  color: #666;
  font-size: 14px;
}

.login-text {
  color: #4caf50;
  text-decoration: none;
  font-weight: 600;
}

.login-text:hover {
  text-decoration: underline;
}
</style>