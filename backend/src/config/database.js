const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Datastore = require('nedb-promises');

// 创建本地存储目录
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// NeDB数据库配置 - 用于本地存储
const localDb = {
  users: Datastore.create({ filename: path.join(DATA_DIR, 'users.db'), autoload: true }),
  tasks: Datastore.create({ filename: path.join(DATA_DIR, 'tasks.db'), autoload: true }),
  plants: Datastore.create({ filename: path.join(DATA_DIR, 'plants.db'), autoload: true }),
  plantThoughts: Datastore.create({ filename: path.join(DATA_DIR, 'plant_thoughts.db'), autoload: true }),
  conversations: Datastore.create({ filename: path.join(DATA_DIR, 'conversations.db'), autoload: true }),
  posts: Datastore.create({ filename: path.join(DATA_DIR, 'posts.db'), autoload: true }),
  systemTasks: Datastore.create({ filename: path.join(DATA_DIR, 'system_tasks.db'), autoload: true }),
  userSystemTasks: Datastore.create({ filename: path.join(DATA_DIR, 'user_system_tasks.db'), autoload: true }),
};

// 为NeDB创建索引
localDb.users.ensureIndex({ fieldName: 'email', unique: true });
localDb.tasks.ensureIndex({ fieldName: 'userId' });
localDb.plants.ensureIndex({ fieldName: 'userId' });
localDb.posts.ensureIndex({ fieldName: 'userId' });

// MongoDB连接 - 用于服务器端
const connectDB = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI) {
      // 在生产环境使用MongoDB
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB 已连接');
    } else {
      // 在开发环境使用本地NeDB
      console.log('使用本地NeDB数据库');
    }
  } catch (error) {
    console.error('数据库连接错误:', error.message);
    // 如果是生产环境并且MongoDB连接失败，则退出进程
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = {
  connectDB,
  localDb
}; 