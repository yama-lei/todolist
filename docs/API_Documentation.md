# 前后端接口文档

## 用户认证接口

### 1. 用户注册

```
POST /api/auth/register
```

**请求体:**
```json
{
  "username": "用户名",
  "email": "邮箱",
  "password": "密码"
}
```

**响应:**
```json
{
  "success": true,
  "token": "JWT令牌",
  "user": {
    "id": "用户ID",
    "username": "用户名",
    "email": "邮箱"
  }
}
```

### 2. 用户登录

```
POST /api/auth/login
```

**请求体:**
```json
{
  "email": "邮箱",
  "password": "密码"
}
```

**响应:**
```json
{
  "success": true,
  "token": "JWT令牌",
  "user": {
    "id": "用户ID",
    "username": "用户名",
    "email": "邮箱"
  }
}
```

## 任务相关接口

### 1. 获取用户所有任务

```
GET /api/tasks
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**响应:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "任务ID",
      "title": "任务标题",
      "description": "任务描述",
      "deadline": "截止日期",
      "completed": false,
      "important": true,
      "createdAt": "创建时间"
    }
  ]
}
```

### 2. 创建新任务

```
POST /api/tasks
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求体:**
```json
{
  "title": "任务标题",
  "description": "任务描述",
  "deadline": "截止日期",
  "important": false
}
```

**响应:**
```json
{
  "success": true,
  "task": {
    "id": "任务ID",
    "title": "任务标题",
    "description": "任务描述",
    "deadline": "截止日期",
    "completed": false,
    "important": false,
    "createdAt": "创建时间"
  }
}
```

### 3. 完成任务

```
PUT /api/tasks/:id/complete
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**响应:**
```json
{
  "success": true,
  "task": {
    "id": "任务ID",
    "title": "任务标题",
    "completed": true,
    "completedAt": "完成时间"
  }
}
```

## 系统任务接口

### 1. 获取系统任务

```
GET /api/tasks/system
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**响应:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "系统任务ID",
      "title": "给植物浇水",
      "description": "确保植物有足够的水分",
      "completed": false,
      "frequency": "daily",
      "reward": 10,
      "icon": "💧"
    }
  ]
}
```

### 2. 获取单个系统任务

```
GET /api/tasks/system/:id
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求参数:**
| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 系统任务ID |

**响应:**
```json
{
  "success": true,
  "task": {
    "id": "系统任务ID",
    "title": "给植物浇水",
    "description": "确保植物有足够的水分",
    "frequency": "daily",
    "reward": 10,
    "icon": "💧",
    "category": "植物养护"
  }
}
```

### 3. 创建新的系统任务

```
POST /api/tasks/system
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求体参数说明:**
| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| title | string | 是 | 任务标题 |
| description | string | 是 | 任务描述 |
| frequency | string | 是 | 任务频率，如"daily"或"weekly" |
| reward | number | 是 | 完成任务的奖励点数 |
| icon | string | 否 | 任务图标，默认为"📋" |
| category | string | 否 | 任务分类，默认为"未分类" |

**请求体示例:**
```json
{
  "title": "每日冥想",
  "description": "进行15分钟的冥想练习",
  "frequency": "daily",
  "reward": 12,
  "icon": "🧘",
  "category": "心理健康"
}
```

**响应:**
```json
{
  "success": true,
  "message": "系统任务创建成功",
  "task": {
    "id": "系统任务ID",
    "title": "每日冥想",
    "description": "进行15分钟的冥想练习",
    "frequency": "daily",
    "reward": 12,
    "icon": "🧘",
    "category": "心理健康"
  }
}
```

### 4. 更新系统任务

```
PUT /api/tasks/system/:id
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求参数:**
| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 系统任务ID |

**请求体参数说明:**
| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| title | string | 否 | 任务标题 |
| description | string | 否 | 任务描述 |
| frequency | string | 否 | 任务频率 |
| reward | number | 否 | 奖励点数 |
| icon | string | 否 | 任务图标 |
| category | string | 否 | 任务分类 |

**请求体示例:**
```json
{
  "title": "每日冥想修改版",
  "reward": 15
}
```

**响应:**
```json
{
  "success": true,
  "message": "系统任务更新成功",
  "task": {
    "id": "系统任务ID",
    "title": "每日冥想修改版",
    "description": "进行15分钟的冥想练习",
    "frequency": "daily",
    "reward": 15,
    "icon": "🧘",
    "category": "心理健康"
  }
}
```

### 5. 删除系统任务

```
DELETE /api/tasks/system/:id
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求参数:**
| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 系统任务ID |

