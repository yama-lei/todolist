<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="page-header">
        <h1 class="page-title">个人资料</h1>
        <el-button type="primary" @click="enterEditMode" v-if="!isEditing">
          <el-icon><Edit /></el-icon>
          编辑资料
        </el-button>
        <div class="header-actions" v-else>
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveProfile" :loading="saving">保存</el-button>
        </div>
      </div>

      <div class="profile-content">
        <div class="profile-sidebar">
          <div class="avatar-container">
            <el-avatar :size="120" :src="editedProfile.avatar || userAvatar" @click="viewOrEditAvatar" class="clickable-avatar" v-if="!isEditing" />
            <div class="avatar-upload" v-else>
              <el-avatar :size="120" :src="editedProfile.avatar || userAvatar" />
              <div class="avatar-upload-mask">
                <el-popover
                  placement="bottom"
                  :width="300"
                  trigger="click"
                >
                  <template #reference>
                    <el-button type="primary" circle>
                      <el-icon><Camera /></el-icon>
                    </el-button>
                  </template>
                  <div class="avatar-options">
                    <div class="avatar-section">
                      <h4>默认头像</h4>
                      <div class="default-avatars">
                        <div 
                          v-for="(avatar, index) in defaultAvatars" 
                          :key="index"
                          class="default-avatar-item"
                          @click="selectDefaultAvatar(avatar)"
                        >
                          <el-avatar :size="50" :src="avatar" />
                        </div>
                      </div>
                    </div>
                    <div class="avatar-section">
                      <h4>上传头像</h4>
                      <el-upload
                        class="avatar-uploader"
                        action="#"
                        :auto-upload="false"
                        :show-file-list="false"
                        :on-change="handleAvatarChange"
                        accept="image/*"
                      >
                        <el-button type="primary">
                          <el-icon><Upload /></el-icon>
                          选择图片
                        </el-button>
                      </el-upload>
                    </div>
                  </div>
                </el-popover>
              </div>
            </div>
            <h2 class="username">{{ authStore.userInfo.username }}</h2>
            <div class="user-level">
              <el-tag type="success">等级 {{ userLevel }}</el-tag>
            </div>
          </div>

          <div class="sidebar-stats">
            <div class="stat-item">
              <div class="stat-value">{{ completedTasksCount }}</div>
              <div class="stat-label">已完成任务</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ plantCount }}</div>
              <div class="stat-label">植物数量</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ currencyStore.coins }}</div>
              <div class="stat-label">金币</div>
            </div>
          </div>
        </div>

        <div class="profile-details">
          <el-form :model="editedProfile" label-position="top" :disabled="!isEditing">
            <div class="form-section">
              <h3 class="section-title">基本信息</h3>
              <el-form-item label="用户名">
                <el-input v-model="editedProfile.username" placeholder="请输入用户名" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="editedProfile.email" placeholder="请输入邮箱" disabled />
              </el-form-item>
              <el-form-item label="性别">
                <el-select v-model="editedProfile.gender" placeholder="请选择性别">
                  <el-option label="男" value="male" />
                  <el-option label="女" value="female" />
                  <el-option label="保密" value="secret" />
                </el-select>
              </el-form-item>
              <el-form-item label="生日">
                <el-date-picker
                  v-model="editedProfile.birthday"
                  type="date"
                  placeholder="请选择生日"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disabledDate"
                  clearable
                />
              </el-form-item>
              <el-form-item label="年龄">
                <el-input :model-value="computedAge" disabled>
                  <template #append>岁</template>
                </el-input>
              </el-form-item>
              <el-form-item label="所在地">
                <el-input v-model="editedProfile.location" placeholder="请输入所在地" />
              </el-form-item>
              <el-form-item label="个性签名">
                <el-input 
                  v-model="editedProfile.signature" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="写下你的个性签名..." 
                />
              </el-form-item>
              <el-form-item label="个人简介">
                <el-input 
                  v-model="editedProfile.bio" 
                  type="textarea" 
                  :rows="4" 
                  placeholder="介绍一下自己吧..." 
                />
              </el-form-item>
            </div>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="30%"
    >
      <el-form :model="passwordForm" label-width="120px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            show-password 
            placeholder="请输入当前密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            show-password 
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            show-password 
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :loading="changingPassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePlantStore } from '../stores/plant'
import { useTaskStore } from '../stores/task'
import { useCurrencyStore } from '../stores/currency'
import { Edit, Camera, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElLoading } from 'element-plus'
import ossApi from '@/services/ossApi'

// 获取store实例
const authStore = useAuthStore()
const plantStore = usePlantStore()
const taskStore = useTaskStore()
const currencyStore = useCurrencyStore()

// 基本数据
const isEditing = ref(false)
const saving = ref(false)
const editedProfile = ref({
  username: authStore.userInfo.username || '',
  email: authStore.userInfo.email || '',
  avatar: authStore.userInfo.avatar || '',
  bio: authStore.userInfo.bio || '',
  gender: authStore.userInfo.gender || 'secret',
  birthday: authStore.userInfo.birthday || '',
  location: authStore.userInfo.location || '',
  signature: authStore.userInfo.signature || ''
})

// 默认头像列表
const defaultAvatars = [
  '/avatars/default1.png',
  '/avatars/default2.png',
  '/avatars/default3.png',
  '/avatars/default4.png',
  '/avatars/default5.png',
  '/avatars/default6.png',
]

