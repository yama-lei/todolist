import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => response.data,
  error => {
    // 统一处理错误
    console.error('API错误:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 用户认证API
const authApi = {
  // 用户注册
  register(userData) {
    return api.post('/auth/register', userData);
  },
  
  // 用户登录
  login(credentials) {
    return api.post('/auth/login', credentials);
  },
  
  // 获取当前用户信息
  getCurrentUser() {
    return api.get('/auth/me');
  },
  
  // 退出登录
  logout() {
    return api.post('/auth/logout');
  },
  
  // 修改密码
  changePassword(passwordData) {
    return api.put('/auth/password', passwordData);
  },
  
  // 忘记密码请求
  forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },
  
  // 重置密码
  resetPassword(resetData) {
    return api.post('/auth/reset-password', resetData);
  }
};

// 植物API
const plantApi = {
  // 获取用户所有植物
  getPlants() {
    return api.get('/plants');
  },
  
  // 获取特定植物详情
  getPlant(id) {
    return api.get(`/plants/${id}`);
  },
  
  // 创建植物
  createPlant(plantData) {
    return api.post('/plants', plantData);
  },
  
  // 更新植物信息
  updatePlant(id, plantData) {
    if (!id) {
      console.error('API调用错误: 无法更新植物，ID无效', id);
      return Promise.reject(new Error('无效的植物ID'));
    }
    return api.put(`/plants/${id}`, plantData);
  },
  
  // 删除植物
  deletePlant(id) {
    return api.delete(`/plants/${id}`);
  },
  
  // 增加植物经验
  increaseExperience(id, amount) {
    return api.put(`/plants/${id}/experience`, { amount });
  },
  
  // 更新植物生长阶段
  updateGrowthStage(id, stage) {
    return api.put(`/plants/${id}/growth-stage`, { stage });
  },
  
  // 获取植物心声
  getPlantThoughts(id) {
    return api.get(`/plants/${id}/thoughts`);
  },
  
  // 生成新的植物心声
  generatePlantThought(id, context) {
    return api.post(`/plants/${id}/thoughts`, { context });
  },
  
  // 获取与植物的对话历史
  getConversations(id, limit, before) {
    const params = {};
    if (limit) params.limit = limit;
    if (before) params.before = before;
    
    return api.get(`/plants/${id}/conversations`, { params });
  },
  
  // 发送消息给植物并获取回复
  sendMessage(id, message, context = {}) {
    return api.post(`/plants/${id}/conversations`, { 
      message,
      context
    });
  }
};

// 任务API
const taskApi = {
  // 获取所有任务
  getTasks() {
    return api.get('/tasks');
  },
  
  // 获取系统任务
  getSystemTasks() {
    return api.get('/tasks/system');
  },
  
  // 完成系统任务
  completeSystemTask(id) {
    return api.put(`/tasks/system/${id}/complete`);
  },
  
  // 创建新任务
  createTask(taskData) {
    return api.post('/tasks', taskData);
  },
  
  // 删除任务
  deleteTask(id) {
    return api.delete(`/tasks/${id}`);
  },
  
  // 更新任务
  updateTask(id, taskData) {
    return api.put(`/tasks/${id}`, taskData);
  },
  
  // 完成任务
  completeTask(id) {
    return api.put(`/tasks/${id}/complete`);
  }
};

// 帖子API
const postApi = {
  // 获取所有帖子
  getPosts(type) {
    const params = {};
    if (type && type !== 'all') {
      params.type = type;
    }
    return api.get('/posts', { params });
  },
  
  // 获取帖子详情
  getPost(id) {
    return api.get(`/posts/${id}`);
  },
  
  // 创建帖子
  createPost(postData) {
    return api.post('/posts', postData);
  },
  
  // 更新帖子
  updatePost(id, postData) {
    return api.put(`/posts/${id}`, postData);
  },
  
  // 删除帖子
  deletePost(id) {
    return api.delete(`/posts/${id}`);
  },
  
  // 点赞帖子
  likePost(id) {
    return api.post(`/posts/${id}/like`);
  }
};

// 智能洞察API
const insightsApi = {
  // 获取任务完成情况总结
  getTaskInsights(period = 'week') {
    return api.get('/insights/tasks', { params: { period } });
  },
  
  // 获取每周总结
  getWeeklyInsights(date) {
    const params = {};
    if (date) params.date = date;
    return api.get('/insights/weekly', { params });
  }
};

export { plantApi, taskApi, authApi, postApi, insightsApi };
export default api; 