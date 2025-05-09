<template>
  <div class="home-page">
    <div class="container">
      <div class="grid-layout">
        
        <!-- -------------------------任务列表区--------------------------------------------------- -->
        <div class="tasks-section">
          <div class="tasks-header">
            <h2 class="section-title">任务</h2>
            <div class="task-actions">
              <button class="ai-insight-button" @click="showAiSummary">
                <div class="ai-insight-icon">
                  <div class="ai-pulse"></div>
                  <el-icon><Magic /></el-icon>
                </div>
                <span>智能粘贴板</span>
              </button>
              <button class="ai-insight-button" @click="showAiSummary">
                <div class="ai-insight-icon">
                  <div class="ai-pulse"></div>
                  <el-icon><Magic /></el-icon>
                </div>
                <span>AI洞察</span>
              </button>
            </div>
          </div>
          
          <!-- 单列任务列表 -->
          <div class="task-list-container">

              <!-- 个人任务区 -->
              <div class="task-group-section">
                <div class="group-header" @click="togglePersonalTasks">
                  <el-icon :class="{ 'rotate-icon': showPersonalTasks }"><ArrowDown /></el-icon>
                  <span>我的任务 ({{ taskStore.pendingTasks.length }})</span>
                </div>
                
                <transition name="fade">
                  <div v-show="showPersonalTasks" class="tasks-container">
                    <div v-if="taskStore.pendingTasks.length === 0" class="empty-tasks">
                      <el-empty description="暂无任务，创建一个吧！" />
                    </div>
                    
                    <draggable 
                      v-model="sortableTasks" 
                      tag="div" 
                      class="vertical-task-list" 
                      v-else
                      handle=".drag-handle"
                      item-key="id"
                      @end="onDragEnd"
                      :animation="200"
                    >
                      <template #item="{element: task}">
                        <div 
                          class="task-item"
                          :class="{'important': task.important}"
                        >
                          <div class="task-checkbox">
                            <el-checkbox @change="() => completeTask(task._id)"></el-checkbox>
                          </div>
                          <div class="drag-handle">
                            <el-icon><Menu /></el-icon>
                          </div>
                          <div class="task-info" @click="editTask(task)">
                            <div class="task-title-row">
                              <h3 class="task-title">{{ task.title }}</h3>
                              <div class="star-icon" @click.stop="toggleImportant(task._id)">
                                <el-icon :color="task.important ? '#F7BA2A' : '#DCDFE6'">
                                  <Star :filled="task.important" />
                                </el-icon>
                              </div>
                            </div>
                            <p class="task-description">{{ task.description }}</p>
                            <div class="task-footer">
                              <div v-if="task.deadline" class="task-deadline">
                                <el-tag type="info" size="small">
                                  <el-icon><Clock /></el-icon>
                                  {{ formatDeadline(task.deadline) }}
                                </el-tag>
                              </div>
                              <div class="task-actions">
                                <el-button type="danger" size="small" circle @click.stop="removeTask(task._id)">
                                  <el-icon><Delete /></el-icon>
                                </el-button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </template>
                    </draggable>
                  </div>
                </transition>
              </div>

            <!-- 系统任务折叠区 -->
              <div class="task-group-section">
               <div class="group-header" @click="toggleSystemTasks">
                 <el-icon :class="{ 'rotate-icon': showSystemTasks }"><ArrowDown /></el-icon>
                 <span>系统任务 ({{ systemTasks.length }})</span>
               </div>
               
               <transition name="fade">
                 <div v-show="showSystemTasks" class="tasks-container">
                   <div 
                     v-for="task in systemTasks" 
                     :key="task.id" 
                     class="task-item system-task"
                     :class="{ 'completed': task.completed }"
                   >
                     <div class="task-checkbox">
                       <el-checkbox 
                         :modelValue="task.completed"
                         @change="() => completeSystemTask(task._id)"
                         :disabled="task.completed">
                       </el-checkbox>
                     </div>
                     <div class="task-info" @click="task.completed ? null : viewSystemTask(task)">
                       <h3 class="task-title">{{ task.title }}</h3>
                       <p class="task-description">{{ task.description }}</p>
                       <div class="task-reward">
                         <el-tag type="warning" size="small">奖励: {{ task.reward }} 金币</el-tag>
                       </div>
                     </div>
                   </div>
                 </div>
               </transition>
             </div>

              <!-- 已完成任务折叠区域 -->
              <div class="task-group-section">
                <div class="group-header" @click="toggleCompletedTasks">
                  <el-icon :class="{ 'rotate-icon': showCompletedTasks }"><ArrowDown /></el-icon>
                  <span>已完成 ({{ taskStore.completedTasks.length }})</span>
                </div>
                
                <transition name="fade">
                  <div v-show="showCompletedTasks" class="tasks-container">
                    <div v-if="taskStore.completedTasks.length === 0" class="empty-tasks">
                      <el-empty description="暂无已完成任务" />
                    </div>
                    
                    <div class="vertical-task-list" v-else>
                      <div 
                        v-for="task in taskStore.completedTasks" 
                        :key="task.id" 
                        class="task-item completed"
                        :class="{'important': task.important}"
                      >
                        <div class="task-checkbox">
                          <el-checkbox :modelValue="true" disabled></el-checkbox>
                        </div>
                        <div class="task-info" @click="viewCompletedTask(task)">
                          <div class="task-title-row">
                            <h3 class="task-title">{{ task.title }}</h3>
                            <div class="star-icon" v-if="task.important">
                              <el-icon color="#BDBDBD"><Star filled /></el-icon>
                            </div>
                          </div>
                          <p class="task-description">{{ task.description }}</p>
                          <div class="task-footer">
                            <div v-if="task.deadline" class="task-deadline">
                              <el-tag type="info" size="small">
                                <el-icon><Clock /></el-icon>
                                {{ formatDeadline(task.deadline) }}
                              </el-tag>
                            </div>
                            <div class="task-completed-time">
                              完成于: {{ formatDate(task.completedAt) }}
                            </div>
                          </div>
                        </div>
                        <div class="task-actions">
                          <el-button type="danger" size="small" circle @click.stop="removeCompletedTask(task._id)">
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
          </div>
          
          <!-- 底部固定添加任务按钮 -->
          <div class="add-task-fixed-container">
            <button class="add-task-fixed-button" @click="showTaskAddDialog = true">
              <el-icon><Plus /></el-icon>
              <span>添加任务</span>
            </button>
          </div>
        </div>

        <!-- -------------------------植物区域--------------------------------------------------- -->
        <div class="plant-section">
          <div class="plant-container">
            <div class="plant-header">
              <h2 class="section-title">{{ plantStore.mainPlant ? plantStore.mainPlant.name : '尚未添加植物' }}</h2>
              <div class="plant-weather" v-if="plantStore.mainPlant">
                <div class="weather-options">
                  <span 
                    class="weather-option" 
                    :class="{ active: weather === 'sunny' }"
                    title="晴天"
                    @click="updateWeather('sunny')"
                  >☀️</span>
                  <span 
                    class="weather-option" 
                    :class="{ active: weather === 'rainy' }"
                    title="下雨"
                    @click="updateWeather('rainy')"
                  >🌧️</span>
                  <span 
                    class="weather-option" 
                    :class="{ active: weather === 'cloudy' }"
                    title="多云"
                    @click="updateWeather('cloudy')"
                  >☁️</span>
                </div>
              </div>
            </div>
            
            <div class="plant-display">
              <div class="plant-speech-container">
                <div class="plant-speech-bubble" v-if="showPlantSpeech">
                  <div class="speech-icon" v-if="currentPlantThought.icon">{{ currentPlantThought.icon }}</div>
                  <div class="speech-content">
                    <p class="speech-text">{{ currentPlantThought.message }}</p>
                    <div class="speech-meta">
                      <span class="speech-time">{{ formatShortTime(currentPlantThought.timestamp) }}</span>
                      <span class="speech-tag" v-if="currentPlantThought.tag">{{ currentPlantThought.tag }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="plant-main-container">
                <div class="plant-canvas-wrapper">
                  <WeatherCanvas :weather="weather" :width="300" :height="300" />
                  <div class="plant-emoji-container">
                    <img :src="getPlantImage(plantStore.mainPlant)" class="plant-image" alt="植物图片" />
                  </div>
                </div>
                
                <div class="plant-details">
                  <div class="plant-stats">
                    <el-tag type="success" size="large">等级: {{ plantStore.currentLevel }}</el-tag>
                    <el-tag type="primary" size="large">状态: {{ getPlantStateText() }}</el-tag>
                    <el-tag type="warning" size="large">心情: {{ getMoodText() }}</el-tag>
                  </div>
                  
                  <div class="plant-level-container">
                    <div class="plant-level">经验值: <span class="level-value">{{ plantStore.mainPlant?.experience || 0 }}/{{ (plantStore.mainPlant?.level || 1) * 100 }}</span></div>
                    <el-progress 
                      :percentage="experiencePercentage" 
                      :format="expFormat"
                      :stroke-width="10"
                      class="plant-exp-progress"
                    />
                  </div>
                  
                  <div class="plant-actions">
                    <el-button type="success" @click="listenToPlantThought">
                      <el-icon><ChatLineRound /></el-icon> 聆听植物心声
                    </el-button>
                    <el-button type="primary" @click="goToPlantChat">
                      <el-icon><ChatDotRound /></el-icon> 与植物聊天
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- AI 总结对话框 -->
    <el-dialog
      v-model="showAiSummaryDialog"
      title="AI 智能分析"
      width="60%"
      destroy-on-close
    >
      <div v-if="isAiSummaryLoading" class="ai-summary-loading">
        <el-skeleton :rows="6" animated />
      </div>
      <div v-else class="ai-summary-content">
        <div class="ai-summary-header">
          <el-avatar :size="40" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
          <h3>AI 助手</h3>
        </div>
        
        <!-- 任务数据摘要 -->
        <div class="summary-card">
          <h4 class="summary-title">任务概览</h4>
          <div class="summary-stats">
            <div class="stat-item">
              <div class="stat-value">{{ aiSummaryData?.taskSummary?.completedTasks || 0 }}</div>
              <div class="stat-label">已完成任务</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ aiSummaryData?.taskSummary?.pendingTasks || 0 }}</div>
              <div class="stat-label">待完成任务</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ aiSummaryData?.taskSummary?.completionRate || 0 }}%</div>
              <div class="stat-label">完成率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ aiSummaryData?.taskSummary?.thisWeekTasks || 0 }}</div>
              <div class="stat-label">本周完成</div>
            </div>
            <div class="stat-item" v-if="aiSummaryData?.taskSummary?.importantPending">
              <div class="stat-value">{{ aiSummaryData?.taskSummary?.importantPending }}</div>
              <div class="stat-label">重要待办</div>
            </div>
            <div class="stat-item" v-if="aiSummaryData?.taskSummary?.upcomingDeadlines">
              <div class="stat-value">{{ aiSummaryData?.taskSummary?.upcomingDeadlines }}</div>
              <div class="stat-label">即将到期</div>
            </div>
          </div>
        </div>
        
        <!-- AI 分析结果 -->
        <div class="ai-insights-section">
          <div class="insight-card">
            <div class="insight-header overview">
              <el-icon><DataAnalysis /></el-icon>
              <h4>总体评价</h4>
            </div>
            <div class="insight-content">
              {{ aiSummaryData?.analysis?.overview || '没有足够的数据进行分析' }}
            </div>
          </div>
          
          <div class="insight-card">
            <div class="insight-header achievements">
              <el-icon><Trophy /></el-icon>
              <h4>成就和进步</h4>
            </div>
            <div class="insight-content">
              {{ aiSummaryData?.analysis?.achievements || '继续完成任务来获得成就!' }}
            </div>
          </div>
          
          <div class="insight-card">
            <div class="insight-header suggestions">
              <el-icon><Lightning /></el-icon>
              <h4>改进建议</h4>
            </div>
            <div class="insight-content">
              {{ aiSummaryData?.analysis?.suggestions || '没有改进建议' }}
            </div>
          </div>
          
          <div class="insight-card">
            <div class="insight-header next-steps">
              <el-icon><Connection /></el-icon>
              <h4>下一步行动</h4>
            </div>
            <div class="insight-content">
              {{ aiSummaryData?.analysis?.nextSteps || '暂无行动计划建议' }}
            </div>
          </div>
        </div>
        
        <div class="ai-generated-note" v-if="aiSummaryData?.isAIGenerated === false">
          <el-alert
            title="AI生成暂时不可用，显示的是自动生成的建议"
            type="info"
            :closable="false"
          >
          </el-alert>
        </div>
      </div>
    </el-dialog>
    
    <!-- 任务编辑对话框 -->
    <el-dialog
      v-model="showTaskEditDialog"
      :title="isEditingTask ? '编辑任务' : '查看任务'"
      width="30%"
    >
      <template v-if="editingTask">
        <el-form :model="editingTask">
          <el-form-item label="标题" :required="isEditingTask">
            <el-input v-model="editingTask.title" placeholder="请输入任务标题" :disabled="!isEditingTask"></el-input>
          </el-form-item>
          <el-form-item label="描述">
            <el-input 
              v-model="editingTask.description" 
              type="textarea" 
              placeholder="请输入任务描述"
              :disabled="!isEditingTask"
            ></el-input>
          </el-form-item>
          <el-form-item label="截止日期" v-if="isEditingTask || editingTask.deadline">
            <el-date-picker
              v-model="editingTask.deadline"
              type="datetime"
              placeholder="选择截止日期时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              :disabled="!isEditingTask"
            />
          </el-form-item>
          <el-form-item label="重要性" v-if="!isSystemTask">
            <el-switch
              v-model="editingTask.important"
              active-color="#F7BA2A"
              inactive-color="#DCDFE6"
              :disabled="!isEditingTask"
            />
          </el-form-item>
          <el-form-item label="完成于" v-if="editingTask.completedAt">
            <div>{{ formatDate(editingTask.completedAt) }}</div>
          </el-form-item>
          <el-form-item label="奖励" v-if="isSystemTask">
            <el-tag type="warning" size="default">{{ editingTask.reward }} 金币</el-tag>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTaskEditDialog = false">{{ isEditingTask ? '取消' : '关闭' }}</el-button>
          <el-button type="primary" @click="saveTaskEdit" v-if="isEditingTask">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加任务对话框 -->
    <el-dialog
      v-model="showTaskAddDialog"
      title="创建新任务"
      width="30%"
      custom-class="task-add-dialog"
    >
      <div class="task-add-form">
        <div class="form-group">
          <label>任务标题</label>
          <el-input 
            v-model="newTask.title" 
            placeholder="输入任务标题" 
            class="task-input"
            ref="taskTitleInput"
          />
        </div>
        
        <div class="form-group">
          <label>任务描述</label>
          <el-input 
            v-model="newTask.description" 
            type="textarea" 
            placeholder="输入任务描述" 
            class="task-input" 
            :rows="3"
          />
        </div>
        
        <div class="form-options">
          <div class="deadline-option">
            <label>截止日期</label>
            <el-date-picker
              v-model="newTask.deadline"
              type="datetime"
              placeholder="选择截止日期"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </div>
          
          <div class="importance-option">
            <label>重要性</label>
            <div class="priority-selector">
              <div 
                class="priority-level" 
                :class="{ 'active': newTask.important }"
                @click="newTask.important = !newTask.important"
              >
                <el-icon><Star /></el-icon>
                <span>重要</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTaskAddDialog = false">取消</el-button>
          <el-button type="primary" @click="addTaskFromDialog" :disabled="!newTask.title.trim()">创建任务</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { usePlantStore } from '../stores/plant'
