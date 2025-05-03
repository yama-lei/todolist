const jwt = require('jsonwebtoken');

// 认证中间件
const auth = (req, res, next) => {
  // 获取token
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '无访问权限，需要认证'
    });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plantodo_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false, 
      message: '无效的Token'
    });
  }
};

module.exports = auth; 