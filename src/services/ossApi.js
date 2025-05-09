import api from './api';
import axios from 'axios';

// OSS操作相关API
const ossApi = {
  /**
   * 获取OSS配置（临时凭证）
   * @returns {Promise<Object>} OSS配置信息
   */
  getOSSConfig() {
    return api.get('/oss/config');
  },

  /**
   * 获取OSS上传策略（Policy）
   * @param {string} dir 上传目录
   * @returns {Promise<Object>} 上传策略
   */
  getOSSPolicy(dir = 'posts/') {
    return api.get('/oss/policy', { params: { dir } });
  },

  /**
   * 直接上传文件到阿里云OSS
   * @param {File} file 要上传的文件对象
   * @param {string} dir 上传目录
   * @returns {Promise<string>} 文件的URL
   */
  async uploadFile(file, dir = 'posts/') {
    try {
      // 1. 获取上传策略
      const policyRes = await this.getOSSPolicy(dir);
      const policy = policyRes.policy;
      
      if (!policy) {
        throw new Error('获取上传策略失败');
      }
      
      // 检查并处理host，确保是一个有效的URL字符串
      let host = policy.host;
      if (typeof host === 'object') {
        console.error('Host 是一个对象而不是字符串:', host);
        // 尝试从对象中获取URL，或者构建一个默认URL
        host = `https://${policy.bucket}.${policy.region}.aliyuncs.com`;
      }
      
      // 确保host是一个有效的URL字符串
      if (!host.startsWith('http')) {
        host = `https://${host}`;
      }
      
      // 2. 准备表单数据
      const formData = new FormData();
      const key = `${policy.key}${file.name.substring(file.name.lastIndexOf('.'))}`;
      
      formData.append('key', key);
      formData.append('OSSAccessKeyId', policy.accessKeyId);
      formData.append('policy', policy.policyBase64);
      formData.append('signature', policy.signature);
      formData.append('success_action_status', '200');
      formData.append('file', file);
      
      console.log('正在上传文件到:', host);
      
      // 3. 上传文件到OSS
      await axios.post(host, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // 4. 返回文件URL
      let cdnHost = policy.cdnHost || host;
      if (typeof cdnHost === 'object') {
        cdnHost = host; // 如果cdnHost也是对象，则使用host
      }
      
      // 确保URL格式正确
      const fileUrl = `${cdnHost}/${key}`;
      console.log('文件上传成功，URL:', fileUrl);
      
      return fileUrl;
    } catch (error) {
      console.error('上传文件到OSS失败:', error);
      throw error;
    }
  },
  
  /**
   * 批量上传文件到阿里云OSS
   * @param {Array<File>} files 要上传的文件对象数组
   * @param {string} dir 上传目录
   * @returns {Promise<Array<string>>} 文件URL数组
   */
  async uploadMultipleFiles(files, dir = 'posts/') {
    if (!files || files.length === 0) {
      return [];
    }
    
    try {
      // 同时获取一次上传策略
      const policyRes = await this.getOSSPolicy(dir);
      const policy = policyRes.policy;
      
      if (!policy) {
        throw new Error('获取上传策略失败');
      }
      
      // 检查并处理host，确保是一个有效的URL字符串
      let host = policy.host;
      if (typeof host === 'object') {
        console.error('Host 是一个对象而不是字符串:', host);
        // 尝试从对象中获取URL，或者构建一个默认URL
        host = `https://${policy.bucket}.${policy.region}.aliyuncs.com`;
      }
      
      // 确保host是一个有效的URL字符串
      if (!host.startsWith('http')) {
        host = `https://${host}`;
      }
      
      console.log('准备批量上传文件到:', host);
      
      // 并行上传所有文件
      const uploadPromises = files.map(async (file, index) => {
        try {
          const formData = new FormData();
          const key = `${policy.key}-${index}${file.name.substring(file.name.lastIndexOf('.'))}`;
          
          formData.append('key', key);
          formData.append('OSSAccessKeyId', policy.accessKeyId);
          formData.append('policy', policy.policyBase64);
          formData.append('signature', policy.signature);
          formData.append('success_action_status', '200');
          formData.append('file', file);
          
          await axios.post(host, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          // 处理返回URL
          let cdnHost = policy.cdnHost || host;
          if (typeof cdnHost === 'object') {
            cdnHost = host; // 如果cdnHost也是对象，则使用host
          }
          
          const fileUrl = `${cdnHost}/${key}`;
          console.log(`文件 ${index+1}/${files.length} 上传成功:`, fileUrl);
          return fileUrl;
        } catch (error) {
          console.error(`文件 ${index+1}/${files.length} 上传失败:`, error);
          throw error;
        }
      });
      
      // 等待所有上传完成
      const fileUrls = await Promise.all(uploadPromises);
      console.log('所有文件上传完成，URL列表:', fileUrls);
      return fileUrls;
    } catch (error) {
      console.error('批量上传文件到OSS失败:', error);
      throw error;
    }
  }
};

export default ossApi; 