import { format, formatDistance } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Plus, Delete, Magic, ChatDotRound, Refresh, ArrowDown, Star, Clock, Menu, Close, DataAnalysis, Trophy, Lightning, Connection, ChatLineRound } from '@element-plus/icons-vue'
import WeatherCanvas from '@/components/WeatherCanvas.vue'
import PlantDialog from '@/components/PlantDialog.vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import insightsApi from '@/services/insightsApi'

// 导入植物图片
import plant1Level1 from '@/assets/images/plant/1-1.png'
import plant1Level2 from '@/assets/images/plant/1-2.png'
import plant1Level3 from '@/assets/images/plant/1-3.png'
import plant2Level1 from '@/assets/images/plant/2-1.png'
import plant2Level2 from '@/assets/images/plant/2-2.png'
import plant2Level3 from '@/assets/images/plant/2-3.png'
import plant3Level1 from '@/assets/images/plant/3-1.png'
import plant3Level2 from '@/assets/images/plant/3-2.png'
import plant3Level3 from '@/assets/images/plant/3-3.png'
import plant4Level1 from '@/assets/images/plant/4-1.png'
import plant4Level2 from '@/assets/images/plant/4-2.png'
import plant4Level3 from '@/assets/images/plant/4-3.png'
import plant5Level1 from '@/assets/images/plant/5-1.png'
import plant5Level2 from '@/assets/images/plant/5-2.png'
import plant5Level3 from '@/assets/images/plant/5-3.png'