// 计算年龄
const computedAge = computed(() => {
  if (!editedProfile.value.birthday) return '保密';
  const birthDate = new Date(editedProfile.value.birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
});

// 禁用未来日期
const disabledDate = (time) => {
  return time.getTime() > Date.now();
};

// 计算属性
const userAvatar = computed(() => {
  return authStore.userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
})

const userLevel = computed(() => {
  return authStore.userInfo.level || 1
})

const completedTasksCount = computed(() => {
  return taskStore.completedTasks?.length || 0
})

const plantCount = computed(() => {
  return plantStore.plants?.length || 0
})

// 修改密码相关
const showPasswordDialog = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 选择默认头像
const selectDefaultAvatar = (avatar) => {
  editedProfile.value.avatar = avatar
}

// 处理头像变更
const handleAvatarChange = async (file) => {
  try {
    // 文件类型检查
    const isImage = file.raw.type.startsWith('image/')
    if (!isImage) {
      ElMessage.error('只能上传图片文件！')
      return
    }
    
    // 文件大小检查（限制为2MB）
    const isLt2M = file.raw.size / 1024 / 1024 < 2
    if (!isLt2M) {
      ElMessage.error('图片大小不能超过2MB！')
      return
    }
    
    // 显示上传中的加载状态
    const loading = ElLoading.service({
      lock: true,
      text: '头像上传中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    try {
      // 上传图片到OSS
      const fileUrl = await ossApi.uploadFile(file.raw, 'avatars/')
      console.log('头像上传成功，URL:', fileUrl)
      
      // 更新头像URL
      editedProfile.value.avatar = fileUrl
      
      ElMessage.success('头像上传成功')
    } finally {
      loading.close()
    }
  } catch (error) {
    console.error('上传头像失败:', error)
    ElMessage.error('上传头像失败，请重试')
  }
}

// 加载用户数据
onMounted(async () => {
  try {
    await authStore.fetchUserInfo()
    // 更新本地编辑数据
    editedProfile.value = {
      username: authStore.userInfo.username || '',
      email: authStore.userInfo.email || '',
      avatar: authStore.userInfo.avatar || '',
      bio: authStore.userInfo.bio || '',
      gender: authStore.userInfo.gender || 'secret',
      birthday: authStore.userInfo.birthday || '',
      location: authStore.userInfo.location || '',
      signature: authStore.userInfo.signature || ''
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    ElMessage.error('加载用户信息失败')
  }
})

// 进入编辑模式
const enterEditMode = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  // 重置编辑数据
  editedProfile.value = {
    username: authStore.userInfo.username || '',
    email: authStore.userInfo.email || '',
    avatar: authStore.userInfo.avatar || '',
    bio: authStore.userInfo.bio || '',
    gender: authStore.userInfo.gender || 'secret',
    birthday: authStore.userInfo.birthday || '',
    location: authStore.userInfo.location || '',
    signature: authStore.userInfo.signature || ''
  }
}

// 保存个人资料
const saveProfile = async () => {
  saving.value = true
  try {
    // 调用API更新用户资料
    await authStore.updateProfile(editedProfile.value)
    ElMessage.success('个人资料更新成功')
    isEditing.value = false
  } catch (error) {
    console.error('更新个人资料失败:', error)
    ElMessage.error('更新个人资料失败')
  } finally {
    saving.value = false
  }
}

// 显示修改密码对话框
const showChangePasswordDialog = () => {
  showPasswordDialog.value = true
  // 重置表单
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    changingPassword.value = true
    try {
      await authStore.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      ElMessage.success('密码修改成功')
      showPasswordDialog.value = false
    } catch (error) {
      console.error('修改密码失败:', error)
    } finally {
      changingPassword.value = false
    }
  })
}

// 查看或修改头像
const viewOrEditAvatar = () => {
  if (isEditing.value) {
    // 打开头像编辑弹窗
    ElMessage.info('进入头像编辑模式');
  } else {
    // 查看头像逻辑
    const avatarUrl = editedProfile.value.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
    window.open(avatarUrl, '_blank'); // 打开头像图片
  }
}

// 显示头像悬停提示文字
const showAvatarHover = ref(false)
</script>

<style scoped>
.profile-page {
  padding: 20px;
  min-height: 100vh;
}

.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.page-title {
  font-size: 24px;
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.profile-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

.profile-sidebar {
  background-color: #f9fafc;
  border-radius: 12px;
  padding: 24px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.username {
  margin: 16px 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.user-level {
  margin-bottom: 16px;
}

.sidebar-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.stat-item {
  text-align: center;
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.profile-details {
  padding: 16px;
}

.form-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  color: #303133;
}

.avatar-upload {
  position: relative;
}

.avatar-upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-upload:hover .avatar-upload-mask {
  opacity: 1;
}

.avatar-icon {
  font-size: 24px;
  color: white;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
  
  .profile-sidebar {
    padding: 16px;
  }
  
  .sidebar-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

.el-form-item {
  margin-bottom: 20px;
}

.el-select {
  width: 100%;
}

.el-date-picker {
  width: 100%;
}

.avatar-options {
  padding: 16px;
}

.avatar-section {
  margin-bottom: 20px;
}

.avatar-section h4 {
  margin: 0 0 12px 0;
  color: #606266;
}

.default-avatars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.default-avatar-item {
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.default-avatar-item:hover {
  transform: scale(1.1);
}

.avatar-uploader {
  text-align: center;
}

.avatar-upload-mask {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.3);
}

.avatar-hover-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.clickable-avatar {
  cursor: pointer;
}
</style>