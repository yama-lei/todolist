const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Users } = require('../utils/localDB');
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
      signature: user.signature
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
      signature: updatedUser.signature
    });
  } catch (error) {
    console.error('更新个人资料失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新个人资料失败'
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