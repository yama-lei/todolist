<template>
  <div class="home-page">
    <div class="container">
      <div class="grid-layout">
        <!-- -------------------------任务列表区--------------------------------------------------- -->
        <div class="tasks-section">
          <div class="tasks-header">
            <h2 class="section-title">任务中心</h2>
            <div class="task-actions">
              <button class="ai-insight-button" @click="showAiSummary">
                <div class="ai-insight-icon">
                  <div class="ai-pulse"></div>
                  <el-icon></el-icon>
                </div>
                <span>智能总结</span>
              </button>
            </div>
          </div>
          
          <!-- 单列任务列表 -->
          <div class="task-list-container">
              <!-- 任务完成情况分析 -->
              <div class="task-summary-card">
                <div class="summary-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>任务完成情况</span>
                </div>
                <div class="summary-content">
                  <div class="summary-stats">
                    <div class="stat-item">
                      <div class="stat-value">{{ taskStore.pendingTasks.length }}</div>
                      <div class="stat-label">待办任务</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ todayCompletedTasksCount }}</div>
                      <div class="stat-label">今日完成</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ weeklyTasksCount }}</div>
                      <div class="stat-label">未来一周任务</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ pendingImportantTasksCount }}</div>
                      <div class="stat-label">重要待办</div>
                    </div>
                  </div>
                  
                  <div class="task-progress">
                    <div class="progress-label">总体进度</div>
                    <el-progress 
                      :percentage="calculateTaskCompletionRate" 
                      :stroke-width="8"
                      :color="taskProgressColor"
                    />
                  </div>
                </div>
              </div>

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
                   <div v-if="systemTasks.length === 0" class="empty-tasks">
                     <el-empty description="暂无系统任务" />
                   </div>
                   <div 
                     v-else
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
              <h2 class="section-title">{{ plantStore.mainPlant ? plantStore.mainPlant.name : '我的植物' }}</h2>
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
                    <p class="speech-text">
                      <!-- 已显示的文本 -->
                      <span v-for="(segment, index) in displayedSegments" :key="index" class="message-segment">
                        {{ segment }}
                      </span>
                      <!-- 当前正在打字的文本 -->
                      <span class="typing-segment">{{ currentTypingText }}</span>
                      <!-- 打字指示器 -->
                      <span v-if="isTyping" class="typing-cursor">|</span>
                    </p>
                    <div class="speech-meta">
                      <span class="speech-time">{{ formatShortTime(currentPlantThought.timestamp) }}</span>
                      <span class="speech-tag" v-if="currentPlantThought.tag">{{ currentPlantThought.tag }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="plant-main-container">
                <div class="plant-canvas-wrapper">
                  <WeatherCanvas :weather="weather" :width="260" :height="260" />
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
                      :stroke-width="12"
                      class="plant-exp-progress"
                    />
                  </div>
                  
                  <div class="plant-actions">
                    <el-button type="success" @click="listenToPlantThought">
                      <el-icon><ChatLineRound /></el-icon> 聆听心声
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
import { ref, reactive, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
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
import axios from 'axios'

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
    
    // 添加今日完成任务数量的状态
    const todayCompletedTasksCount = ref(0)
    
    // 获取今日完成任务数量
    const fetchTodayCompletedTasks = async () => {
      try {
        const today = new Date()
        const formattedDate = format(today, 'yyyy-MM-dd')
        
        const response = await axios.get('/api/auth/stats', {
          params: {
            startDate: formattedDate,
            endDate: formattedDate
          }
        })
        
        if (response.data.success && response.data.taskCount.length > 0) {
          todayCompletedTasksCount.value = response.data.taskCount[0].completed || 0
        }
      } catch (error) {
        console.error('获取今日完成任务数量失败:', error)
      }
    }
    
    // 在组件挂载时获取任务数据
    onMounted(async () => {
      try {
        await Promise.all([
          taskStore.fetchTasks(),
          taskStore.fetchSystemTasks(),
          fetchTodayCompletedTasks() // 添加获取今日完成任务数量
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
    
    // 添加预留心语数组
    const reservedThoughts = ref([])
    const showPlantSpeech = ref(false)
    
    // 添加时间控制变量
    const lastThoughtTime = ref(0)
    const THOUGHT_INTERVAL = 5 * 60 * 1000 // 5分钟间隔
    const isPreloading = ref(false) // 添加预加载状态标记
    
    const preloadPlantThoughts = async () => {
      if (!plantStore.mainPlant || isPreloading.value) return;
      
      const plantId = plantStore.mainPlant._id || plantStore.mainPlant.id;
      if (!plantId) return;
      
      // 检查时间间隔
      const now = Date.now()
      if (now - lastThoughtTime.value < THOUGHT_INTERVAL) {
        console.log('距离上次加载心语时间间隔太短，跳过预加载')
        return
      }
      
      try {
        isPreloading.value = true
        
        // 如果已经有足够的预加载心语，就不再加载
        if (reservedThoughts.value.length >= 3) {
          console.log('已有足够的预加载心语')
          return
        }
        
        // 预先加载3条心语
        for (let i = 0; i < 3 - reservedThoughts.value.length; i++) {
          const context = {
            weather: weather.value,
            timeOfDay: getTimeOfDay(),
            recentTasks: taskStore.completedTasks.slice(0, 3).map(task => ({
              id: task._id || task.id,
              title: task.title,
              completed: true
            }))
          };
          
          const thought = await plantStore.generatePlantThought(plantId, context);
          if (thought) {
            reservedThoughts.value.push(thought);
            console.log('预加载植物心语成功');
            lastThoughtTime.value = now
          }
          
          // 间隔一段时间，避免API限制
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('预加载植物心语失败:', error);
      } finally {
        isPreloading.value = false
      }
    };
    
    // 优化后的植物心语显示函数
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
        // 直接显示已预加载的心语
        if (reservedThoughts.value.length > 0) {
          const thought = reservedThoughts.value.shift()
          currentPlantThought.message = thought.content
          currentPlantThought.type = thought.type || 'mood'
          currentPlantThought.icon = thought.icon || '🌱'
          currentPlantThought.tag = thought.tag || '植物心语'
          currentPlantThought.timestamp = new Date(thought.timestamp)
          showPlantSpeech.value = true
          
          // 开始打字效果
          startTypingEffect(thought.content)
          
          ElMessage({
            message: '植物想和你说话了！',
            type: 'success'
          })
          
          // 延长悬浮气泡框显示时间
          setTimeout(() => {
            showPlantSpeech.value = false
            stopTypingEffect()
          }, 15000)
          
          // 当预加载的心语少于2条时，触发补充
          if (reservedThoughts.value.length < 2) {
            setTimeout(() => {
              preloadPlantThoughts()
            }, 1000)
          }
        } else {
          // 如果没有预加载的心语，实时获取一条
          const context = {
            weather: weather.value,
            timeOfDay: getTimeOfDay(),
            recentTasks: taskStore.completedTasks.slice(0, 3).map(task => ({
              id: task._id || task.id,
              title: task.title,
              completed: true
            }))
          }
          
          const newThought = await plantStore.generatePlantThought(plantId, context)
          
          if (newThought) {
            currentPlantThought.message = newThought.content
            currentPlantThought.type = newThought.type || 'mood'
            currentPlantThought.icon = newThought.icon || '🌱'
            currentPlantThought.tag = newThought.tag || '植物心语'
            currentPlantThought.timestamp = new Date(newThought.timestamp)
            showPlantSpeech.value = true
            
            // 开始打字效果
            startTypingEffect(newThought.content)
            
            ElMessage({
              message: '植物想和你说话了！',
              type: 'success'
            })
            
            // 延长悬浮气泡框显示时间
            setTimeout(() => {
              showPlantSpeech.value = false
              stopTypingEffect()
            }, 15000)
            
            // 开始预加载
            setTimeout(() => {
              preloadPlantThoughts()
            }, 1000)
          }
        }
      } catch (error) {
        console.error('获取植物心声失败', error)
        ElMessage.error('获取植物心声失败，植物好像有点害羞...')
      }
    }
    
    // 修改监听主植物变化的逻辑
    watch(() => plantStore.mainPlant, async (newMainPlant) => {
      if (newMainPlant) {
        weather.value = newMainPlant.weather || 'sunny'
        
        // 只在没有预加载心语时才触发预加载
        if (reservedThoughts.value.length === 0) {
          setTimeout(() => {
            preloadPlantThoughts()
          }, 2000)
        }
      }
    }, { immediate: true })
    
    // 初始化时，预加载植物心语
    onMounted(async () => {
      try {
        await Promise.all([
          taskStore.fetchTasks(),
          taskStore.fetchSystemTasks()
        ])
        console.log('首页任务数据加载成功')
        
        // 预加载植物心语
        if (plantStore.mainPlant) {
          const plantId = plantStore.mainPlant._id || plantStore.mainPlant.id
          if (plantId) {
            const thoughts = await plantStore.fetchPlantThoughts(plantId)
            plantStore.thoughts = thoughts.map(thought => ({
              type: 'plant', 
              content: thought.content,
              timestamp: thought.timestamp
            }))
            
            // 只在没有预加载心语时才触发预加载
            if (reservedThoughts.value.length === 0) {
              setTimeout(() => {
                preloadPlantThoughts()
              }, 2000)
            }
          }
        }
      } catch (error) {
        console.error('加载任务数据失败:', error)
      }
    })
    
    // 完成任务
    const completeTask = async (id) => {
      try {
        await taskStore.completeTask(id)
        // 更新今日完成任务数量
        todayCompletedTasksCount.value++
        
        if (plantStore.mainPlant) {
          const plantId = plantStore.mainPlant._id || plantStore.mainPlant.id
          if (plantId) {
            await plantStore.gainExperience(plantId, 20)
            
            // 重新获取植物信息以更新状态
            await plantStore.fetchPlants()
            
            // 更新主植物引用，确保UI更新
            if (plantStore.plants && plantStore.plants.length > 0) {
              const updatedPlant = plantStore.plants.find(p => (p._id === plantId || p.id === plantId))
              if (updatedPlant) {
                plantStore.setCurrentPlant(updatedPlant)
              }
            }
          }
        }
      } catch (error) {
        console.error('完成任务失败:', error)
        ElMessage.error('完成任务失败，请重试')
      }
    }
    
    // 完成系统任务
    const completeSystemTask = async (id) => {
      try {
        await taskStore.completeSystemTask(id)
        // 更新今日完成任务数量
        todayCompletedTasksCount.value++
        
        if (plantStore.mainPlant) {
          const plantId = plantStore.mainPlant._id || plantStore.mainPlant.id
          if (plantId) {
            await plantStore.gainExperience(plantId, 30)
            
            // 重新获取植物信息以更新状态
            await plantStore.fetchPlants()
            
            // 更新主植物引用，确保UI更新
            if (plantStore.plants && plantStore.plants.length > 0) {
              const updatedPlant = plantStore.plants.find(p => (p._id === plantId || p.id === plantId))
              if (updatedPlant) {
                plantStore.setCurrentPlant(updatedPlant)
              }
            }
          }
        }
      } catch (error) {
        console.error('完成系统任务失败:', error)
        ElMessage.error('完成系统任务失败，请重试')
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
      '白百合': {
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
        console.error('获取智能总结失败:', error)
        ElMessage.error('获取智能总结数据失败，请稍后再试')
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
    
    // 格式化时间为简短格式
    const formatShortTime = (time) => {
      if (!time) return ''
      return format(new Date(time), 'HH:mm')
    }
    
    // 计算任务完成率
    const calculateTaskCompletionRate = computed(() => {
      const completedCount = taskStore.completedTasks.length
      const totalCount = taskStore.pendingTasks.length + taskStore.completedTasks.length
      if (totalCount === 0) return 0
      return Math.round((completedCount / totalCount) * 100)
    })
    
    // 计算重要待办任务数量
    const pendingImportantTasksCount = computed(() => {
      return taskStore.pendingTasks.filter(task => task.important).length
    })
    
    // 任务进度颜色
    const taskProgressColor = computed(() => {
      const completedCount = taskStore.completedTasks.length
      const totalCount = taskStore.pendingTasks.length + taskStore.completedTasks.length
      if (totalCount === 0) return '#409EFF'
      const progress = (completedCount / totalCount) * 100
      return progress < 50 ? '#409EFF' : progress < 75 ? '#F7BA2A' : '#67C23A'
    })
    
    // 今日健康任务数量
    const todaySystemTasksCount = computed(() => {
      // 如果系统任务为空或未定义，返回0
      if (!taskStore.systemTasks || !taskStore.systemTasks.length) return 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 设置为今天的开始时间
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // 明天的开始时间
      
      return taskStore.systemTasks.filter(task => {
        // 检查任务是否已完成
        if (!task.completed) return false;
        
        // 检查任务是否有完成时间
        if (!task.completedAt) return false;
        
        // 检查任务完成时间是否在今天
        const completedDate = new Date(task.completedAt);
        return completedDate >= today && completedDate < tomorrow;
      }).length;
    });
    
    // 未来一周任务数量
    const weeklyTasksCount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 设置为今天的开始时间
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7); // 一周后的时间
      
      // 统计未来一周内有截止日期的系统任务（未完成）
      const systemTasksCount = (taskStore.systemTasks || [])
        .filter(task => {
          // 只统计未完成的任务
          if (task.completed) return false;
          
          // 没有截止日期的任务不计入
          if (!task.deadline) return false;
          
          const taskDate = new Date(task.deadline);
          // 检查任务截止日期是否在未来一周内
          return taskDate >= today && taskDate < nextWeek;
        }).length;
      
      // 统计未来一周内有截止日期的个人任务（未完成）
      const personalTasksCount = taskStore.pendingTasks
        .filter(task => {
          // 没有截止日期的任务不计入
          if (!task.deadline) return false;
          
          const taskDate = new Date(task.deadline);
          // 检查任务截止日期是否在未来一周内
          return taskDate >= today && taskDate < nextWeek;
        }).length;
      
      // 返回系统任务和个人任务的总和
      return systemTasksCount + personalTasksCount;
    });
    
    const displayedSegments = ref([])
    const currentTypingText = ref('')
    const isTyping = ref(false)
    const typeInterval = ref(null)
    const typingSpeed = 50 // 打字速度(毫秒/字符)
    const segmentDelay = 1000 // 段落之间的延迟(毫秒)
    
    // 将消息拆分为段落
    const splitMessageIntoSegments = (message) => {
      if (!message) return [];
      // 按双换行或单换行分割
      return message.split(/\n\n|\n/).filter(segment => segment.trim() !== '');
    }
    
    // 开始打字效果
    const startTypingEffect = (message) => {
      // 停止任何正在进行的打字效果
      stopTypingEffect();
      
      // 重置状态
      displayedSegments.value = [];
      currentTypingText.value = '';
      isTyping.value = true;
      
      // 将消息拆分为段落
      const segments = splitMessageIntoSegments(message);
      let currentSegmentIndex = 0;
      
      const typeNextSegment = () => {
        if (currentSegmentIndex >= segments.length) {
          // 所有段落都已显示完成
          finishTyping();
          return;
        }
        
        const currentSegment = segments[currentSegmentIndex];
        let charIndex = 0;
        
        // 清除之前的打字效果定时器
        if (typeInterval.value) clearInterval(typeInterval.value);
        
        // 逐字显示当前段落
        typeInterval.value = setInterval(() => {
          if (charIndex <= currentSegment.length) {
            currentTypingText.value = currentSegment.substring(0, charIndex);
            charIndex++;
          } else {
            // 当前段落打字完成
            clearInterval(typeInterval.value);
            
            // 将完成的段落添加到已显示段落数组
            displayedSegments.value.push(currentSegment);
            currentTypingText.value = '';
            
            // 移动到下一段
            currentSegmentIndex++;
            
            // 延迟一会儿再显示下一段
            if (currentSegmentIndex < segments.length) {
              setTimeout(typeNextSegment, segmentDelay);
            } else {
              // 所有段落都已显示完成
              finishTyping();
            }
          }
        }, typingSpeed);
      };
      
      // 开始显示第一段
      typeNextSegment();
    }
    
    // 完成打字效果
    const finishTyping = () => {
      isTyping.value = false;
      if (typeInterval.value) {
        clearInterval(typeInterval.value);
        typeInterval.value = null;
      }
    }
    
    // 停止打字效果
    const stopTypingEffect = () => {
      isTyping.value = false;
      if (typeInterval.value) {
        clearInterval(typeInterval.value);
        typeInterval.value = null;
      }
      displayedSegments.value = [];
      currentTypingText.value = '';
    }
    
    // 在组件销毁时清除定时器
    onUnmounted(() => {
      stopTypingEffect()
    })
    
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
      formatShortTime,
      calculateTaskCompletionRate,
      pendingImportantTasksCount,
      taskProgressColor,
      todaySystemTasksCount,
      weeklyTasksCount,
      todayCompletedTasksCount,
      displayedSegments,
      currentTypingText,
      isTyping,
      typeInterval,
      typingSpeed,
      segmentDelay,
      splitMessageIntoSegments,
      startTypingEffect,
      finishTyping,
      stopTypingEffect
    }
  }
}
</script>

<style scoped>
.home-page {
  padding: 12px;
  min-height: 100vh;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.grid-layout {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 20px;
}

/* 任务区域样式 */
.tasks-section {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  background-color: #fff;
  padding: 20px;
  max-height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 12px;
  flex-shrink: 0;
}

.section-title {
  font-size: 20px;
  margin: 0;
  color: #303133;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  display: block;
  width: 4px;
  height: 18px;
  background: linear-gradient(to bottom, #42b983, #2d9cdb);
  border-radius: 2px;
}

.task-actions {
  display: flex;
  gap: 8px;
}

/* AI总结按钮美化 */
.ai-insight-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #6e8efb, #a777e3)
;  background-color: #f5f8fa;
  border: none;
  box-shadow: 0 2px 6px rgba(110, 142, 251, 0.2);
  color: white;
}

.ai-insight-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(110, 142, 251, 0.3);
}

.ai-insight-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(110, 142, 251, 0.25);
}

/* 植物区域样式改进 */
.plant-section {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  background-color: #fff;
  padding: 20px;
  position: sticky;
  top: 12px;
  height: calc(100vh - 50px);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.plant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 12px;
}

.plant-header .section-title {
  color: #42b983;
}

/* 响应式设计优化 */
@media screen and (max-width: 1200px) {
  .grid-layout {
    grid-template-columns: 55% 45%;
    gap: 15px;
  }
}

@media screen and (max-width: 992px) {
  .grid-layout {
    grid-template-columns: 1fr;
  }
  
  .plant-section {
    position: static;
    height: auto;
    max-height: 600px;
  }
  
  .tasks-section, 
  .plant-section {
    padding: 16px;
  }
}

@media screen and (max-width: 576px) {
  .home-page {
    padding: 8px;
  }
  
  .task-actions {
    flex-direction: column;
  }
  
  .ai-insight-button {
    padding: 5px 10px;
    font-size: 12px;
  }
}

.task-list-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
  display: flex;
  flex-direction: column;
  padding-bottom: 70px; /* 为固定的添加任务按钮留出空间 */
  scroll-behavior: smooth;
}

.task-list-container::-webkit-scrollbar {
  width: 4px;
}

.task-list-container::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 4px;
}

