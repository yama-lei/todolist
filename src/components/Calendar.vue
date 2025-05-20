<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <h1>日历</h1>
      <div class="calendar-nav">
        <button @click="prevMonth" class="nav-btn">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="current-month">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
        <button @click="nextMonth" class="nav-btn">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="view-toggle">
        <button @click="toggleView('calendar')" :class="{ active: currentView === 'calendar' }">日历视图</button>
        <button @click="toggleView('chart')" :class="{ active: currentView === 'chart' }">数据视图</button>
      </div>
    </div>

    <div v-if="currentView === 'calendar'" class="calendar-view">
      <div class="custom-calendar">
        <div class="calendar-weekdays">
          <div class="weekday" v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day">周{{ day }}</div>
        </div>
        <div class="calendar-days">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            class="calendar-day"
            :class="{ 
              'empty': !day.date, 
              'selected': selectedDate === day.date,
              'has-events': day.taskCount && day.taskCount.total > 0,
              'today': day.date === getCurrentDate()
            }"
            @click="day.date && selectDate(day.date)"
          >
            <template v-if="day.date">
              <div class="day-number">{{ getDayNumber(day.date) }}</div>
              <div class="day-indicators">
                <span class="task-indicator" v-if="day.taskCount && day.taskCount.total > 0">
                  {{ day.taskCount.total }}任务
                </span>
                <span class="post-indicator" v-if="day.posts && day.posts.length > 0">
                  {{ day.posts.length }}条记录
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="selectedDate" class="day-detail">
        <h2>{{ formatSelectedDate }}</h2>
        <div v-if="dayData">
          <div class="day-tasks" v-if="dayData.tasks && dayData.tasks.length > 0">
            <h3>待办事项 ({{ dayData.statistics?.totalTasks || 0 }})</h3>
            <ul>
              <li v-for="task in dayData.tasks" :key="task.id" :class="{ completed: task.completed, important: task.important }">
                <span class="task-icon" v-if="task.important">⭐</span>
                <span class="task-title">{{ task.title }}</span>
                <span class="task-time" v-if="task.deadline">{{ formatTime(task.deadline) }}</span>
              </li>
            </ul>
          </div>
          <div class="day-tasks" v-if="dayData.systemTasks && dayData.systemTasks.length > 0">
            <h3>系统任务 ({{ dayData.systemTasks.length }})</h3>
            <ul>
              <li v-for="task in dayData.systemTasks" :key="task.id" class="completed">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-time" v-if="task.completedAt">{{ formatTime(task.completedAt) }}</span>
              </li>
            </ul>
          </div>
          <div class="day-posts" v-if="dayData.posts && dayData.posts.length > 0">
            <h3>说说 & 日记 ({{ dayData.posts.length }})</h3>
            <ul>
              <li v-for="post in dayData.posts" :key="post.id" :class="{ 'diary-post': post.type === 'diary', 'thought-post': post.type !== 'diary' }">
                <span class="post-type">{{ post.type === 'diary' ? '📝' : '💬' }}</span>
                <span class="post-title">{{ post.title || '无标题' }}</span>
                <span class="post-time">{{ formatTime(post.createdAt) }}</span>
              </li>
            </ul>
          </div>
          <div class="day-thoughts" v-if="dayData.plantThoughts && dayData.plantThoughts.length > 0">
            <h3>植物心声</h3>
            <ul>
              <li v-for="thought in dayData.plantThoughts" :key="thought.id" class="plant-thought">
                <span class="thought-icon">{{ thought.icon }}</span>
                <span class="thought-content">{{ thought.content }}</span>
              </li>
            </ul>
          </div>
          <div class="empty-day" v-if="(!dayData.tasks || dayData.tasks.length === 0) && 
                                      (!dayData.systemTasks || dayData.systemTasks.length === 0) && 
                                      (!dayData.posts || dayData.posts.length === 0) &&
                                      (!dayData.plantThoughts || dayData.plantThoughts.length === 0)">
            <p>今天没有任何任务或记录</p>
          </div>
        </div>
        <div v-else class="loading">
          加载中...
        </div>
      </div>
    </div>

    <div v-else-if="currentView === 'chart'" class="chart-view">
      <div class="statistics-container">
        <div class="stat-box">
          <h3>任务完成情况</h3>
          <div ref="taskPieChart" class="chart-item"></div>
        </div>
        <div class="stat-box">
          <h3>每周任务分布</h3>
          <div ref="weekdayBarChart" class="chart-item"></div>
        </div>
        <div class="stat-box">
          <h3>说说/日记分布</h3>
          <div ref="postsPieChart" class="chart-item"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import axios from 'axios';

