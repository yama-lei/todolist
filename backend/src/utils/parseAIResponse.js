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
  // 根据任务完成情况生成不同的评价
  let overview = '';
  let achievements = '';
  let suggestions = '';
  let nextSteps = '';
  
  // 总体评价
  if (data.completedTasksCount === 0 && data.pendingTasksCount === 0) {
    overview = '暂无任务数据，开始添加任务来跟踪你的进度吧！';
  } else if (data.completionRate >= 70) {
    overview = `太棒了！你已完成${data.completedTasksCount}个任务，完成率达到${data.completionRate}%，继续保持这样的效率！`;
  } else if (data.completionRate >= 40) {
    overview = `你已完成${data.completedTasksCount}个任务，还有${data.pendingTasksCount}个待完成，完成率为${data.completionRate}%，保持稳定的进度。`;
  } else {
    overview = `你已完成${data.completedTasksCount}个任务，还有${data.pendingTasksCount}个待完成，完成率为${data.completionRate}%，可以尝试提高效率。`;
  }
  
  // 成就和进步
  if (data.completedTasksCount > 0) {
    achievements = `你已经完成了${data.completedTasksCount}个任务，每完成一个任务都是一次进步！${data.mainPlantName}为你感到骄傲。`;
  } else {
    achievements = `开始你的第一个任务吧！${data.mainPlantName}正在期待你的成长。`;
  }
  
  // 改进建议
  if (data.importantPendingCount > 0) {
    suggestions = `还有${data.importantPendingCount}个重要任务待完成，建议优先处理这些重要任务。可以尝试将大任务拆分为小任务，更容易开始和完成。`;
  } else if (data.pendingTasksCount > 0) {
    suggestions = `尝试给任务设置优先级，这样可以更有效地安排你的时间和精力。将任务分类可以帮助你更清晰地规划工作。`;
  } else {
    suggestions = `目前没有待办任务，可以规划新的目标和任务，持续进步！`;
  }
  
  // 下一步行动
  if (data.importantPendingCount > 0) {
    nextSteps = `专注于完成最重要的任务，帮助你的植物${data.mainPlantName}成长。`;
  } else if (data.pendingTasksCount > 0) {
    nextSteps = `继续保持良好的任务管理习惯，完成更多任务来帮助你的植物${data.mainPlantName}成长。`;
  } else {
    nextSteps = `设定新的目标，创建新的任务，持续成长！`;
  }
  
  return {
    overview,
    achievements,
    suggestions,
    nextSteps
  };
}

module.exports = { parseAIResponse, generateFallbackAnalysis }; 