const express = require('express');
const auth = require('../middleware/auth');
const { getOSSTokenForClient, generateOSSConfig } = require('../utils/ossUtil');
const crypto = require('crypto');
const router = express.Router();

/**
 * @route   GET /api/oss/config
 * @desc    获取OSS配置信息（包括STS临时凭证）
 * @access  Private
 */
router.get('/config', auth, (req, res) => {
  try {
    const ossConfig = getOSSTokenForClient();
    
    res.json({
      success: true,
      config: ossConfig
    });
  } catch (error) {
    console.error('获取OSS配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取OSS配置失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/oss/policy
 * @desc    获取OSS上传策略（Policy），用于前端直传
 * @access  Private
 */
router.get('/policy', auth, (req, res) => {
  try {
    // 文件要上传到的目录
    const dir = req.query.dir || 'posts/';
    
    // 获取OSS配置和上传策略
    const config = generateOSSConfig(dir);
    
    // 检查是否有必要的环境变量
    if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'OSS配置缺失，请联系管理员'
      });
    }

    // 设置上传策略过期时间
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);  // 1小时后过期
    
    // 设置OSS上传条件
    const conditions = [
      // 限制上传文件大小
      ['content-length-range', 0, 10 * 1024 * 1024], // 10MB限制
    ];
    
    // 构建完整的policy对象
    const policyObj = {
      expiration: expiration.toISOString(),
      conditions: conditions
    };
    
    // 将policy转为JSON字符串，再转为Base64
    const policyBase64 = Buffer.from(JSON.stringify(policyObj)).toString('base64');
    
    // 使用OSS AccessKeySecret对policy签名
    const signature = crypto.createHmac('sha1', process.env.OSS_ACCESS_KEY_SECRET)
      .update(policyBase64)
      .digest('base64');
    
    res.json({
      success: true,
      policy: {
        key: config.key,
        region: config.region,
        bucket: config.bucket,
        host: `https://${config.bucket}.${config.region}.aliyuncs.com`,
        cdnHost: config.cdnHost ? config.cdnHost : `https://${config.bucket}.${config.region}.aliyuncs.com`,
        accessKeyId: config.accessKeyId,
        policyBase64: policyBase64,
        signature: signature,
        expiration: config.expiration
      }
    });
  } catch (error) {
    console.error('获取OSS上传策略失败:', error);
    res.status(500).json({
      success: false,
      message: '获取OSS上传策略失败',
      error: error.message
    });
  }
});

module.exports = router; 