export default {
  name: 'CalendarView',
  data() {
    return {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth(),
      currentView: 'calendar',
      calendarData: null,
      statistics: null,
      selectedDate: null,
      dayData: null,
      taskPieChart: null,
      weekdayBarChart: null,
      postsPieChart: null,
      loading: false,
      useMockData: false,
      calendarDays: []
    };
  },
  computed: {
    formatSelectedDate() {
      if (!this.selectedDate) return '';
      const date = new Date(this.selectedDate);
      const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${dayOfWeek}`;
    }
  },
  mounted() {
    this.fetchCalendarData();
  },
  methods: {
    getCurrentDate() {
      const now = new Date();
      return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    },
    async fetchCalendarData() {
      this.loading = true;
      try {
        if (this.useMockData) {
          this.calendarData = this.getMockMonthlyData();
          this.statistics = this.getMockStatistics();
        } else {
          const response = await axios.get('/calendar/monthly', {
            params: {
              year: this.currentYear,
              month: this.currentMonth + 1
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          this.calendarData = response.data;
          
          const statsResponse = await axios.get('/calendar/statistics', {
            params: {
              year: this.currentYear,
              month: this.currentMonth + 1
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          this.statistics = statsResponse.data;
        }
        
        this.generateCalendarDays();
        
        this.$nextTick(() => {
          if (this.currentView === 'chart') {
            this.initStatisticsCharts();
          }
          
          // 默认选中当前日期，如果当月有当前日期
          const today = this.getCurrentDate();
          const dayInCurrentMonth = this.calendarDays.find(day => day.date === today);
          
          if (dayInCurrentMonth) {
            this.selectDate(today);
          } else {
            // 否则选择第一个有日期的日历单元格
            const firstDay = this.calendarDays.find(day => day.date);
            if (firstDay && firstDay.date) {
              this.selectDate(firstDay.date);
            }
          }
        });
      } catch (error) {
        console.error('获取日历数据失败', error);
      } finally {
        this.loading = false;
      }
    },

    generateCalendarDays() {
      this.calendarDays = [];
      if (!this.calendarData || !this.calendarData.days) return;
      
      const year = this.currentYear;
      const month = this.currentMonth;
      
      // 获取当月第一天是星期几 (0-6, 0是星期日)
      const firstDay = new Date(year, month, 1).getDay();
      // 调整为从星期一开始 (1-7, 7是星期日)
      const firstDayOfWeek = firstDay === 0 ? 7 : firstDay;
      
      // 获取当月天数
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // 添加上个月的占位
      for (let i = 1; i < firstDayOfWeek; i++) {
        this.calendarDays.push({ date: null });
      }
      
      // 添加当月日期
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayData = this.calendarData.days.find(d => d.date === date) || { date };
        this.calendarDays.push(dayData);
      }
      
      // 如果需要，添加下个月的占位，使总数为7的倍数
      const remainingSlots = 7 - (this.calendarDays.length % 7);
      if (remainingSlots < 7) {
        for (let i = 0; i < remainingSlots; i++) {
          this.calendarDays.push({ date: null });
        }
      }
    },
    
    getDayNumber(dateString) {
      return parseInt(dateString.split('-')[2]);
    },
    
    selectDate(date) {
      this.selectedDate = date;
      this.fetchDayData(date);
    },
    
    async fetchDayData(date) {
      try {
        if (this.useMockData) {
          this.dayData = this.getMockDayData(date);
        } else {
          const response = await axios.get('/calendar/day', {
            params: {
              date: date
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          this.dayData = response.data;
        }
      } catch (error) {
        console.error('获取日期详情失败', error);
        this.dayData = null;
      }
    },
    
    getMockMonthlyData() {
      const days = [];
      const year = this.currentYear;
      const month = this.currentMonth + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        const totalTasks = Math.floor(Math.random() * 6);
        const completedTasks = Math.floor(Math.random() * (totalTasks + 1));
        
        const postCount = Math.floor(Math.random() * 3);
        
        const dayEntry = {
          date: date,
          taskCount: {
            total: totalTasks,
            completed: completedTasks,
            pending: totalTasks - completedTasks
          },
          tasks: []
        };
        
        for (let i = 0; i < totalTasks; i++) {
          const isCompleted = i < completedTasks;
          dayEntry.tasks.push({
            id: `task-${date}-${i}`,
            title: `任务 ${i + 1}`,
            description: `这是${month}月${day}日的任务 ${i + 1}`,
            deadline: `${date}T${Math.floor(10 + Math.random() * 8)}:00:00Z`,
            completed: isCompleted,
            important: Math.random() > 0.7
          });
        }
        
        const posts = [];
        for (let i = 0; i < postCount; i++) {
          const isFirstPost = i === 0;
          posts.push({
            id: `post-${date}-${i}`,
            title: isFirstPost ? `${month}月${day}日记录` : `${month}月${day}日随想`,
            type: isFirstPost ? 'diary' : 'thought',
            mood: ['happy', 'excited', 'calm', 'sad'][Math.floor(Math.random() * 4)],
            createdAt: `${date}T${Math.floor(10 + Math.random() * 12)}:${Math.floor(Math.random() * 60)}:00Z`
          });
        }
        
        dayEntry.posts = posts;
        days.push(dayEntry);
      }
      
      return {
        success: true,
        year: year,
        month: month,
        days: days
      };
    },
    
    getMockDayData(date) {
      const dayData = this.calendarData.days.find(d => d.date === date);
      if (!dayData) return null;
      
      const systemTasks = [];
      if (Math.random() > 0.3) {
        systemTasks.push({
          id: `sys-task-${date}-1`,
          title: '每日植物浇水',
          completed: Math.random() > 0.3,
          completedAt: Math.random() > 0.3 ? `${date}T08:30:00Z` : null
        });
      }
      
      const plantThoughts = [];
      if (Math.random() > 0.4) {
        const thoughts = [
          "看到你今天完成了任务，真为你高兴！继续保持！",
          "今天阳光真好，我感觉自己又长高了一点~",
          "主人今天看起来心情不错呢，我也跟着开心！",
          "记得定期给我浇水哦，我会为你加油的！",
          "今天完成了这么多任务，你真棒！休息一下吧~"
        ];
        
        plantThoughts.push({
          id: `thought-${date}-1`,
          content: thoughts[Math.floor(Math.random() * thoughts.length)],
          icon: ['🌱', '🌷', '🌻', '🌿'][Math.floor(Math.random() * 4)],
          timestamp: `${date}T${Math.floor(12 + Math.random() * 8)}:30:00Z`
        });
      }
      
      const dateObj = new Date(date);
      const dayOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][dateObj.getDay()];
      
      return {
        success: true,
        date: date,
        dayOfWeek: dayOfWeek,
        tasks: dayData.tasks,
        systemTasks: systemTasks,
        posts: dayData.posts,
        plantThoughts: plantThoughts,
        statistics: {
          completionRate: dayData.taskCount.total > 0 ? (dayData.taskCount.completed / dayData.taskCount.total) * 100 : 100,
          totalTasks: dayData.taskCount.total,
          completedTasks: dayData.taskCount.completed
        }
      };
    },
    
    getMockStatistics() {
      let totalTasks = 0;
      let completedTasks = 0;
      let totalPosts = 0;
      let diaryPosts = 0;
      let thoughtPosts = 0;
      
      this.calendarData.days.forEach(day => {
        totalTasks += day.taskCount.total;
        completedTasks += day.taskCount.completed;
        
        day.posts.forEach(post => {
          totalPosts++;
          if (post.type === 'diary') {
            diaryPosts++;
          } else {
            thoughtPosts++;
          }
        });
      });
      
      const weekdayDistribution = {
        monday: Math.floor(Math.random() * 10) + 5,
        tuesday: Math.floor(Math.random() * 10) + 5,
        wednesday: Math.floor(Math.random() * 10) + 8,
        thursday: Math.floor(Math.random() * 10) + 5,
        friday: Math.floor(Math.random() * 10) + 5,
        saturday: Math.floor(Math.random() * 5) + 1,
        sunday: Math.floor(Math.random() * 5) + 1
      };
      
      return {
        success: true,
        period: {
          year: this.currentYear,
          month: this.currentMonth + 1
        },
        statistics: {
          totalTasks: totalTasks,
          completedTasks: completedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          totalPosts: totalPosts,
          postsByType: {
            diary: diaryPosts,
            thought: thoughtPosts
          },
          busyDays: this.calendarData.days
            .filter(day => day.taskCount.total > 2)
            .map(day => day.date)
            .slice(0, 3),
          freeDays: this.calendarData.days
            .filter(day => day.taskCount.total === 0)
            .map(day => day.date)
            .slice(0, 3)
        },
        taskDistribution: {
          byWeekday: weekdayDistribution,
          byImportance: {
            important: Math.floor(totalTasks * 0.4),
            normal: totalTasks - Math.floor(totalTasks * 0.4)
          }
        }
      };
    },
    
    initStatisticsCharts() {
      if (!this.statistics) return;
      
      if (this.taskPieChart) {
        this.taskPieChart.dispose();
      }
      this.taskPieChart = echarts.init(this.$refs.taskPieChart);
      
      const stats = this.statistics.statistics;
      
      this.taskPieChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 0
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: stats.completedTasks, name: '已完成' },
              { value: stats.totalTasks - stats.completedTasks, name: '未完成' }
            ]
          }
        ]
      });
      
      if (this.weekdayBarChart) {
        this.weekdayBarChart.dispose();
      }
      this.weekdayBarChart = echarts.init(this.$refs.weekdayBarChart);
      
      const weekdayData = this.statistics.taskDistribution.byWeekday;
      
      this.weekdayBarChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: [
              weekdayData.monday,
              weekdayData.tuesday,
              weekdayData.wednesday,
              weekdayData.thursday,
              weekdayData.friday,
              weekdayData.saturday,
              weekdayData.sunday
            ],
            type: 'bar',
            itemStyle: {
              color: function(params) {
                const colorList = ['#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];
                return colorList[params.dataIndex];
              }
            }
          }
        ]
      });
      
      if (this.postsPieChart) {
        this.postsPieChart.dispose();
      }
      this.postsPieChart = echarts.init(this.$refs.postsPieChart);
      
      const postsByType = stats.postsByType;
      
      this.postsPieChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 0
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: postsByType.diary, name: '日记' },
              { value: postsByType.thought, name: '说说' }
            ]
          }
        ]
      });
    },
    
    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentYear--;
        this.currentMonth = 11;
      } else {
        this.currentMonth--;
      }
      this.selectedDate = null;
      this.dayData = null;
      this.fetchCalendarData();
    },
    
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentYear++;
        this.currentMonth = 0;
      } else {
        this.currentMonth++;
      }
      this.selectedDate = null;
      this.dayData = null;
      this.fetchCalendarData();
    },
    
    toggleView(view) {
      this.currentView = view;
      if (view === 'chart') {
        this.$nextTick(() => {
          this.initStatisticsCharts();
        });
      }
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    getLastDayOfMonth(year, month) {
      const lastDay = new Date(year, month + 1, 0).getDate();
      return `${year}-${(month + 1).toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    }
  },
  beforeDestroy() {
    if (this.taskPieChart) {
      this.taskPieChart.dispose();
    }
    if (this.weekdayBarChart) {
      this.weekdayBarChart.dispose();
    }
    if (this.postsPieChart) {
      this.postsPieChart.dispose();
    }
  }
};
</script>

<style scoped>
.calendar-container {
  width: 100%;
  height: 100%;
  padding: 30px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #f0f7fa 0%, #f8fbf4 100%);
  min-height: 100vh;
  color: #424242;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.calendar-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #2e7d32;
  margin: 0;
  background: linear-gradient(90deg, #2e7d32, #43a047);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 18px;
  font-weight: 500;
}

.current-month {
  font-size: 20px;
  color: #424242;
  font-weight: 600;
  min-width: 110px;
  text-align: center;
}

.nav-btn {
  background: none;
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.3s;
  color: #4caf50;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.nav-btn:hover {
  background-color: rgba(76, 175, 80, 0.1);
  border-color: #4caf50;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.view-toggle {
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.view-toggle button {
  padding: 10px 20px;
  border: none;
  background: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  color: #666;
  font-size: 15px;
}

.view-toggle button.active {
  background-color: #4caf50;
  color: white;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.calendar-view {
  display: flex;
  gap: 25px;
  height: calc(100% - 80px);
}

.custom-calendar {
  width: 65%;
  min-height: 450px;
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  padding: 25px;
  overflow: hidden;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 10px;
}

.weekday {
  padding: 10px;
  color: #757575;
  font-size: 15px;
  font-weight: 600;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-gap: 10px;
}

.calendar-day {
  aspect-ratio: 1;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.calendar-day:hover:not(.empty) {
  background-color: #f9f9f9;
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.07);
  border-color: rgba(76, 175, 80, 0.2);
}

.calendar-day.empty {
  background-color: rgba(249, 249, 249, 0.5);
  cursor: default;
  opacity: 0.4;
  border: 1px dashed #e0e0e0;
}

.calendar-day.selected {
  border: 2px solid #4caf50;
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.25);
  background-color: #e8f5e9;
}

.calendar-day.has-events {
  background-color: #f1f8e9;
}

.calendar-day.today {
  background-color: #e8f5e9;
  border: 2px solid #4caf50;
  position: relative;
}

.calendar-day.today .day-number {
  color: #2e7d32;
  font-weight: 700;
}

.calendar-day.today::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2e7d32, #4caf50);
  border-radius: 4px 4px 0 0;
}

.calendar-day.has-events::after {
  content: '';
  position: absolute;
  top: 10px;
  right: 10px;
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background-color: #4caf50;
}

.day-number {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #424242;
}

.day-indicators {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
}

.task-indicator {
  color: #4caf50;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  background-color: rgba(76, 175, 80, 0.1);
  padding: 2px 6px;
  border-radius: 20px;
  font-size: 10px;
}

.task-indicator::before {
  content: '📋';
  margin-right: 3px;
  font-size: 10px;
}

.post-indicator {
  color: #ff9800;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  background-color: rgba(255, 152, 0, 0.1);
  padding: 2px 6px;
  border-radius: 20px;
  font-size: 10px;
}

.post-indicator::before {
  content: '📝';
  margin-right: 3px;
  font-size: 10px;
}

.day-detail {
  width: 35%;
  padding: 25px;
  overflow-y: auto;
  height: 100%;
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  scrollbar-width: thin;
  scrollbar-color: rgba(76, 175, 80, 0.3) transparent;
}

.day-detail::-webkit-scrollbar {
  width: 6px;
}

.day-detail::-webkit-scrollbar-track {
  background: transparent;
}

.day-detail::-webkit-scrollbar-thumb {
  background-color: rgba(76, 175, 80, 0.3);
  border-radius: 6px;
}

.day-detail h2 {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: 15px;
  margin-bottom: 20px;
  font-size: 22px;
  color: #2e7d32;
  font-weight: 700;
  position: relative;
}

.day-detail h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, #2e7d32, #4caf50);
  border-radius: 3px;
}

.day-tasks, .day-posts, .day-thoughts {
  margin-bottom: 30px;
  padding: 0 5px;
}

.day-tasks h3, .day-posts h3, .day-thoughts h3 {
  font-size: 18px;
  color: #424242;
  margin-bottom: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.day-tasks h3::before {
  content: '📋';
  margin-right: 8px;
}

.day-posts h3::before {
  content: '📝';
  margin-right: 8px;
}

.day-thoughts h3::before {
  content: '🌱';
  margin-right: 8px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 14px 18px;
  margin-bottom: 12px;
  border-radius: 12px;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

li:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

li.completed {
  text-decoration: line-through;
  opacity: 0.7;
  background-color: rgba(76, 175, 80, 0.05);
}

li.important {
  border-left: 4px solid #ff5722;
  background-color: rgba(255, 87, 34, 0.05);
}

li.diary-post {
  border-left: 4px solid #4caf50;
  background-color: rgba(76, 175, 80, 0.05);
}

li.thought-post {
  border-left: 4px solid #ff9800;
  background-color: rgba(255, 152, 0, 0.05);
}

.task-icon, .post-type, .thought-icon {
  margin-right: 10px;
  font-size: 18px;
}

.task-title, .post-title {
  flex: 1;
  font-weight: 500;
}

.task-time, .post-time {
  font-size: 13px;
  color: #757575;
  margin-left: 10px;
  background: rgba(0, 0, 0, 0.04);
  padding: 3px 8px;
  border-radius: 20px;
}

.chart-view {
  height: calc(100% - 80px);
  overflow-y: auto;
  padding: 15px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(76, 175, 80, 0.3) transparent;
}

.chart-view::-webkit-scrollbar {
  width: 6px;
}

.chart-view::-webkit-scrollbar-track {
  background: transparent;
}

.chart-view::-webkit-scrollbar-thumb {
  background-color: rgba(76, 175, 80, 0.3);
  border-radius: 6px;
}

.statistics-container {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
}

.stat-box {
  width: calc(50% - 15px);
  min-width: 300px;
  height: 350px;
  border: none;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  background-color: #ffffff;
  transition: all 0.3s;
}

.stat-box:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.stat-box h3 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 20px;
  color: #2e7d32;
  font-weight: 600;
  position: relative;
  padding-bottom: 10px;
}

.stat-box h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #2e7d32, #4caf50);
  border-radius: 3px;
}

.chart-item {
  width: 100%;
  height: calc(100% - 45px);
}

.empty-day {
  text-align: center;
  color: #9e9e9e;
  padding: 60px 0;
  font-size: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.empty-day::before {
  content: '🌿';
  font-size: 32px;
}

.loading {
  text-align: center;
  padding: 40px 0;
  color: #757575;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading::after {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-left: 10px;
  border: 3px solid rgba(76, 175, 80, 0.3);
  border-radius: 50%;
  border-top-color: #4caf50;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.plant-thought {
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.thought-content {
  font-style: italic;
  color: #2e7d32;
  font-size: 15px;
}

@media (max-width: 768px) {
  .calendar-container {
    padding: 20px 15px;
  }
  
  .calendar-view {
    flex-direction: column;
  }
  
  .custom-calendar, .day-detail {
    width: 100%;
  }
  
  .custom-calendar {
    height: auto;
  }
  
  .day-detail {
    margin-top: 25px;
    max-height: 500px;
  }
  
  .stat-box {
    width: 100%;
  }
  
  .calendar-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .view-toggle {
    width: 100%;
    justify-content: center;
  }
  
  .calendar-nav {
    width: 100%;
    justify-content: space-between;
  }
  
  .calendar-day {
    padding: 5px;
  }
  
  .day-number {
    font-size: 16px;
  }
  
  .day-indicators {
    font-size: 9px;
  }
}
</style> 