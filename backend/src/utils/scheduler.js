const cron = require('node-cron');
const axios = require('axios');
const { Users } = require('./localDB');

// 每天凌晨1点执行自动情绪评分
const scheduleAutoMoodUpdate = () => {
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('开始执行每日自动情绪评分...');
      
      // 获取所有用户
      const users = await Users.find({});
      
      // 为每个用户更新情绪分数
      for (const user of users) {
        try {
          // 调用自动情绪评分API
          await axios.post('http://115.175.12.31/plantodo/api/auto-mood/update', {}, {
            headers: {
              'Authorization': `Bearer ${user.token}` // 假设用户对象中有token字段
            }
          });
          
          console.log(`用户 ${user.username} 的情绪分数已更新`);
        } catch (error) {
          console.error(`更新用户 ${user.username} 的情绪分数失败:`, error.message);
        }
      }
      
      console.log('每日自动情绪评分完成');
    } catch (error) {
      console.error('执行自动情绪评分任务失败:', error);
    }
  });
};

module.exports = {
  scheduleAutoMoodUpdate
}; 