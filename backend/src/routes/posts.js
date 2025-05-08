const express = require('express');
const auth = require('../middleware/auth');
const { Posts } = require('../utils/localDB');
const router = express.Router();

// 获取所有帖子
router.get('/', auth, async (req, res) => {
  try {
    // 可以按类型筛选
    const query = { userId: req.user.id };
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    const posts = await Posts.find(query, { createdAt: -1 });
    
    // 确保日期格式正确
    const formattedPosts = posts.map(post => ({
      ...post,
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()
    }));
    
    res.json({
      success: true,
      posts: formattedPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 创建新帖子
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, images, location, mood, weather, type } = req.body;
    
    // 检查必填字段
    if (!content) {
      return res.status(400).json({
        success: false,
        message: '请提供帖子内容'
      });
    }
    
    // 帖子类型限制
    if (type && !['diary', 'thought'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '帖子类型无效'
      });
    }
    
    const now = new Date();
    const post = {
      userId: req.user.id,
      title: title || '',
      content,
      images: images || [],
      location: location || '',
      mood: mood || 'neutral',
      weather: weather || 'sunny',
      type: type || 'thought',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      likes: 0
    };
    
    const newPost = await Posts.insert(post);
    
    res.status(201).json({
      success: true,
      post: {
        ...newPost,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取帖子详情
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Posts.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新帖子
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, images, location, mood, weather } = req.body;
    const updates = {};
    
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (images !== undefined) updates.images = images;
    if (location !== undefined) updates.location = location;
    if (mood !== undefined) updates.mood = mood;
    if (weather !== undefined) updates.weather = weather;
    
    const post = await Posts.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    await Posts.update(
      { _id: req.params.id },
      { $set: updates }
    );
    
    const updatedPost = await Posts.findOne({ _id: req.params.id });
    
    res.json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除帖子
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Posts.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    await Posts.remove({ _id: req.params.id });
    
    res.json({
      success: true,
      message: '帖子已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 点赞帖子
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Posts.findOne({ _id: req.params.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 增加点赞数
    const newLikes = (post.likes || 0) + 1;
    
    await Posts.update(
      { _id: req.params.id },
      { $set: { likes: newLikes } }
    );
    
    res.json({
      success: true,
      likes: newLikes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 