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
                <el-select v-model="weather" placeholder="选择天气" @change="updateWeather">
                  <el-option label="晴天" value="sunny" />
                  <el-option label="雨天" value="rainy" />
                  <el-option label="多云" value="cloudy" />
                </el-select>
              </div>
            </div>
            
            <div class="plant-display">
              <div class="plant-canvas-wrapper">
                <WeatherCanvas :weather="weather" :width="450" :height="350" />
                <div class="plant-emoji-container">
                  <!---                  <span class="plant-emoji" :class="plantState">
                    {{ getPlantEmoji() }}
                  </span>-->
                  <img src="@/../public/images/plant/test.png" alt="植物表情" class="plant-emoji">
                  
                  <PlantDialog 
                    :text="randomThought" 
                    :is-visible="showPlantDialog"
                    :show-buttons="false"
                    @primary-action="showPlantDialog = false"
                  />
                </div>
              </div>
              
              <div class="plant-details">
                <div class="plant-stats">
                  <el-tag type="success" size="large">等级: {{ plantStore.currentLevel }}</el-tag>
                  <el-tag type="primary" size="large">状态: {{ getPlantStateText() }}</el-tag>
                  <el-tag type="warning" size="large">心情: {{ getMoodText() }}</el-tag>
                </div>
                
                <el-progress 
                  :percentage="experiencePercentage" 
                  :format="expFormat"
                  class="experience-bar"
                  :stroke-width="15"
                  :show-text="true"
                  striped
                  :striped-flow="true"
                />
                
                <div class="plant-actions">
                  <el-button type="success" @click="refreshPlantThought">
                    <el-icon><Refresh /></el-icon> 刷新心声
                  </el-button>
                  <el-button type="primary" @click="goToPlantChat">
                    <el-icon><ChatDotRound /></el-icon> 与植物聊天
                  </el-button>
                </div>
              </div>
            </div>
            
            <PlantStatusMessage 
              :message="currentPlantThought.message" 
              :message-type="currentPlantThought.type"
              :icon="currentPlantThought.icon"
              :tag="currentPlantThought.tag"
              :timestamp="currentPlantThought.timestamp"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- AI 总结对话框 -->
    <el-dialog
      v-model="showAiSummaryDialog"
      title="AI 任务总结"
      width="40%"
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
        <div class="ai-summary-text">
          <p>你的任务完成情况分析如下：</p>
          <ul v-if="aiSummaryData && aiSummaryData.summary">
            <li>已完成任务：{{ aiSummaryData.summary.completedTasks }} 个</li>
            <li>待完成任务：{{ aiSummaryData.summary.pendingTasks }} 个</li>
            <li>任务完成率：{{ aiSummaryData.summary.completionRate }}%</li>
            <li>平均完成时间：{{ aiSummaryData.summary.averageCompletionTime }}</li>
            <li>最高效日期：{{ aiSummaryData.summary.mostProductiveDay }}</li>
          </ul>
          <ul v-else>
            <li>已完成任务：{{ taskStore.completedTasks.length }} 个</li>
            <li>待完成任务：{{ taskStore.pendingTasks.length }} 个</li>
            <li>系统任务完成率：{{ calculateSystemTaskCompletion() }}%</li>
          </ul>
          
          <!-- 显示洞察和建议 -->
          <div v-if="aiSummaryData && aiSummaryData.insights && aiSummaryData.insights.length > 0">
            <h4 class="insights-title">洞察：</h4>
            <ul class="insights-list">
              <li v-for="(insight, index) in aiSummaryData.insights" :key="index">
                {{ insight }}
              </li>
            </ul>
          </div>
          
          <div v-if="aiSummaryData && aiSummaryData.recommendations && aiSummaryData.recommendations.length > 0">
            <h4 class="insights-title">建议：</h4>
            <ul class="insights-list">
              <li v-for="(rec, index) in aiSummaryData.recommendations" :key="index">
                {{ rec.content }}
              </li>
            </ul>
          </div>
          
          <p v-else-if="taskStore.pendingTasks.length > 0">
            <strong>下一步建议：</strong> 优先完成
            <span class="highlight">{{ taskStore.pendingTasks[0].title }}</span>
            任务，这将帮助你提升效率。
          </p>
          <p v-else>
            <strong>做得好！</strong> 你已经完成了所有待办任务。享受这个轻松的时刻吧！
          </p>
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { usePlantStore } from '../stores/plant'
import { format, formatDistance } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Plus, Delete, Magic, ChatDotRound, Refresh, ArrowDown, Star, Clock, Menu, Close } from '@element-plus/icons-vue'
import WeatherCanvas from '@/components/WeatherCanvas.vue'
import PlantDialog from '@/components/PlantDialog.vue'
import PlantStatusMessage from '@/components/PlantStatusMessage.vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import { insightsApi } from '../services/api'

export default {
  name: 'HomePage',
  components: {
    WeatherCanvas,
    PlantDialog,
    PlantStatusMessage,
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
    Close
  },
  setup() {
    const router = useRouter()
    const taskStore = useTaskStore()
    const plantStore = usePlantStore()
    
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
    
    // 更新天气
    const updateWeather = (newWeather) => {
      if (plantStore.mainPlant) {
        // 获取有效的植物ID
        const plantId = plantStore.mainPlant._id || plantStore.mainPlant.id;
        
        if (!plantId) {
          console.error('无法更新天气: 植物ID无效', plantStore.mainPlant);
          ElMessage.error('无法更新天气：植物ID无效');
          return;
        }
        
        plantStore.updatePlant(plantId, { weather: newWeather });
      }
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
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
        // 使用后端API获取AI洞察数据
        const response = await insightsApi.getTaskInsights('week')
        aiSummaryData.value = response
        
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
    const refreshPlantThought = () => {
      generatePlantThought()
    }
    
    // 跳转到植物聊天页面
    const goToPlantChat = () => {
      router.push('/plant-chat')
    }
    
    onMounted(() => {
      // 生成初始植物心声
      generatePlantThought()
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
      getPlantEmoji,
      getPlantStateText,
      getMoodText,
      togglePlantDialog,
      showAiSummary,
      calculateSystemTaskCompletion,
      currentPlantThought,
      refreshPlantThought,
      goToPlantChat,
      aiSummaryData
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
  align-items: center;
  gap: 24px;
  flex: 1;
  padding: 12px;
}

/* Canvas容器样式 */
.plant-canvas-wrapper {
  position: relative;
  width: 100%;
  height: 350px;
  overflow: hidden;
  border-radius: 16px;
}

.plant-canvas-wrapper :deep(canvas) {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.plant-emoji-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

.plant-emoji {
  font-size: 120px;
  transition: all 0.5s ease;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.plant-emoji.growing {
  transform: scale(1);
}

.plant-emoji.flowering {
  transform: scale(1.1);
}

.plant-emoji.fruiting {
  transform: scale(1.2);
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

.experience-bar {
  margin: 8px 0;
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
  margin-bottom: 16px;
}

.ai-summary-text {
  line-height: 1.6;
}

.ai-summary-text ul {
  margin: 16px 0;
  padding-left: 20px;
}

.ai-summary-text p {
  margin: 12px 0;
}

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