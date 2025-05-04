const jwt = require('jsonwebtoken');

// 认证中间件
const auth = (req, res, next) => {
  console.log('认证中间件被调用，路径:', req.path);
  
  // 获取token
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('认证失败: 没有提供token或格式不正确');
    return res.status(401).json({
      success: false,
      message: '无访问权限，需要认证'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('尝试验证token:', token.substring(0, 20) + '...');

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plantodo_secret_key');
    console.log('token验证成功，用户ID:', decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('token验证失败:', err.message);
    res.status(401).json({
      success: false, 
      message: '无效的Token',
      error: err.message
    });
  }
};

module.exports = auth; 