export default {
  name: 'HomePage',
  components: {
    WeatherCanvas,
    PlantDialog,
    draggable,
    Plus,
    Delete,
    Magic,
    ChatDotRound,
    Refresh,
    ArrowDown,
    Star,
    Clock,
    Menu,
    Close,
    DataAnalysis,
    Trophy,
    Lightning,
    Connection,
    ChatLineRound
  },
  setup() {
    const router = useRouter()
    const taskStore = useTaskStore()
    const plantStore = usePlantStore()
    
    // 在组件挂载时获取任务数据
    onMounted(async () => {
      try {
        await Promise.all([
          taskStore.fetchTasks(),
          taskStore.fetchSystemTasks()
        ])
        console.log('首页任务数据加载成功')
      } catch (error) {
        console.error('加载任务数据失败:', error)
      }
    })
    
    const activeTaskTab = ref('personal')
    const taskTitleInput = ref(null)
    
    // 新任务相关
    const newTask = ref({
      title: '',
      description: '',
      deadline: '',
      important: false
    })
    
    // 添加任务对话框控制
    const showTaskAddDialog = ref(false)
    
    // 为兼容性保留但不使用
    const showInlineTaskForm = ref(false)
    
    // 所有任务分组的折叠控制
    const showSystemTasks = ref(true)
    const showPersonalTasks = ref(true)
    const showCompletedTasks = ref(false)
    
    // 任务编辑弹窗相关
    const showTaskEditDialog = ref(false)
    const editingTask = ref(null)
    const isEditingTask = ref(false)
    const isSystemTask = ref(false)
    
    // 植物相关设置
    const weather = ref(plantStore.mainPlant?.weather || 'sunny')
    const showPlantDialog = ref(false)
    const randomThought = ref('')
    
    // AI总结相关
    const showAiSummaryDialog = ref(false)
    const isAiSummaryLoading = ref(false)
    
    // 系统任务（未完成）
    const systemTasks = computed(() => {
      return taskStore.systemTasks || []
    })
    
    // 个人任务（可排序）
    const sortableTasks = computed({
      get: () => {
        return taskStore.pendingTasks.map(task => ({
          ...task,
          important: task.important || false
        }))
      },
      set: (value) => {
        taskStore.reorderTasks(value)
      }
    })
    
    // 拖拽结束后的回调
    const onDragEnd = () => {
      // 可以在这里添加任何拖拽结束后的逻辑
      console.log('Drag ended, tasks reordered')
    }
    
    // 切换任务重要性
    const toggleImportant = (taskId) => {
      taskStore.toggleTaskImportance(taskId)
    }
    
    // 切换系统任务显示
    const toggleSystemTasks = () => {
      showSystemTasks.value = !showSystemTasks.value
    }
    
    // 切换个人任务显示
    const togglePersonalTasks = () => {
      showPersonalTasks.value = !showPersonalTasks.value
    }
    
    // 切换已完成任务显示
    const toggleCompletedTasks = () => {
      showCompletedTasks.value = !showCompletedTasks.value
    }
    
    // 查看系统任务详情
    const viewSystemTask = (task) => {
      editingTask.value = { ...task }
      isEditingTask.value = false
      isSystemTask.value = true
      showTaskEditDialog.value = true
    }
    
    // 编辑个人任务
    const editTask = (task) => {
      editingTask.value = { ...task }
      isEditingTask.value = true
      isSystemTask.value = false
      showTaskEditDialog.value = true
    }
    
    // 查看已完成任务
    const viewCompletedTask = (task) => {
      editingTask.value = { ...task }
      isEditingTask.value = false
      isSystemTask.value = false
      showTaskEditDialog.value = true
    }
    
    // 保存任务编辑
    const saveTaskEdit = () => {
      if (editingTask.value && editingTask.value.title.trim()) {
        taskStore.updateTask(editingTask.value)
        showTaskEditDialog.value = false
      }
    }
    
    // 取消添加任务
    const cancelAddTask = () => {
      newTask.value.title = ''
      newTask.value.description = ''
      newTask.value.deadline = ''
      newTask.value.important = false
      showInlineTaskForm.value = false
      showTaskAddDialog.value = false
    }
    
    // 从对话框添加任务
    const addTaskFromDialog = () => {
      if (newTask.value.title.trim()) {
        taskStore.addTask({
          title: newTask.value.title,
          description: newTask.value.description,
          deadline: newTask.value.deadline,
          important: newTask.value.important
        })
        cancelAddTask()
      }
    }
    
    // 显示内联添加任务表单并聚焦输入框 - 保留但改为显示对话框
    const showInlineForm = () => {
      showTaskAddDialog.value = true
      nextTick(() => {
        if (taskTitleInput.value) {
          taskTitleInput.value.focus()
        }
      })
    }
    
    // 格式化截止日期
    const formatDeadline = (deadline) => {
      if (!deadline) return ''
      
      // 计算距离当前的时间
      const now = new Date()
      const deadlineDate = new Date(deadline)
      
      // 计算相对时间
      return formatDistance(deadlineDate, now, {
        addSuffix: true,
        locale: zhCN
      })
    }
    
    // 经验值百分比
    const experiencePercentage = computed(() => {
      if (!plantStore.mainPlant) return 0
      const currentExp = plantStore.mainPlant.experience || 0
      const level = plantStore.mainPlant.level || 1
      return Math.min(100, (currentExp / (level * 100)) * 100)
    })
    
    // 格式化经验值显示
    const expFormat = () => {
      if (!plantStore.mainPlant) return '0/100'
      const currentExp = plantStore.mainPlant.experience || 0
      const level = plantStore.mainPlant.level || 1
      return `${currentExp}/${level * 100}`
    }
    
    // 植物状态计算
    const plantState = computed(() => {
      return plantStore.mainPlant?.state || 'seedling'
    })
    
    // 植物心声相关
    const currentPlantThought = reactive({
      message: '',
      type: 'default',
      icon: '',
      tag: '',
      timestamp: new Date()
    })
    
    // 完成任务
    const completeTask = (id) => {
      taskStore.completeTask(id)
      if (plantStore.mainPlant) {
        plantStore.gainExperience(plantStore.mainPlant.id, 20)
      }
    }
    
    // 完成系统任务
    const completeSystemTask = (id) => {
      taskStore.completeSystemTask(id)
      if (plantStore.mainPlant) {
        plantStore.gainExperience(plantStore.mainPlant.id, 30)
      }
    }
    
    // 移除任务
    const removeTask = (id) => {
      taskStore.removeTask(id)
    }
    
    // 移除已完成任务
    const removeCompletedTask = (id) => {
      taskStore.removeCompletedTask(id)
    }
    
    // 更新天气方法
    const updateWeather = async (newWeather) => {
      if (plantStore.mainPlant) {
        // 获取有效的植物ID
        const plantId = plantStore.mainPlant._id || plantStore.mainPlant.id;
        
        if (!plantId) {
          console.error('无法更新天气: 植物ID无效', plantStore.mainPlant);
          ElMessage.error('无法更新天气：植物ID无效');
          return;
        }
        
        try {
          await plantStore.updatePlant(plantId, { weather: newWeather });
          weather.value = newWeather; // 更新本地状态
          ElMessage.success('植物环境已更新');
        } catch (error) {
          console.error('更新天气失败:', error);
          ElMessage.error(`更新失败: ${error.message || '未知错误'}`);
        }
      }
    }
    
    // 监听主植物变化
    watch(() => plantStore.mainPlant, async (newMainPlant) => {
      if (newMainPlant) {
        // 更新天气状态
        weather.value = newMainPlant.weather || 'sunny';
        
        // 更新植物心声
        try {
          const plantId = newMainPlant._id || newMainPlant.id;
          if (plantId) {
            const thoughts = await plantStore.fetchPlantThoughts(plantId);
            plantStore.thoughts = thoughts.map(thought => ({
              type: 'plant',
              content: thought.content,
              timestamp: thought.timestamp
            }));
          }
        } catch (error) {
          console.error('更新植物心声失败:', error);
        }
      }
    }, { immediate: true });

    // 初始化天气状态
    onMounted(() => {
      if (plantStore.mainPlant) {
        weather.value = plantStore.mainPlant.weather || 'sunny';
      }
    });
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
    }
    
    // 植物图片映射
    const plantImages = {
      '玫瑰': {
        1: plant1Level1,
        2: plant1Level2,
        3: plant1Level3
      },
      '仙人掌': {
        1: plant2Level1,
        2: plant2Level2,
        3: plant2Level3
      },
      '郁金香': {
        1: plant3Level1,
        2: plant3Level2,
        3: plant3Level3
      },
      '白百何': {
        1: plant4Level1,
        2: plant4Level2,
        3: plant4Level3
      },
      '向日葵': {
        1: plant5Level1,
        2: plant5Level2,
        3: plant5Level3
      }
    }
    
    // 获取植物图片
    const getPlantImage = (plant) => {
      if (!plant) return plant1Level1
      
      const type = plant.type?.trim() // 移除可能存在的前后空格
      const level = plant.level || 1
      
      // 检查植物类型和等级限制
      const clampLevel = Math.min(Math.max(level, 1), 3) // 限制等级在1-3之间
      
      // 根据植物类型返回对应图片
      if (type === '玫瑰') {
        return plantImages['玫瑰'][clampLevel]
      } else if (type === '仙人掌') {
        return plantImages['仙人掌'][clampLevel]
      } else if (type === '郁金香') {
        return plantImages['郁金香'][clampLevel]
      } else if (type === '白百何') {
        return plantImages['白百何'][clampLevel]
      } else if (type === '向日葵') {
        return plantImages['向日葵'][clampLevel]
      }
      
      // 默认返回第一张图片
      return plant1Level1
    }
    
    // 获取植物表情
    const getPlantEmoji = () => {
      if (!plantStore.mainPlant) return '🌱'
      return plantStore.mainPlant.emoji || '🌱'
    }
    
    // 获取植物状态文本
    const getPlantStateText = () => {
      if (!plantStore.mainPlant) return '成长中'
      
      const state = plantStore.mainPlant.state
      if (state === 'seedling') return '幼苗期'
      if (state === 'growing') return '成长期'
      if (state === 'mature') return '成熟期'
      return '成长中'
    }
    
    // 获取心情文本
    const getMoodText = () => {
      if (!plantStore.mainPlant) return '一般'
      
      const mood = plantStore.mainPlant.mood
      if (mood === 'happy') return '开心'
      if (mood === 'neutral') return '一般'
      if (mood === 'sad') return '难过'
      return '一般'
    }
    
    // 切换植物对话框
    const togglePlantDialog = () => {
      randomThought.value = generateRandomThought()
      showPlantDialog.value = !showPlantDialog.value
    }
    
    // 生成随机植物语录
    const generateRandomThought = () => {
      const thoughts = [
        "今天的任务完成得不错！",
        "再坚持一下，你就能完成所有任务了！",
        "谢谢你的照顾，我感觉自己在不断成长~",
        "每完成一个任务，我们都在一起进步！",
        "阳光很好，心情也很棒，今天一定能高效完成任务！",
        "不要担心未完成的事情，重要的是现在开始努力！",
        "我相信你有能力完成所有挑战！"
      ]
      return thoughts[Math.floor(Math.random() * thoughts.length)]
    }
    
    // 显示AI总结
    const showAiSummary = async () => {
      showAiSummaryDialog.value = true
      isAiSummaryLoading.value = true
      
      try {
        // 使用新的AI分析接口获取智能洞察
        const response = await insightsApi.getAIAnalysis()
        aiSummaryData.value = response.data
        
        isAiSummaryLoading.value = false
      } catch (error) {
        console.error('获取AI洞察失败:', error)
        ElMessage.error('获取AI洞察数据失败，请稍后再试')
        isAiSummaryLoading.value = false
      }
    }
    
    // AI总结数据
    const aiSummaryData = ref(null)
    
    // 计算系统任务完成率
    const calculateSystemTaskCompletion = () => {
      const completedCount = taskStore.systemTasks.filter(t => t.completed).length
      const totalCount = taskStore.systemTasks.length
      return Math.round((completedCount / totalCount) * 100)
    }
    
    // 生成植物心声
    const generatePlantThought = () => {
      // 获取当前时间
      const now = new Date()
      const hour = now.getHours()
      
      // 根据时间和任务生成不同类型的心声
      let thoughts = []
      
      // 问候类消息 (早上/下午/晚上)
      if (hour >= 5 && hour < 12) {
        thoughts.push({
          message: '早上好！今天阳光明媚，是完成任务的好日子！',
          type: 'motivation',
          icon: '🌞',
          tag: '早安问候'
        })
      } else if (hour >= 12 && hour < 18) {
        thoughts.push({
          message: '下午好！别忘了喝水，保持水分对我们都很重要~',
          type: 'tip',
          icon: '💧',
          tag: '健康提示'
        })
      } else {
        thoughts.push({
          message: '晚上好！回顾一下今天完成了哪些任务，规划明天的计划吧~',
          type: 'reminder',
          icon: '🌙',
          tag: '晚间提醒'
        })
      }
      
      // 任务提醒类消息
      if (taskStore.pendingTasks.length > 0) {
        thoughts.push({
          message: `你还有 ${taskStore.pendingTasks.length} 个任务待完成，加油！`,
          type: 'reminder',
          icon: '📝',
          tag: '任务提醒'
        })
        
        if (taskStore.pendingTasks.length > 0) {
          thoughts.push({
            message: `建议优先完成"${taskStore.pendingTasks[0].title}"任务`,
            type: 'reminder',
            icon: '🔔',
            tag: '优先事项'
          })
        }
      } else {
        thoughts.push({
          message: '太棒了！你已经完成了所有任务，可以好好放松一下~',
          type: 'motivation',
          icon: '🎉',
          tag: '鼓励'
        })
      }
      
      // 天气相关消息
      if (weather.value === 'sunny') {
        thoughts.push({
          message: '今天阳光真好，我感觉精力充沛！继续保持这样的积极性！',
          type: 'weather',
          icon: '☀️',
          tag: '天气'
        })
      } else if (weather.value === 'rainy') {
        thoughts.push({
          message: '下雨天适合在室内专注完成任务，也别忘了给我浇水~',
          type: 'weather',
          icon: '🌧️',
          tag: '天气'
        })
      } else if (weather.value === 'cloudy') {
        thoughts.push({
          message: '阴天不要紧，保持积极的心态比什么都重要！',
          type: 'weather',
          icon: '☁️',
          tag: '天气'
        })
      }
      
      // 随机选择一条心声
      const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)]
      
      // 更新心声状态
      currentPlantThought.message = randomThought.message
      currentPlantThought.type = randomThought.type
      currentPlantThought.icon = randomThought.icon
      currentPlantThought.tag = randomThought.tag
      currentPlantThought.timestamp = new Date()
    }
    
    // 刷新植物心声
    const listenToPlantThought = async () => {
      if (!plantStore.mainPlant) {
        ElMessage.warning('请先在花园中添加一个植物')
        return
      }
      
      // 检查植物ID是否有效
      if (!plantStore.mainPlant._id && !plantStore.mainPlant.id) {
        console.error('植物ID无效')
        ElMessage.warning('植物信息不完整，请重新选择植物')
        return
      }
      
      const plantId = plantStore.mainPlant._id || plantStore.mainPlant.id
      
      try {
        ElMessage.info('正在聆听植物的心声...')
        
        // 使用API生成心声，与PlantVoice.vue保持一致的参数
        const context = {
          weather: weather.value,
          timeOfDay: getTimeOfDay(),
          recentTasks: taskStore.completedTasks.slice(0, 3).map(task => ({
            id: task._id || task.id,
            title: task.title,
            completed: true
          }))
        }
        
        // 调用store中的方法生成心声，与PlantVoice.vue完全相同的调用方式
        const thought = await plantStore.generatePlantThought(plantId, context)
        
        if (thought) {
          // 更新心声状态
          currentPlantThought.message = thought.content
          currentPlantThought.type = thought.type || 'mood'
          currentPlantThought.icon = thought.icon || '🌱'
          currentPlantThought.tag = thought.tag || '植物心语'
          currentPlantThought.timestamp = new Date(thought.timestamp)
          
          // 显示气泡框
          showPlantSpeech.value = true
          
          ElMessage({
            message: '植物想和你说话了！',
            type: 'success'
          })
          
          // 延长悬浮气泡框显示时间
          setTimeout(() => {
            showPlantSpeech.value = false
          }, 15000)
        }
      } catch (error) {
        console.error('获取植物心声失败', error)
        ElMessage.error('获取植物心声失败，植物好像有点害羞...')
      }
    }
    
    // 获取当前时间段，与PlantVoice.vue一致
    const getTimeOfDay = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) return 'morning'
      if (hour >= 12 && hour < 18) return 'afternoon'
      return 'evening'
    }
    
    // 跳转到植物聊天页面
    const goToPlantChat = () => {
      router.push('/plant-chat')
    }
    
    // 在setup函数中添加
    const showPlantSpeech = ref(false)
    
    // 格式化时间为简短格式
    const formatShortTime = (time) => {
      if (!time) return ''
      return format(new Date(time), 'HH:mm')
    }
    
    return {
      taskStore,
      plantStore,
      taskTitleInput,
      activeTaskTab,
      newTask,
      showInlineTaskForm,
      showTaskAddDialog,
      experiencePercentage,
      expFormat,
      plantState,
      weather,
      showPlantDialog,
      randomThought,
      showAiSummaryDialog,
      isAiSummaryLoading,
      showCompletedTasks,
      showSystemTasks,
      showPersonalTasks,
      systemTasks,
      sortableTasks,
      showTaskEditDialog,
      editingTask,
      isEditingTask,
      isSystemTask,
      toggleCompletedTasks,
      toggleSystemTasks,
      togglePersonalTasks,
      toggleImportant,
      onDragEnd,
      formatDeadline,
      editTask,
      viewSystemTask,
      viewCompletedTask,
      saveTaskEdit,
      cancelAddTask,
      showInlineForm,
      completeTask,
      completeSystemTask,
      removeTask,
      removeCompletedTask,
      addTaskFromDialog,
      updateWeather,
      formatDate,
      getPlantImage,
      getPlantEmoji,
      getPlantStateText,
      getMoodText,
      togglePlantDialog,
      showAiSummary,
      calculateSystemTaskCompletion,
      currentPlantThought,
      listenToPlantThought,
      goToPlantChat,
      aiSummaryData,
      showPlantSpeech,
      formatShortTime
    }
  }
}
</script>

