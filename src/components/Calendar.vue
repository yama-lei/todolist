<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <h1>日历</h1>
      <div class="calendar-nav">
        <button @click="prevMonth" class="nav-btn">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span>{{ currentYear }}年{{ currentMonth + 1 }}月</span>
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
      <div ref="calendar" class="echarts-calendar"></div>
      <div v-if="selectedDate" class="day-detail">
        <h2>{{ formatSelectedDate }}</h2>
        <div v-if="dayData">
          <div class="day-tasks" v-if="dayData.tasks && dayData.tasks.length > 0">
            <h3>待办事项 ({{ dayData.taskCount?.total || 0 }})</h3>
            <ul>
              <li v-for="task in dayData.tasks" :key="task.id" :class="{ completed: task.completed, important: task.important }">
                <span class="task-icon" v-if="task.important">⭐</span>
                <span class="task-title">{{ task.title }}</span>
                <span class="task-time" v-if="task.deadline">{{ formatTime(task.deadline) }}</span>
              </li>
            </ul>
          </div>
          <div class="day-posts" v-if="dayData.posts && dayData.posts.length > 0">
            <h3>说说 & 日记 ({{ dayData.posts.length }})</h3>
            <ul>
              <li v-for="post in dayData.posts" :key="post.id">
                <span class="post-type">{{ post.type === 'diary' ? '📝' : '💬' }}</span>
                <span class="post-title">{{ post.title }}</span>
                <span class="post-time">{{ formatTime(post.createdAt) }}</span>
              </li>
            </ul>
          </div>
          <div class="empty-day" v-if="(!dayData.tasks || dayData.tasks.length === 0) && (!dayData.posts || dayData.posts.length === 0)">
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
      calendarChart: null,
      taskPieChart: null,
      weekdayBarChart: null,
      postsPieChart: null,
      loading: false,
      useMockData: true
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
    async fetchCalendarData() {
      this.loading = true;
      try {
        if (this.useMockData) {
          this.calendarData = this.getMockMonthlyData();
          this.statistics = this.getMockStatistics();
        } else {
          const response = await axios.get('/api/calendar/monthly', {
            params: {
              year: this.currentYear,
              month: this.currentMonth + 1
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          this.calendarData = response.data;
          
          const statsResponse = await axios.get('/api/calendar/statistics', {
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
        
        this.$nextTick(() => {
          this.initCalendarChart();
          if (this.currentView === 'chart') {
            this.initStatisticsCharts();
          }
        });
      } catch (error) {
        console.error('获取日历数据失败', error);
      } finally {
        this.loading = false;
      }
    },
    
    async fetchDayData(date) {
      try {
        if (this.useMockData) {
          this.dayData = this.getMockDayData(date);
        } else {
          const response = await axios.get('/api/calendar/day', {
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
    
    initCalendarChart() {
      if (this.calendarChart) {
        this.calendarChart.dispose();
      }
      
      this.calendarChart = echarts.init(this.$refs.calendar);
      
      const calendarData = this.calendarData;
      if (!calendarData || !calendarData.days) return;
      
      const daysData = calendarData.days.map(day => {
        return [
          day.date,
          day.taskCount ? day.taskCount.total : 0,
          day.posts ? day.posts.length : 0
        ];
      });
      
      const taskData = daysData.map(item => [item[0], item[1]]);
      const postData = daysData.map(item => [item[0], item[2]]);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const date = params.value[0];
            const tasks = params.value[1];
            const posts = this.calendarData.days.find(d => d.date === date)?.posts?.length || 0;
            const pendingTasks = this.calendarData.days.find(d => d.date === date)?.taskCount?.pending || 0;
            
            return `<div>
                      <div>${date}</div>
                      <div>待办事项: ${tasks} (未完成: ${pendingTasks})</div>
                      <div>说说/日记: ${posts}</div>
                    </div>`;
          }
        },
        visualMap: {
          show: false,
          min: 0,
          max: 10,
          calculable: true,
          seriesIndex: [0],
          inRange: {
            color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
          }
        },
        calendar: {
          top: 50,
          left: 30,
          right: 30,
          cellSize: ['auto', 'auto'],
          range: [
            `${this.currentYear}-${this.currentMonth + 1}-01`,
            this.getLastDayOfMonth(this.currentYear, this.currentMonth)
          ],
          itemStyle: {
            borderWidth: 0.5
          },
          yearLabel: { show: false },
          monthLabel: { show: false },
          dayLabel: {
            nameMap: 'cn'
          }
        },
        series: [
          {
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: taskData
          },
          {
            type: 'scatter',
            coordinateSystem: 'calendar',
            data: postData,
            symbolSize: (val) => {
              return val[1] > 0 ? 6 : 0;
            },
            itemStyle: {
              color: '#ff9800'
            }
          }
        ]
      };
      
      this.calendarChart.setOption(option);
      
      this.calendarChart.on('click', (params) => {
        if (params.componentType === 'series') {
          const date = params.value[0];
          this.selectedDate = date;
          this.fetchDayData(date);
        }
      });
    },
    
    initStatisticsCharts() {
      if (!this.statistics) return;
      
      if (this.taskPieChart) {
        this.taskPieChart.dispose();
      }
      this.taskPieChart = echarts.init(this.$refs.taskPieChart);
      
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
              { value: this.statistics.statistics.completedTasks, name: '已完成' },
              { value: this.statistics.statistics.totalTasks - this.statistics.statistics.completedTasks, name: '未完成' }
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
      
      const postsByType = this.statistics.statistics.postsByType;
      
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
      } else {
        this.$nextTick(() => {
          this.initCalendarChart();
        });
      }
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    getLastDayOfMonth(year, month) {
      const lastDay = new Date(year, month + 1, 0).getDate();
      return `${year}-${month + 1}-${lastDay}`;
    }
  },
  beforeDestroy() {
    if (this.calendarChart) {
      this.calendarChart.dispose();
    }
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
  padding: 20px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: var(--background-color);
  min-height: 100vh;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
}

.nav-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-btn:hover {
  background-color: #f0f0f0;
}

.view-toggle {
  display: flex;
  gap: 10px;
}

.view-toggle button {
  padding: 6px 15px;
  border: 1px solid #ddd;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-toggle button.active {
  background-color: #4caf50;
  color: white;
  border-color: #4caf50;
}

.calendar-view {
  display: flex;
  gap: 20px;
  height: calc(100% - 70px);
}

.echarts-calendar {
  width: 65%;
  height: 100%;
  min-height: 400px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 15px;
}

.day-detail {
  width: 35%;
  padding: 20px;
  border-left: 1px solid #eee;
  overflow-y: auto;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.day-detail h2 {
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.day-tasks, .day-posts {
  margin-bottom: 20px;
}

.day-tasks h3, .day-posts h3 {
  font-size: 16px;
  color: #555;
  margin-bottom: 10px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

li.completed {
  text-decoration: line-through;
  opacity: 0.7;
}

li.important {
  border-left: 3px solid #ff5722;
}

.task-icon, .post-type {
  margin-right: 8px;
}

.task-title, .post-title {
  flex: 1;
}

.task-time, .post-time {
  font-size: 12px;
  color: #888;
}

.chart-view {
  height: calc(100% - 70px);
  overflow-y: auto;
}

.statistics-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.stat-box {
  width: calc(50% - 10px);
  min-width: 300px;
  height: 300px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.stat-box h3 {
  text-align: center;
  margin-bottom: 15px;
}

.chart-item {
  width: 100%;
  height: calc(100% - 40px);
}

.empty-day {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.loading {
  text-align: center;
  padding: 20px 0;
  color: #888;
}

@media (max-width: 768px) {
  .calendar-view {
    flex-direction: column;
  }
  
  .echarts-calendar, .day-detail {
    width: 100%;
  }
  
  .echarts-calendar {
    height: 400px;
  }
  
  .day-detail {
    border-left: none;
    border-top: 1px solid #eee;
    padding-top: 20px;
  }
  
  .stat-box {
    width: 100%;
  }
}
</style> 