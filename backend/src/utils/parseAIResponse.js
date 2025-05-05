// 解析AI分析响应，将文本拆分为不同部分
function parseAIResponse(text) {
  if (!text) return {
    overview: '无法获取AI分析',
    achievements: '暂无数据',
    suggestions: '暂无数据',
    nextSteps: '暂无数据'
  };

  // 移除多余的空格和换行，标准化文本
  const normalizedText = text.trim().replace(/\n+/g, '\n');

  // 尝试找到各部分内容
  const result = {
    overview: '',
    achievements: '',
    suggestions: '',
    nextSteps: ''
  };

  // 通过关键标题查找各部分
  const patterns = [
    { key: 'overview', patterns: ['总体评价', '总体分析', '整体评价'] },
    { key: 'achievements', patterns: ['成就和进步', '成就', '进步', '成功之处'] },
    { key: 'suggestions', patterns: ['改进建议', '建议', '提升建议'] },
    { key: 'nextSteps', patterns: ['下一步行动', '下一步计划', '行动计划', '接下来'] }
  ];

  // 尝试常见的分隔格式（使用更宽松的匹配）
  for (const section of patterns) {
    for (const pattern of section.patterns) {
      // 尝试多种可能的分隔方式
      const regexPatterns = [
        new RegExp(`${pattern}[:：]\\s*([^\\n]+)`, 'i'),  // 标题后跟冒号和内容
        new RegExp(`${pattern}[^\\n]*?\\n\\s*([^\\n]+)`, 'i'), // 标题单独一行，内容在下一行
        new RegExp(`${pattern}\\s+([^\\n]+)`, 'i') // 标题直接跟内容
      ];

      for (const regex of regexPatterns) {
        const match = normalizedText.match(regex);
        if (match && match[1] && !result[section.key]) {
          result[section.key] = match[1].trim();
          break;
        }
      }
    }
  }

  // 如果无法通过标题匹配，尝试简单分段
  if (!result.overview && !result.achievements && !result.suggestions && !result.nextSteps) {
    const paragraphs = normalizedText.split('\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length >= 4) {
      result.overview = paragraphs[0];
      result.achievements = paragraphs[1];
      result.suggestions = paragraphs[2];
      result.nextSteps = paragraphs[3];
    } else if (paragraphs.length >= 1) {
      // 至少提取第一段作为概览
      result.overview = paragraphs[0];
      if (paragraphs.length >= 2) result.achievements = paragraphs[1];
      if (paragraphs.length >= 3) result.suggestions = paragraphs[2];
    }
  }

  // 确保所有字段都有值
  if (!result.overview) result.overview = '你正在进步中';
  if (!result.achievements) result.achievements = '继续保持';
  if (!result.suggestions) result.suggestions = '尝试设置和完成更多任务';
  if (!result.nextSteps) result.nextSteps = '专注于最重要的任务';

  return result;
}

// 为API调用失败生成备用分析结果
function generateFallbackAnalysis(data) {
  return {
    overview: `已完成${data.completedTasksCount}个任务，还有${data.pendingTasksCount}个待完成，任务完成率${data.completionRate}%。`,
    achievements: `你已经完成了${data.completedTasksCount}个任务，每完成一个任务都是一次进步！${data.mainPlantName}为你感到骄傲。`,
    suggestions: `还有${data.importantPendingCount}个重要任务待完成，建议优先处理这些重要任务。`,
    nextSteps: `继续保持良好的任务管理习惯，完成更多任务来帮助你的植物${data.mainPlantName}成长。`
  };
}

module.exports = { parseAIResponse, generateFallbackAnalysis }; 