<style scoped>
.home-page {
  padding: 20px;
  min-height: 100vh;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.grid-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 30px;
}

/* 任务区域样式 */
.tasks-section {
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  background-color: #fff;
  padding: 24px;
  max-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
  flex-shrink: 0;
}

.section-title {
  font-size: 22px;
  margin: 0;
  color: #303133;
  font-weight: 600;
}

.task-actions {
  display: flex;
  gap: 12px;
}

/* AI总结按钮美化 */
.ai-insight-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border: none;
  box-shadow: 0 4px 12px rgba(110, 142, 251, 0.3);
  color: white;
}

.ai-insight-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(110, 142, 251, 0.4);
  background: linear-gradient(135deg, #5d7df9, #9665dc);
}

.ai-insight-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(110, 142, 251, 0.35);
}

.ai-insight-icon {
  display: flex;
  align-items: center;
  position: relative;
}

.ai-pulse {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4de9ff;
  box-shadow: 0 0 10px #4de9ff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.5);
    opacity: 0.7;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.5);
    opacity: 0.7;
  }
}

/* 任务列表容器样式 - 可滚动 */
.task-list-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  padding-bottom: 70px; /* 为固定的添加任务按钮留出空间 */
}

.task-list-container::-webkit-scrollbar {
  width: 6px;
}