.task-list-container::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 任务分组样式 */
.task-group-section {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #edf0f5;
  flex-shrink: 0;
}

.task-group-section:last-of-type {
  border-bottom: none;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 4px;
  color: #606266;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 10px;
  transition: all 0.2s;
  border-radius: 6px;
}

.group-header:hover {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.05);
}

.rotate-icon {
  transform: rotate(180deg);
  transition: transform 0.3s;
}

.tasks-container {
  padding-left: 6px;
}

.vertical-task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 6px;
}

.empty-tasks {
  padding: 12px;
  text-align: center;
  color: #909399;
}

/* 任务项样式 */
.task-item {
  padding: 12px 14px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  transition: all 0.2s ease;
  border-left: 3px solid #409EFF;
  position: relative;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.task-item.system-task {
  border-left-color: #67C23A;
  background-color: #f9fdf9;
}

.task-item.important {
  border-left-color: #F7BA2A;
  background-color: #fffdf7;
}

.task-item.completed {
  background-color: #f7f8fa;
  border-left-color: #909399;
  opacity: 0.85;
}

.task-checkbox {
  padding-top: 2px;
}

.drag-handle {
  cursor: move;
  color: #c0c4cc;
  padding: 2px;
  margin-right: -4px;
}

.drag-handle:hover {
  color: #606266;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.task-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.task-description {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  gap: 8px;
  flex-wrap: wrap;
}

.task-deadline {
  font-size: 12px;
  color: #909399;
}

.task-reward {
  margin-top: 4px;
}

.task-completed-time {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

/* 底部固定添加任务按钮 */
.add-task-fixed-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px 16px;
  background: linear-gradient(0deg, rgba(255,255,255,1) 75%, rgba(255,255,255,0.9) 90%, rgba(255,255,255,0) 100%);
  z-index: 10;
}

.add-task-fixed-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border-radius: 30px;
  border: none;
  background: linear-gradient(135deg, #42b983, #2d9cdb);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 12px rgba(66, 185, 131, 0.25);
}

.add-task-fixed-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(66, 185, 131, 0.35);
}

