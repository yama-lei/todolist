const express = require('express');
const auth = require('../middleware/auth');
const { Tasks } = require('../utils/localDB');
const router = express.Router();

// 获取用户所有任务
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Tasks.find({ userId: req.user.id }, { createdAt: -1 });
    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 创建新任务
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, deadline, important } = req.body;

    // 检查必填字段
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '请提供任务标题'
      });
    }

    const task = {
      userId: req.user.id,
      title,
      description: description || '',
      deadline: deadline || null,
      completed: false,
      important: important || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newTask = await Tasks.insert(task);

    res.status(201).json({
      success: true,
      task: newTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 完成任务
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Tasks.findOne({ _id: taskId, userId: req.user.id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    const completedAt = new Date().toISOString();
    await Tasks.update(
      { _id: taskId },
      { 
        $set: { 
          completed: true, 
          completedAt,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    res.json({
      success: true,
      task: {
        id: task._id,
        title: task.title,
        completed: true,
        completedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取任务详情
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Tasks.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新任务
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, deadline, important } = req.body;
    const updates = {};
    
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (deadline !== undefined) updates.deadline = deadline;
    if (important !== undefined) updates.important = important;
    updates.updatedAt = new Date().toISOString();
    
    const task = await Tasks.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    await Tasks.update(
      { _id: req.params.id },
      { $set: updates }
    );
    
    const updatedTask = await Tasks.findOne({ _id: req.params.id });
    
    res.json({
      success: true,
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除任务
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Tasks.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    await Tasks.remove({ _id: req.params.id });
    
    res.json({
      success: true,
      message: '任务已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 