.task-list-container::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

/* 任务分组样式 */
.task-group-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #dcdfe6;
  flex-shrink: 0;
}

.task-group-section:last-of-type {
  border-bottom: none;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 0;
  color: #606266;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
}

.group-header:hover {
  color: #409EFF;
}

.rotate-icon {
  transform: rotate(180deg);
  transition: transform 0.3s;
}

.tasks-container {
  padding-left: 8px;
}

.vertical-task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.empty-tasks {
  padding: 16px;
  text-align: center;
  color: #909399;
}

/* 任务项样式 */
.task-item {
  padding: 10px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.3s ease;
  border-left: 3px solid #409EFF;
  position: relative;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-item.system-task {
  border-left-color: #67C23A;
  background-color: #f8fff8;
}

.task-item.important {
  border-left-color: #F7BA2A;
  background-color: #fffbf0;
}

.task-item.completed {
  background-color: #f5f7fa;
  border-left-color: #909399;
  opacity: 0.8;
}

.task-checkbox {
  padding-top: 3px;
}

.task-checkbox :deep(.el-checkbox__inner) {
  width: 20px;
  height: 20px;
  border: 2px solid #409EFF;
  transition: all 0.3s ease;
}

.task-checkbox :deep(.el-checkbox__inner:hover) {
  border-color: #66b1ff;
  transform: scale(1.1);
}

.task-checkbox :deep(.el-checkbox__inner.is-checked) {
  background-color: #409EFF;
  border-color: #409EFF;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
}

.task-checkbox :deep(.el-checkbox__inner.is-checked:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
  transform: scale(1.1);
}

.task-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #fff;
  width: 6px;
  height: 10px;
  left: 6px;
  top: 2px;
}

