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
            <div class="stat-item achievement">
              <div class="stat-icon">
                <el-icon><Trophy /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">一路走来，你已经完成了 <span class="highlight">{{ completedTasksCount }}</span> 个任务</div>
              </div>
            </div>
            <div class="stat-item companion">
              <div class="stat-icon">
                <el-icon><Sunny /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">你的植物朋友们，已经陪伴了你 <span class="highlight">{{ plantDays }}</span> 天</div>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-details">
          <el-form :model="editedProfile" label-position="top" :disabled="!isEditing" class="modern-form">
            <div class="form-section">
              <h3 class="section-title">基本信息</h3>
              <el-form-item label="用户名" class="form-item-animated">
                <el-input v-model="editedProfile.username" placeholder="请输入用户名" class="modern-input" />
              </el-form-item>
              <el-form-item label="邮箱" class="form-item-animated">
                <el-input v-model="editedProfile.email" placeholder="请输入邮箱" disabled class="modern-input" />
              </el-form-item>
              <el-form-item label="性别" class="form-item-animated">
                <el-select v-model="editedProfile.gender" placeholder="请选择性别" class="modern-select">
                  <el-option label="男" value="male" />
                  <el-option label="女" value="female" />
                  <el-option label="保密" value="secret" />
                  <el-option label="武装直升机" value="gunship" />
                </el-select>
              </el-form-item>
              <el-form-item label="生日" class="form-item-animated">
                <el-date-picker
                  v-model="editedProfile.birthday"
                  type="date"
                  placeholder="请选择生日"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disabledDate"
                  clearable
                  class="modern-date-picker"
                />
              </el-form-item>
              <el-form-item label="年龄" class="form-item-animated">
                <el-input :model-value="computedAge" disabled class="modern-input">
                  <template #append>岁</template>
                </el-input>
              </el-form-item>
              <el-form-item label="所在地" class="form-item-animated">
                <el-input v-model="editedProfile.location" placeholder="请输入所在地" class="modern-input" />
              </el-form-item>
              <el-form-item label="个性签名" class="form-item-animated">
                <el-input 
                  v-model="editedProfile.signature" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="写下你的个性签名..." 
                  class="modern-textarea"
                />
              </el-form-item>
              <el-form-item label="个人简介" class="form-item-animated">
                <el-input 
                  v-model="editedProfile.bio" 
                  type="textarea" 
                  :rows="4" 
                  placeholder="介绍一下自己吧..." 
                  class="modern-textarea"
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
      custom-class="modern-dialog"
    >
      <el-form :model="passwordForm" label-width="120px" :rules="passwordRules" ref="passwordFormRef" class="modern-form">
        <el-form-item label="当前密码" prop="currentPassword" class="form-item-animated">
          <el-input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            show-password 
            placeholder="请输入当前密码"
            class="modern-input"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword" class="form-item-animated">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            show-password 
            placeholder="请输入新密码"
            class="modern-input"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword" class="form-item-animated">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            show-password 
            placeholder="请再次输入新密码"
            class="modern-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPasswordDialog = false" class="cancel-button">取消</el-button>
          <el-button type="primary" @click="changePassword" :loading="changingPassword" class="save-button">
            确认修改
          </el-button>
        </div>
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
import { Edit, Camera, Upload, Trophy, Sunny } from '@element-plus/icons-vue'
import { ElMessage, ElLoading } from 'element-plus'
import ossApi from '@/services/ossApi'
    
