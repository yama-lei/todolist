const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 数据库连接
const dbConfig = require('./config/database');
dbConfig.connectDB();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/plants', require('./routes/plants'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/tasks/system', require('./routes/system-tasks'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/insights', require('./routes/insights'));

// 基础路由
app.get('/', (req, res) => {
  res.json({ message: 'Plantodo API' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口: ${PORT}`);
});

module.exports = app; 