.drag-handle {
  cursor: move;
  color: #a0a0a0;
  padding: 2px;
}

.drag-handle:hover {
  color: #606266;
}

.task-info {
  flex: 1;
  cursor: pointer;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.task-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.star-icon {
  cursor: pointer;
  font-size: 18px;
  z-index: 2; /* 确保星标在最上层 */
}

.task-description {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.task-deadline {
  font-size: 12px;
  color: #909399;
}

.task-reward {
  margin-top: 6px;
}

.task-completed-time {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

/* 底部固定添加任务按钮 */
.add-task-fixed-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  background: linear-gradient(0deg, rgba(255,255,255,1) 70%, rgba(255,255,255,0.8) 90%, rgba(255,255,255,0) 100%);
  z-index: 10;
}

.add-task-fixed-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px;
  border-radius: 30px;
  border: none;
  background: linear-gradient(135deg, #42b983, #2d9cdb);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(66, 185, 131, 0.3);
}

.add-task-fixed-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 185, 131, 0.4);
}

.add-task-fixed-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(66, 185, 131, 0.3);
}

/* 新任务表单覆盖层 */
.new-task-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.new-task-modal {
  width: 90%;
  max-width: 500px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.new-task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #42b983, #2d9cdb);
  color: white;
}

.new-task-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.close-icon {
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.3s;
}