.add-task-fixed-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
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
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  background-color: #fff;
  padding: 20px;
  position: sticky;
  top: 12px;
  height: calc(100vh - 50px);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
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
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 12px;
}

.plant-display {
  display: flex;
  flex-direction: column;
  min-height: 450px;
  position: relative;
  margin-top: 5px;
}

/* 新的容器将气泡框独立放置 */
.plant-speech-container {
  height: auto;
  min-height: 120px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin: 0 0 10px;
}

/* 植物和详情的主容器 */
.plant-main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.plant-canvas-wrapper {
  position: relative;
  width: 260px;
  height: 260px;
  margin-bottom: 20px;
  transform: translateX(0);
  left: unset;
  border-radius: 50%;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 8px solid #fff;
  background: linear-gradient(145deg, #f0f4f8, #e6f7ff);
}

.plant-emoji-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -52%);
  z-index: 2;
}

.plant-image {
  max-width: 160px;
  max-height: 160px;
  object-fit: contain;
  transition: all 0.5s ease;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.15));
}

/* 重新设计气泡样式，调整位置和尖端方向 */
.plant-speech-bubble {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  background: linear-gradient(to bottom, #ffffff, #f2f7f4);
  border-radius: 18px;
  padding: 15px 18px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.06);
  max-width: 280px;
  width: 95%;
  min-width: 220px;
  z-index: 10;
  border: 1px solid rgba(76, 175, 80, 0.2);
  transform-origin: center bottom;
  animation: bubble-appear 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  transition: all 0.3s ease;
}