**响应:**
```json
{
  "success": true,
  "message": "系统任务删除成功"
}
```

### 6. 重置所有系统任务

```
DELETE /api/tasks/system/reset/all
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**响应:**
```json
{
  "success": true,
  "message": "已清空所有系统任务，删除了 5 条记录",
  "removedCount": 5
}
```

### 7. 完成系统任务

```
PUT /api/tasks/system/:id/complete
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**响应:**
```json
{
  "success": true,
  "task": {
    "id": "系统任务ID",
    "title": "给植物浇水",
    "completed": true
  },
  "rewards": {
    "coins": 10,
    "experience": 5
  }
}
```

## 帖子接口

### 1. 获取所有帖子

```
GET /api/posts
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
```
type=diary (可选，筛选日记或说说)
```

**响应:**
```json
{
  "success": true,
  "posts": [
    {
      "id": "帖子ID",
      "title": "帖子标题",
      "content": "帖子内容",
      "images": ["图片URL"],
      "location": "位置",
      "mood": "心情",
      "weather": "天气",
      "type": "diary",
      "createdAt": "创建时间",
      "likes": 0
    }
  ]
}
```

### 2. 创建新帖子

```
POST /api/posts
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求体:**
```json
{
  "title": "帖子标题",
  "content": "帖子内容",
  "images": ["图片URL"],
  "location": "位置",
  "mood": "心情",
  "weather": "天气",
  "type": "thought"
}
```

**响应:**
```json
{
  "success": true,
  "post": {
    "id": "帖子ID",
    "title": "帖子标题",
    "content": "帖子内容",
    "images": ["图片URL"],
    "location": "位置",
    "mood": "心情",
    "weather": "天气",
    "type": "thought",
    "createdAt": "创建时间",
    "likes": 0
  }
}
```

## 植物接口

### 1. 获取用户所有植物

```
GET /api/plants
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**响应:**
```json
{
  "success": true,
  "plants": [
    {
      "id": "植物ID",
      "name": "小绿",
      "type": "向日葵",
      "emoji": "🌻",
      "level": 3,
      "experience": 120,
      "mood": "happy",
      "state": "growing",
      "growthStage": 2,
      "weather": "sunny",
      "isMainPlant": true,
      "createdAt": "创建时间",
      "lastInteraction": "最后交互时间",
      "traits": ["友好", "活泼"]
    }
  ]
}
```

### 2. 创建新植物

```
POST /api/plants
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求体参数说明:**
| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| name | string | 是 | 植物名称 |
| type | string | 是 | 植物类型，如"向日葵"、"仙人掌"等 |
| emoji | string | 否 | 植物表情符号，默认为"🌱" |
| isMainPlant | boolean | 否 | 是否设为主植物，默认为false。如设为true，则其他植物自动变为非主植物 |

**请求体示例:**
```json
{
  "name": "小绿",
  "type": "向日葵",
  "emoji": "🌻",
  "isMainPlant": true
}
```

**响应:**
```json
{
  "success": true,
  "plant": {
    "id": "植物ID",
    "name": "小绿",
    "type": "向日葵",
    "emoji": "🌻",
    "level": 1,
    "experience": 0,
    "mood": "neutral",
    "state": "seedling",
    "growthStage": 1,
    "weather": "sunny",
    "isMainPlant": true,
    "createdAt": "2023-11-01T08:30:00Z",
    "lastInteraction": "2023-11-01T08:30:00Z",
    "traits": ["友好", "活泼"]
  }
}
```

**响应字段说明:**
| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| id | string | 植物唯一ID |
| name | string | 植物名称 |
| type | string | 植物类型 |
| emoji | string | 植物表情符号 |
| level | number | 植物等级，初始为1 |
| experience | number | 植物经验值，初始为0 |
| mood | string | 植物心情状态，初始为"neutral" |
| state | string | 植物生长状态，对应growthStage：seedling(幼苗)、growing(成长中)、mature(成熟) |
| growthStage | number | 生长阶段(1-3)，对应1=幼苗期、2=成长期、3=成熟期 |
| weather | string | 关联天气，默认为"sunny" |
| isMainPlant | boolean | 是否为主植物 |
| createdAt | string | 创建时间 |
| lastInteraction | string | 最后交互时间 |
| traits | array | 植物特性数组 |

### 3. 获取植物详情