.close-icon:hover {
  transform: rotate(90deg);
}

.new-task-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #606266;
}

.task-input {
  width: 100%;
}

.form-options {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
  margin: 20px 0;
}

.deadline-option label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #606266;
}

.importance-option {
  display: flex;
  align-items: flex-end;
  padding-bottom: 4px;
}

.priority-selector {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.priority-level {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.priority-level:hover {
  background: #f0f2f5;
}

.priority-level.active {
  background: #fff8e0;
  color: #F7BA2A;
}

.priority-level.active:hover {
  background: #fff4cc;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 滑动动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, max-height 0.3s;
  max-height: 1000px;
  overflow: hidden;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
}

/* 任务列表动画 */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.5s ease;
}

.task-list-enter-from,
.task-list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.task-list-move {
  transition: transform 0.5s ease;
}

/* 植物区域样式 - 固定不滚动 */
.plant-section {
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  background-color: #fff;
  padding: 24px;
  position: sticky;
  top: 20px;
  height: calc(100vh - 70px);
  overflow: hidden;
}

.plant-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.plant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
}

.plant-display {
  display: flex;
  flex-direction: column;
  min-height: 480px; /* 确保有足够的高度 */
  position: relative;
}

/* 新的容器将气泡框独立放置 */
.plant-speech-container {
  height: auto; /* 允许高度自动调整 */
  min-height: 150px; /* 设置最小高度，避免空白 */
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  position: relative;
  margin: 8px 0;
}

/* 植物和详情的主容器 */
.plant-main-container {
  display: flex;
  flex-direction: column;
}

.plant-canvas-wrapper {
  position: relative;
  width: 300px;
  height: 300px;
  margin-bottom: 15px;
  left: 50%; /* 同步移动背景图层 */
  transform: translateX(-50%);
}

.plant-emoji-container {
  position: absolute;
  top: 50%;
  left: 50%; /* 确保植物图标和背景图层同步移动 */
  transform: translate(-50%, -50%);
  z-index: 2;
}

.plant-image {
  max-width: 180px;
  max-height: 180px;
  object-fit: contain;
  transition: all 0.5s ease;
}

