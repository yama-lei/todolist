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
    
    // 确保日期格式正确，但不修改原始日期值
    const formattedPosts = posts.map(post => {
      // 只处理日期格式，不创建新日期对象
      let formattedCreatedAt = post.createdAt;
      
      // 如果没有创建时间，才设置为当前时间
      if (!formattedCreatedAt) {
        formattedCreatedAt = new Date().toISOString();
      } else if (typeof formattedCreatedAt === 'string') {
        // 如果已经是字符串格式，确保是有效的ISO格式
        try {
          const date = new Date(formattedCreatedAt);
          if (!isNaN(date.getTime())) {
            // 只有在日期有效时才格式化，否则保留原始值
            formattedCreatedAt = date.toISOString();
          }
        } catch (e) {
          console.error('无效的日期格式:', formattedCreatedAt);
        }
      }
      
      return {
        ...post,
        createdAt: formattedCreatedAt
      };
    });
    
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

// 获取近一个月帖子合集
router.get('/recent', auth, async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const posts = await Posts.find({
      userId: req.user.id,
      createdAt: { $gte: oneMonthAgo.toISOString() }
    }, { createdAt: -1 });
    
    // 格式化帖子数据
    const formattedPosts = posts.map(post => {
      let createdAt;
      try {
        // 确保日期字符串是有效的
        if (typeof post.createdAt === 'string' && post.createdAt.includes('T')) {
          createdAt = new Date(post.createdAt);
        } else {
          createdAt = new Date();
        }
        
        // 检查日期是否有效
        if (isNaN(createdAt.getTime())) {
          createdAt = new Date();
        }
      } catch (e) {
        createdAt = new Date();
      }
      
      return {
        title: post.title || '',
        content: post.content || '',
        createdAt: `${createdAt.getMonth() + 1}月${createdAt.getDate()}日`,
        mood: post.mood || 'neutral'
      };
    });
    
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
    const { title, content, images, location, mood, weather, createdAt } = req.body;
    const updates = {};
    
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (images !== undefined) updates.images = images;
    if (location !== undefined) updates.location = location;
    if (mood !== undefined) updates.mood = mood;
    if (weather !== undefined) updates.weather = weather;
    if (createdAt !== undefined) updates.createdAt = createdAt;
    
    // 设置更新时间
    updates.updatedAt = new Date().toISOString();
    
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