```
GET /api/plants/:id
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求参数:**
| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 植物ID |

**响应:**
```json
{
  "success": true,
  "plant": {
    "id": "植物ID",
    "name": "小绿",
    "type": "向日葵",
    "emoji": "🌻",
    "level": 3,
    "experience": 120,
    "mood": "happy",
    "state": "growing",
    "growthStage": 2,
    "weather": "sunny",
    "isMainPlant": true,
    "createdAt": "2023-11-01T08:30:00Z",
    "lastInteraction": "2023-11-05T10:15:00Z",
    "traits": ["友好", "活泼"]
  }
}
```

### 4. 更新植物信息

```
PUT /api/plants/:id
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求参数:**
| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 植物ID |

**请求体参数说明:**
| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| name | string | 否 | 新的植物名称 |
| emoji | string | 否 | 新的表情符号 |
| isMainPlant | boolean | 否 | 是否设为主植物 |

**请求体示例:**
```json
{
  "name": "新植物名称",
  "emoji": "🌵",
  "isMainPlant": true
}
```

**响应:**
```json
{
  "success": true,
  "plant": {
    "id": "植物ID",
    "name": "新植物名称",
    "type": "向日葵",
    "emoji": "🌵",
    "level": 3,
    "experience": 120,
    "mood": "happy",
    "state": "growing",
    "growthStage": 2,
    "weather": "sunny",
    "isMainPlant": true,
    "createdAt": "2023-11-01T08:30:00Z",
    "lastInteraction": "2023-11-06T15:20:00Z",
    "traits": ["友好", "活泼"]
  },
  "message": "植物信息更新成功"
}
```

### 5. 删除植物

```
DELETE /api/plants/:id
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求参数:**
| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 植物ID |

**响应:**
```json
{
  "success": true,
  "message": "植物已成功删除"
}
```

**错误响应:**
```json
{
  "success": false,
  "message": "不能删除主植物，请先设置其他植物为主植物"
}
```

### 6. 增加植物经验

```
PUT /api/plants/:id/experience
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求参数:**
| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 植物ID |

**请求体参数说明:**
| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| amount | number | 是 | 要增加的经验值，必须为正数 |

**请求体示例:**
```json
{
  "amount": 25
}
```

**响应:**
```json
{
  "success": true,
  "plant": {
    "id": "植物ID",
    "name": "小绿",
    "level": 3,
    "experience": 145,
    "state": "growing",
    "growthStage": 2
  },
  "levelUp": false,
  "stageChange": false
}
```

**响应字段说明:**
| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| levelUp | boolean | 是否升级 |
| stageChange | boolean | 是否生长阶段改变 |

**升级和生长阶段判断规则:**
- 每积累100点经验值，植物升级1级（例如：从2级到3级需要200点经验）
- 生长阶段规则：
  - 1级-3级：幼苗期（seedling）
  - 4级-7级：成长期（growing）
  - 8级及以上：成熟期（mature）

### 7. 更新植物生长阶段

