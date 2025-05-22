import api from './api';

export default {
  // AI分析调用，特殊设置更长的超时时间
  getAIAnalysis() {
    return api.get('/insights/ai-analysis', { timeout: 40000 });
  },
} 