/* 气泡箭头指向植物 */
.plant-speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 10px 10px 0 10px;
  border-style: solid;
  border-color: #f2f7f4 transparent transparent transparent;
}

.speech-icon {
  position: absolute;
  top: -15px;
  left: 15px;
  background: linear-gradient(135deg, #42b983, #64d2ff);
  color: white;
  font-size: 18px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  animation: spin-icon 1.2s ease-out;
}

.speech-content {
  padding-top: 4px;
}

.speech-text {
  margin: 0 0 10px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #3c4043;
  font-weight: 500;
}

.speech-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #888;
  border-top: 1px dashed #e8f5e9;
  padding-top: 6px;
}

.speech-time {
  color: #FBC02D;
  font-weight: 500;
}

.speech-tag {
  background: linear-gradient(135deg, rgba(66, 185, 131, 0.15), rgba(100, 210, 255, 0.15));
  color: #42b983;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

/* 浮现动画 */
@keyframes bubble-appear {
  0% {
    opacity: 0;
    transform: translateX(-50%) scale(0.8) translateY(10px);
  }
  70% {
    transform: translateX(-50%) scale(1.05) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) scale(1) translateY(0);
  }
}

/* 持续漂浮的动画 */
.plant-speech-bubble {
  animation: bubble-appear 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28),
             float-bubble 3s ease-in-out infinite 0.8s;
}