```
PUT /api/plants/:id/growth-stage
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求参数:**
| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 植物ID |

**请求体参数说明:**
| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| stage | number | 是 | 植物生长阶段(1-3)，1=幼苗期，2=成长期，3=成熟期 |

**请求体示例:**
```json
{
  "stage": 3
}
```

**响应:**
```json
{
  "success": true,
  "plant": {
    "id": "植物ID",
    "name": "小绿",
    "type": "向日葵", 
    "emoji": "🌻",
    "level": 5,
    "experience": 145,
    "mood": "happy",
    "state": "mature",
    "growthStage": 3,
    "weather": "sunny",
    "isMainPlant": true,
    "createdAt": "2023-11-01T08:30:00Z",
    "lastInteraction": "2023-11-06T16:45:00Z",
    "traits": ["友好", "活泼"]
  },
  "message": "植物生长阶段已更新为3（mature）"
}
```

**生长阶段对应状态:**
| 生长阶段(stage) | 状态(state) | 描述 |
| --------------- | ----------- | ---- |
| 1 | seedling | 幼苗期 |
| 2 | growing | 成长期 |
| 3 | mature | 成熟期 |

## 植物心声接口

### 1. 获取植物心声历史记录

```
GET /api/plants/:id/thoughts
```

**请求头:**

```
Authorization: Bearer JWT令牌
```

**请求参数:**

| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 植物ID |

**响应:**
```json
{
  "success": true,
  "thoughts": [
    {
      "id": "心声ID",
      "content": "今天的阳光真好，感觉精力充沛！",
      "type": "weather",
      "icon": "☀️",
      "tag": "天气感知",
      "timestamp": "2023-10-15T10:00:00Z",
      "context": {
        "weather": "sunny",
        "timeOfDay": "morning",
        "recentTasks": []
      }
    }
  ]
}
```

**心声类型说明:**
| 类型(type) | 描述 |
| ---------- | ---- |
| weather | 与天气相关的心声 |
| motivation | 鼓励性心声 |
| reflection | 反思性心声 |

### 2. 生成新的植物心声 

```
POST /api/plants/:id/thoughts
```

**请求头:**

```
Authorization: Bearer JWT令牌
```

**请求参数:**

| 参数名 | 位置 | 描述 |
| ------ | ---- | ---- |
| id | 路径 | 植物ID |

**请求体参数说明:**
| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| context | object | 是 | 生成心声的上下文信息 |
| context.recentTasks | array | 否 | 最近的任务列表，用于生成与任务相关的心声 |
| context.weather | string | 否 | 当前天气，如"sunny"、"rainy"等，默认为"sunny" |
| context.timeOfDay | string | 否 | 一天中的时间段，如"morning"、"afternoon"、"evening"，默认为"morning" |

**请求体示例:**
```json
{
  "context": {
    "recentTasks": [
      {
        "id": "任务ID1",
        "title": "完成项目报告",
        "completed": true
      },
      {
        "id": "任务ID2",
        "title": "整理工作空间",
        "completed": false
      }
    ],
    "weather": "rainy",
    "timeOfDay": "afternoon"
  }
}
```

**响应:**
```json
{
  "success": true,
  "thought": {
    "id": "心声ID",
    "content": "下午好！今天雨天，记得给我浇水哦。看到你完成了项目报告，真为你高兴！",
    "type": "motivation",
    "icon": "🌧️",
    "tag": "天气感知",
    "timestamp": "2023-11-06T14:30:00Z",
    "context": {
      "weather": "rainy",
      "timeOfDay": "afternoon",
      "recentTasks": [
        {
          "id": "任务ID1",
          "title": "完成项目报告",
          "completed": true
        },
        {
          "id": "任务ID2", 
          "title": "整理工作空间",
          "completed": false
        }
      ]
    }
  }
}
```

## 植物对话接口

### 1. 获取与植物的对话历史

```
GET /api/plants/:id/conversations
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
```
limit=20 (可选)
before=2023-10-15T00:00:00Z (可选)
```

**响应:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "消息ID",
      "sender": "user",
      "content": "今天天气怎么样？",
      "timestamp": "2023-10-15T14:30:00Z"
    },
    {
      "id": "消息ID",
      "sender": "plant",
      "content": "今天的天气是晴朗，阳光充足！",
      "timestamp": "2023-10-15T14:30:10Z"
    }
  ],
  "hasMore": false
}
```

### 2. 发送消息给植物并获取回复

```
POST /api/plants/:id/conversations
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求体:**
```json
{
  "message": "你能告诉我怎样照顾植物吗？",
  "context": {
    "recentMessages": 5,
    "userInfo": {
      "completedTasks": 10,
      "pendingTasks": 3
    }
  }
}
```

**响应:**
```json
{
  "success": true,
  "response": {
    "id": "消息ID",
    "sender": "plant",
    "content": "照顾植物需要适当的阳光、水分和肥料。看到你已经完成了10个任务，你的勤劳精神正适合照顾植物呢！",
    "timestamp": "2023-10-16T09:15:30Z"
  }
}
```

## 智能活动管理接口

### 1. 智能规划活动并创建任务

```
POST /api/activities/plan
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求体:**
```json
{
  "description": "我需要准备下周一的演讲，主题是植物养护，地点在会议中心",
  "userPreferences": {
    "preferredWorkingHours": ["09:00-12:00", "14:00-18:00"],
    "priorityLevel": "high"
  }
}
```

**响应:**
```json
{
  "success": true,
  "analysis": {
    "eventType": "演讲",
    "topic": "植物养护",
    "venue": "会议中心",
    "date": "2023-10-23"
  },
  "plan": {
    "activity": {
      "id": "活动ID",
      "title": "植物养护演讲",
      "location": "会议中心",
      "startTime": "2023-10-23T10:00:00Z",
      "endTime": "2023-10-23T11:00:00Z"
    },
    "tasks": [
      {
        "id": "任务ID",
        "title": "准备植物养护演讲PPT",
        "deadline": "2023-10-22T18:00:00Z",
        "important": true
      }
    ]
  }
}
```

## 智能总结接口

### 1. 获取任务完成情况总结

```
GET /api/insights/tasks
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
```
period=week (可选，默认为"week")
```