// 计算植物陪伴的天数
const plantDays = computed(() => {
      if (plantStore.plants.length === 0) return 0
      
      // 使用第一个植物的创建时间计算
      const firstPlant = plantStore.plants[0]
      if (!firstPlant || !firstPlant.createdAt) return 0
      
      const createdDate = new Date(firstPlant.createdAt)
      const today = new Date()
      const diffTime = Math.abs(today - createdDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays
    })
    
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
    const isLt2M = file.raw.size / 1024 / 1024 < 5
    if (!isLt2M) {
      ElMessage.error('图片大小不能超过5MB！')
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
    // 强制刷新用户信息
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
    
    console.log('用户头像URL:', authStore.userInfo.avatar)
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
    // 确保头像URL也被保存
    const profileToSave = { ...editedProfile.value }
    
    // 调用API更新用户资料
    await authStore.updateProfile(profileToSave)
    
    // 重新获取用户信息以确保数据同步
    await authStore.fetchUserInfo()
    
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
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 24px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  font-weight: 600;
  position: relative;
  padding-left: 16px;
}

.page-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(to bottom, #42b983, #2d9cdb);
  border-radius: 2px;
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
  background: linear-gradient(145deg, #f9fafc, #f5f7fa);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: fit-content;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.clickable-avatar {
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.clickable-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.username {
  margin: 16px 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.user-level {
  margin-bottom: 16px;
}

.user-level .el-tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.sidebar-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.stat-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: linear-gradient(145deg, #ffffff, #f9fafc);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.achievement .stat-icon {
  background: linear-gradient(135deg, #FFA53E, #FF7643);
  color: white;
  font-size: 20px;
}

.companion .stat-icon {
  background: linear-gradient(135deg, #50C4ED, #7FDBFF);
  color: white;
  font-size: 20px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  line-height: 1.5;
}

.highlight {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #42b983, #2d9cdb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  padding: 0 2px;
}

.profile-details {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.form-section {
  padding: 0 16px;
}

.section-title {
  font-size: 18px;
  margin: 16px 0;
  padding: 12px 0;
  color: #303133;
  font-weight: 600;
  position: relative;
  padding-left: 16px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: linear-gradient(to bottom, #42b983, #2d9cdb);
  border-radius: 2px;
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
  font-weight: 600;
}

.default-avatars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.default-avatar-item {
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.default-avatar-item:hover {
  transform: scale(1.1);
}

.default-avatar-item .el-avatar {
  border: 2px solid transparent;
  transition: all 0.3s;
}

.default-avatar-item:hover .el-avatar {
  border-color: #42b983;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
}

.avatar-uploader {
  text-align: center;
}

.avatar-uploader :deep(.el-button) {
  padding: 10px 20px;
  border-radius: 30px;
}

.clickable-avatar {
  cursor: pointer;
}

/* 美化表单元素 */
.modern-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #606266;
  padding-bottom: 8px;
}

.modern-input :deep(.el-input__wrapper),
.modern-textarea :deep(.el-textarea__inner),
.modern-date-picker :deep(.el-input__wrapper),
.modern-select :deep(.el-input__wrapper) {
  border-radius: 10px;
  border: 1px solid #e0e7ff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: all 0.3s;
}

.modern-input :deep(.el-input__wrapper:hover),
.modern-textarea :deep(.el-textarea__inner:hover),
.modern-date-picker :deep(.el-input__wrapper:hover),
.modern-select :deep(.el-input__wrapper:hover) {
  border-color: #42b983;
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.1);
}

.modern-input :deep(.el-input__wrapper.is-focus),
.modern-textarea :deep(.el-textarea__inner:focus),
.modern-date-picker :deep(.el-input__wrapper.is-focus),
.modern-select :deep(.el-input__wrapper.is-focus) {
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.form-item-animated {
  animation: fadeInUp 0.5s ease;
  animation-fill-mode: both;
}

.form-item-animated:nth-child(1) {
  animation-delay: 0.1s;
}

.form-item-animated:nth-child(2) {
  animation-delay: 0.15s;
}

.form-item-animated:nth-child(3) {
  animation-delay: 0.2s;
}

.form-item-animated:nth-child(4) {
  animation-delay: 0.25s;
}

.form-item-animated:nth-child(5) {
  animation-delay: 0.3s;
}

.form-item-animated:nth-child(6) {
  animation-delay: 0.35s;
}

.form-item-animated:nth-child(7) {
  animation-delay: 0.4s;
}

.form-item-animated:nth-child(8) {
  animation-delay: 0.45s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 对话框样式 */
.modern-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #42b983, #2d9cdb);
}

.modern-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 20px;
  font-weight: 500;
}

.modern-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.9);
}

.modern-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;
}

.cancel-button,
.save-button {
  padding: 10px 20px;
  border-radius: 30px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button {
  background-color: #f5f7fa;
  color: #606266;
}

.cancel-button:hover {
  background-color: #e9ecf2;
}

.save-button {
  background: linear-gradient(135deg, #42b983, #2d9cdb);
  color: white;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(66, 185, 131, 0.35);
}

.save-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}
</style>