@keyframes float-bubble {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-3px); }
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
  gap: 16px;
  padding: 0 12px;
}

.plant-stats {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.plant-stats .el-tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

.plant-level-container {
  margin-bottom: 12px;
  background-color: #f5f9f7;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.plant-level {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  text-align: center;
  font-weight: 500;
}

.level-value {
  font-weight: bold;
  color: #42b983;
}

.plant-exp-progress :deep(.el-progress-bar__outer) {
  border-radius: 12px;
  height: 12px !important;
  background-color: rgba(76, 175, 80, 0.2);
}

.plant-exp-progress :deep(.el-progress-bar__inner) {
  border-radius: 12px;
  background: linear-gradient(90deg, #81c784, #4caf50);
}

.plant-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.plant-actions .el-button {
  border-radius: 24px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
}

/* 植物天气选择器优化 */
.plant-weather {
  display: flex;
  align-items: center;
}

.weather-options {
  display: flex;
  gap: 10px;
  background-color: #f5f7fa;
  padding: 5px;
  border-radius: 30px;
}

.weather-option {
  font-size: 20px;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.3s;
  filter: grayscale(0.6);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.weather-option:hover {
  transform: scale(1.1);
  opacity: 0.8;
  filter: grayscale(0);
  background-color: rgba(255, 255, 255, 0.8);
}

.weather-option.active {
  opacity: 1;
  transform: scale(1.1);
  filter: grayscale(0);
  background-color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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

/* 任务完成情况分析卡片 */
.task-summary-card {
  background-color: #f9fafc;
  border-radius: 14px;
  margin-bottom: 18px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  color: #606266;
  font-weight: 600;
  font-size: 15px;
}

.summary-header .el-icon {
  font-size: 18px;
  color: #409EFF;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.summary-stats {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 4px;
}

.task-summary-card .stat-item {
  flex: 1;
  min-width: 70px;
  background-color: white;
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
}

.task-summary-card .stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.task-summary-card .stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #409EFF;
  margin-bottom: 4px;
}

.task-summary-card .stat-value:nth-child(2n) {
  color: #67C23A;
}

.task-summary-card .stat-value:nth-child(3n) {
  color: #F7BA2A;
}

.task-summary-card .stat-value:nth-child(4n) {
  color: #F56C6C;
}

.task-summary-card .stat-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.task-progress {
  margin-top: 4px;
}

.progress-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-progress .el-progress--line {
  margin-bottom: 0;
}

@media screen and (max-width: 576px) {
  .task-summary-card .stat-item {
    min-width: 60px;
    padding: 8px 6px;
  }
  
  .task-summary-card .stat-value {
    font-size: 18px;
  }
  
  .task-summary-card .stat-label {
    font-size: 11px;
  }
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: #666;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.message-segment {
  display: block;
  margin-bottom: 0.5em;
}

.typing-segment {
  display: inline;
}

.speech-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}
</style>