**响应:**
```json
{
  "success": true,
  "period": "week",
  "summary": {
    "completedTasks": 12,
    "pendingTasks": 5,
    "completionRate": 70.6,
    "averageCompletionTime": "1.5天",
    "mostProductiveDay": "周三"
  },
  "insights": [
    "你本周完成了12个任务，比上周提高了20%。",
    "上午是你最高效的时段，建议安排重要任务在上午处理。"
  ],
  "recommendations": [
    {
      "type": "timeManagement",
      "content": "将复杂任务安排在上午10点到12点之间，这是你效率最高的时段。"
    }
  ]
}
```

### 2. 获取每周总结

```
GET /api/insights/weekly
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
```
date=2023-10-15 (可选，指定周的结束日期)
```

**响应:**
```json
{
  "success": true,
  "weekRange": "2023-10-09 至 2023-10-15",
  "productivityScore": 85,
  "achievements": {
    "tasksCompleted": 15,
    "activitiesAttended": 3,
    "plantExperienceGained": 120
  },
  "insights": [
    "你的工作效率比上周提高了15%。",
    "你在植物养护方面投入了更多时间，植物的成长速度加快了。"
  ],
  "nextWeekPlan": {
    "suggestedFocus": "准备下周一的演讲",
    "upcomingDeadlines": [
      {
        "id": "任务ID",
        "title": "提交季度报告",
        "deadline": "2023-10-20T18:00:00Z"
      }
    ]
  }
}
```

## 日历系统接口

### 1. 获取月度日历数据

```
GET /api/calendar/monthly
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
```
year=2023
month=10
```

**响应:**
```json
{
  "success": true,
  "year": 2023,
  "month": 10,
  "days": [
    {
      "date": "2023-10-01",
      "tasks": [
        {
          "id": "任务ID",
          "title": "项目讨论会",
          "deadline": "2023-10-01T14:00:00Z",
          "completed": false,
          "important": true
        }
      ],
      "posts": [
        {
          "id": "帖子ID",
          "title": "今天去公园",
          "type": "thought",
          "mood": "happy",
          "createdAt": "2023-10-01T20:30:00Z"
        }
      ],
      "taskCount": {
        "total": 3,
        "completed": 1,
        "pending": 2
      }
    }
  ]
}
```

### 2. 获取日详情

```
GET /api/calendar/day
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
```
date=2023-10-15
```

**响应:**
```json
{
  "success": true,
  "date": "2023-10-15",
  "dayOfWeek": "星期日",
  "tasks": [
    {
      "id": "任务ID",
      "title": "完成项目演示",
      "description": "为团队准备项目演示PPT",
      "deadline": "2023-10-15T17:00:00Z",
      "completed": true,
      "completedAt": "2023-10-15T16:30:00Z",
      "important": true
    }
  ],
  "systemTasks": [
    {
      "id": "系统任务ID",
      "title": "每日植物浇水",
      "completed": true,
      "completedAt": "2023-10-15T08:30:00Z"
    }
  ],
  "posts": [
    {
      "id": "帖子ID",
      "title": "周末小记",
      "content": "今天完成了一个重要项目，心情很好！",
      "images": ["图片URL"],
      "type": "diary",
      "mood": "excited",
      "weather": "sunny",
      "createdAt": "2023-10-15T20:00:00Z"
    }
  ],
  "plantThoughts": [
    {
      "id": "心声ID",
      "content": "看到你今天完成了项目演示，真为你高兴！继续保持！",
      "icon": "🌻",
      "timestamp": "2023-10-15T19:30:00Z"
    }
  ],
  "statistics": {
    "completionRate": 100,
    "totalTasks": 1,
    "completedTasks": 1
  }
}
```

### 3. 获取日历视图统计数据

```
GET /api/calendar/statistics
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
```
year=2023
month=10
```

**响应:**
```json
{
  "success": true,
  "period": {
    "year": 2023,
    "month": 10
  },
  "statistics": {
    "totalTasks": 45,
    "completedTasks": 32,
    "completionRate": 71.1,
    "totalPosts": 15,
    "postsByType": {
      "diary": 8,
      "thought": 7
    },
    "busyDays": ["2023-10-10", "2023-10-15", "2023-10-22"],
    "freeDays": ["2023-10-05", "2023-10-06"]
  },
  "taskDistribution": {
    "byWeekday": {
      "monday": 8,
      "tuesday": 7,
      "wednesday": 10,
      "thursday": 9,
      "friday": 8,
      "saturday": 2,
      "sunday": 1
    },
    "byImportance": {
      "important": 20,
      "normal": 25
    }
  }
}
```