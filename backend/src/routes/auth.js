const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Users } = require('../utils/localDB');
const { Tasks } = require('../utils/localDB');
const router = express.Router();
const auth = require('../middleware/auth'); // 添加认证中间件引用

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名、邮箱和密码'
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户
    const user = {
      username,
      email,
      password: hashedPassword,
      mentalHealthStatus: [],  // 添加心理状态数组
      dailyTaskStats: [],      // 添加每日任务统计数组
      createdAt: new Date().toISOString()
    };

    const newUser = await Users.insert(user);

    // 生成Token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'plantodo_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 检查必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供邮箱和密码'
      });
    }

    // 查找用户
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '邮箱或密码不正确'
      });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '邮箱或密码不正确'
      });
    }

    // 生成Token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'plantodo_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    console.log('获取用户信息，用户ID:', req.user.id);
    const user = await Users.findOne({ _id: req.user.id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 返回用户信息，不包含密码
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      bio: user.bio,
      avatar: user.avatar,
      gender: user.gender || 'secret',
      birthday: user.birthday,
      location: user.location,
      signature: user.signature,
      mentalHealthStatus: user.mentalHealthStatus || [], // 添加心理状态
      dailyTaskStats: user.dailyTaskStats || []         // 添加任务统计
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取用户信息失败'
    });
  }
});

// 更新个人资料
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, bio, avatar, gender, birthday, location, signature } = req.body;
    const updates = {};
    
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;
    if (gender && ['male', 'female', 'secret'].includes(gender)) updates.gender = gender;
    if (birthday !== undefined) {
      // 验证生日格式是否正确（如果提供了生日）
      if (birthday && !isValidDate(birthday)) {
        return res.status(400).json({
          success: false,
          message: '生日格式不正确'
        });
      }
      updates.birthday = birthday;
    }
    if (location !== undefined) updates.location = location;
    if (signature !== undefined) updates.signature = signature;
    
    const user = await Users.findOne({ _id: req.user.id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    await Users.update(
      { _id: req.user.id },
      { $set: updates }
    );
    
    const updatedUser = await Users.findOne({ _id: req.user.id });
    
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt,
      gender: updatedUser.gender || 'secret',
      birthday: updatedUser.birthday,
      location: updatedUser.location,
      signature: updatedUser.signature,
      mentalHealthStatus: updatedUser.mentalHealthStatus || [],
      dailyTaskStats: updatedUser.dailyTaskStats || []
    });
  } catch (error) {
    console.error('更新个人资料失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新个人资料失败'
    });
  }
});

// 更新用户心理状态
router.post('/mental-health', auth, async (req, res) => {
  try {
    const { score, date } = req.body;
    
    // 验证分数
    if (score === undefined || score < 1 || score > 10) {
      return res.status(400).json({
        success: false,
        message: '心理状态得分必须在1-10之间'
      });
    }
    
    // 验证日期
    const recordDate = date ? new Date(date) : new Date();
    if (isNaN(recordDate)) {
      return res.status(400).json({
        success: false,
        message: '日期格式不正确'
      });
    }
    
    const dateStr = recordDate.toISOString().split('T')[0];
    
    const user = await Users.findOne({ _id: req.user.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 初始化心理状态数组（如果不存在）
    if (!user.mentalHealthStatus) {
      user.mentalHealthStatus = [];
    }
    
    // 检查是否已有当天的记录
    const existingIndex = user.mentalHealthStatus.findIndex(item => 
      item.date === dateStr
    );
    
    if (existingIndex >= 0) {
      // 更新现有记录
      user.mentalHealthStatus[existingIndex].score = score;
    } else {
      // 添加新记录
      user.mentalHealthStatus.push({
        date: dateStr,
        score: score
      });
    }
    
    // 保留最近30天的记录
    if (user.mentalHealthStatus.length > 30) {
      user.mentalHealthStatus.sort((a, b) => new Date(b.date) - new Date(a.date));
      user.mentalHealthStatus = user.mentalHealthStatus.slice(0, 30);
    }
    
    await Users.update(
      { _id: req.user.id },
      { $set: { mentalHealthStatus: user.mentalHealthStatus } }
    );
    
    res.json({
      success: true,
      message: '心理状态已更新',
      mentalHealth: user.mentalHealthStatus
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取用户心理状态和任务数量统计
router.get('/stats', auth, async (req, res) => {
  try {
    // 获取日期范围
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();
    
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        message: '日期格式不正确'
      });
    }
    
    const user = await Users.findOne({ _id: req.user.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 处理心理状态数据
    const mentalHealthData = (user.mentalHealthStatus || [])
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 获取指定日期范围内的任务数据
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    // 获取任务统计
    const taskCountData = [];
    
    // 生成每一天的数据
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // 获取当天的任务数量
      const dayTasks = await Tasks.find({
        userId: req.user.id,
        createdAt: {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lt: new Date(dateStr + 'T23:59:59.999Z')
        }
      });
      
      // 计算已完成任务数量
      const completedTasks = dayTasks.filter(task => task.completed).length;
      
      taskCountData.push({
        date: dateStr,
        total: dayTasks.length,
        completed: completedTasks
      });
      
      // 前进一天
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 更新用户的任务统计数据
    if (!user.dailyTaskStats) {
      user.dailyTaskStats = [];
    }
    
    // 合并新的任务统计数据
    taskCountData.forEach(dayData => {
      const existingIndex = user.dailyTaskStats.findIndex(item => item.date === dayData.date);
      
      if (existingIndex >= 0) {
        user.dailyTaskStats[existingIndex] = dayData;
      } else {
        user.dailyTaskStats.push(dayData);
      }
    });
    
    // 保留最近30天的记录
    if (user.dailyTaskStats.length > 30) {
      user.dailyTaskStats.sort((a, b) => new Date(b.date) - new Date(a.date));
      user.dailyTaskStats = user.dailyTaskStats.slice(0, 30);
    }
    
    await Users.update(
      { _id: req.user.id },
      { $set: { dailyTaskStats: user.dailyTaskStats } }
    );
    
    res.json({
      success: true,
      mentalHealth: mentalHealthData,
      taskCount: taskCountData
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 辅助函数：验证日期格式
function isValidDate(dateString) {
  if (!dateString) return true; // 允许为空
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date <= new Date();
}

module.exports = router; 