/* 重新设计气泡样式，调整位置和尖端方向 */
.plant-speech-bubble {
  position: absolute;
  left: 58%;
  transform: translateX(-50%);
  top: -20%;
  background: linear-gradient(to bottom, #f9f9f9, #e0e0e0); /* 使用更柔和的渐变 */
  border-radius: 50px 50px 60px 60px; /* 使用不规则的边框半径 */
  padding: 20px 24px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05); /* 增加多层阴影 */
  max-width: 320px;
  min-width: 240px;
  z-index: 10;
  border: none;
  transform-origin: center bottom;
  animation: bubble-appear 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  transition: all 0.3s ease;
}

/* 气泡箭头指向植物 */
.plant-speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -12px; /* 确保箭头指向左下侧 */
  left: 20px; /* 调整箭头位置 */
  border-width: 12px 12px 0 12px; /* 修改箭头指向 */
  border-style: solid;
  border-color: #C8E6C9 transparent transparent transparent; /* 修改箭头颜色 */
  filter: drop-shadow(-2px 2px 2px rgba(0, 0, 0, 0.05));
}

/* 添加气泡与植物茎干的视觉引导线 */
.plant-speech-bubble::before {
  display: none;
}

.speech-icon {
  position: absolute;
  top: -15px;
  left: 15px;
  background: linear-gradient(135deg, #42b983, #64d2ff);
  color: white;
  font-size: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  animation: spin-icon 1.2s ease-out;
}

.speech-content {
  padding-top: 6px;
}

.speech-text {
  margin: 0 0 12px 0;
  font-size: 16px; /* 调整字号 */
  line-height: 1.6;
  color: #333;
  font-weight: 500;
}

.speech-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #888;
  border-top: 1px dashed #eee;
  padding-top: 8px;
}

.speech-time {
  color: #FBC02D; /* 时间戳使用新色号 */
  font-weight: 500;
}

.speech-tag {
  background: linear-gradient(135deg, rgba(66, 185, 131, 0.15), rgba(100, 210, 255, 0.15));
  color: #42b983;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 9px; /* 缩小字号 */
  font-weight: 600;
  display: flex;
  align-items: center;
}

.speech-tag::before {
  content: "🍃"; /* 添加叶脉图标 */
  margin-right: 4px;
  font-size: 11px;
}

/* 浮现动画，取代原来的slide-in-right */
@keyframes bubble-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
  }
  70% {
    transform: scale(1.05) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 图标旋转动画 */
@keyframes spin-icon {
  0% {
    transform: rotate(-45deg) scale(0.5);
    opacity: 0;
  }
  100% {
    transform: rotate(0) scale(1);
    opacity: 1;
  }
}

/* 改进漂浮动画 */
.plant-speech-bubble:hover {
  transform: translateY(-3px) rotate(2deg); /* 鼠标悬停时产生浮动和旋转 */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 1px 0 #C8E6C9;
}

/* 持续漂浮的动画 */
.plant-speech-bubble {
  animation: bubble-appear 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28),
             float-bubble 3s ease-in-out infinite 0.8s;
}

@keyframes float-bubble {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* 为移动端添加响应式适配 */
@media screen and (max-width: 768px) {
  .plant-speech-bubble {
    right: 5%;
    width: 90%;
    border-radius: 24px;
    bottom: 10px;
    top: unset;
  }
  
  .plant-speech-bubble::after,
  .plant-speech-bubble::before {
    display: none;
  }
}

/* 为横屏状态添加适配 */
@media screen and (orientation: landscape) and (max-height: 600px) {
  .plant-speech-bubble {
    transform: scale(0.75);
    transform-origin: right top;
    top: 5%;
    right: 8%;
  }
}

.plant-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.plant-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.plant-level-container {
  margin-bottom: 15px;
}

.plant-level {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  text-align: center;
}

.level-value {
  font-weight: bold;
  color: #4caf50;
}

.plant-exp-progress :deep(.el-progress-bar__outer) {
  border-radius: 10px;
  background-color: #f0f0f0;
}

.plant-exp-progress :deep(.el-progress-bar__inner) {
  border-radius: 10px;
  background: linear-gradient(90deg, #81c784, #4caf50);
}

.weather-options {
  display: flex;
  gap: 15px;
}

.weather-option {
  font-size: 22px;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.3s;
  filter: grayscale(0.6);
}

.weather-option:hover {
  transform: scale(1.2);
  opacity: 0.8;
  filter: grayscale(0);
}

.weather-option.active {
  opacity: 1;
  transform: scale(1.2);
  filter: grayscale(0);
}

.plant-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}

/* AI 总结对话框样式 */
.ai-summary-loading {
  padding: 20px;
}

.ai-summary-content {
  padding: 20px;
}

.ai-summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  background-color: #f9fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.summary-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: #606266;
  font-weight: 600;
}

.summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;
}

.stat-item {
  flex: 1;
  min-width: 90px;
  background-color: white;
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.ai-insights-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.insight-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.insight-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.insight-header.overview {
  background-color: #e6f7ff;
  color: #1890ff;
}

.insight-header.achievements {
  background-color: #f6ffed;
  color: #52c41a;
}

.insight-header.suggestions {
  background-color: #fff7e6;
  color: #fa8c16;
}

.insight-header.next-steps {
  background-color: #f9f0ff;
  color: #722ed1;
}

.insight-content {
  padding: 16px;
  line-height: 1.6;
  color: #606266;
  flex: 1;
}

.ai-generated-note {
  margin-top: 20px;
}

/* 保留highlight等其他样式 */
.highlight {
  font-weight: 600;
  color: #409EFF;
}

.insights-title {
  margin: 16px 0 8px 0;
  color: #606266;
  font-weight: 600;
}

.insights-list {
  margin-bottom: 20px;
}

.insights-list li {
  margin-bottom: 8px;
}

/* 响应式设计 */
@media screen and (max-width: 992px) {
  .grid-layout {
    grid-template-columns: 1fr;
  }
  
  .plant-section {
    position: static;
    height: auto;
  }
}
</style>