const OSS = require('ali-oss');
const dotenv = require('dotenv');
const crypto = require('crypto');

// 加载环境变量
dotenv.config();

/**
 * 获取OSS客户端实例
 * @returns {OSS} OSS客户端实例
 */
function getOSSClient() {
  const client = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET
  });
  return client;
}

/**
 * 生成OSS临时上传凭证
 * @param {string} dir 上传目录
 * @returns {Object} 上传凭证和配置信息
 */
function generateOSSConfig(dir = 'images/') {
  // 检查环境变量是否配置
  if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET || 
      !process.env.OSS_REGION || !process.env.OSS_BUCKET) {
    console.warn('OSS环境变量配置不完整');
  }

  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 1); // 设置过期时间为1小时后

  // 生成唯一的文件名前缀
  const timestamp = new Date().getTime();
  const randomString = crypto.randomBytes(10).toString('hex');
  const key = `${dir}${timestamp}-${randomString}`;

  // OSS配置
  const config = {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    region: process.env.OSS_REGION || 'oss-cn-nanjing', // 默认使用杭州区域
    bucket: process.env.OSS_BUCKET,
    key,
    expiration: expiration.toISOString(),
    host: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION || 'oss-cn-nanjing'}.aliyuncs.com`,
    cdnHost: process.env.OSS_CDN_HOST || `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION || 'oss-cn-nanjing'}.aliyuncs.com`
  };

  // 打印调试信息，方便排查问题
  console.log('生成OSS配置:', {
    region: config.region,
    bucket: config.bucket,
    key: config.key,
    host: config.host
  });

  return config;
}

/**
 * 获取OSS STS临时凭证
 * @returns {Object} OSS配置信息，包括临时凭证
 */
function getOSSTokenForClient() {
  // 这里简化处理，实际生产环境应该使用STS服务获取临时凭证
  return {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    region: process.env.OSS_REGION || 'oss-cn-nanjing',
    bucket: process.env.OSS_BUCKET,
    stsToken: '', // 生产环境应该通过STS服务获取
    host: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION || 'oss-cn-nanjing'}.aliyuncs.com`,
    cdnHost: process.env.OSS_CDN_HOST || `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION || 'oss-cn-nanjing'}.aliyuncs.com`,
    expiration: new Date(Date.now() + 3600 * 1000).toISOString() // 1小时过期
  };
}

module.exports = {
  getOSSClient,
  generateOSSConfig,
  getOSSTokenForClient
}; 