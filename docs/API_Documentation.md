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

### 2. 完成系统任务

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
      "weather": "sunny",
      "isMainPlant": true,
      "createdAt": "创建时间"
    }
  ]
}
```

### 2. 增加植物经验

```
PUT /api/plants/:id/experience
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求体:**
```json
{
  "amount": 20
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
    "experience": 140,
    "state": "growing"
  },
  "levelUp": false
}
```

## 植物心声接口

### 1. 获取植物心声历史记录

```
GET /api/plants/:id/thoughts
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

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
      "tag": "天气",
      "timestamp": "2023-10-15T10:00:00Z"
    }
  ]
}
```

### 2. 生成新的植物心声

```
POST /api/plants/:id/thoughts
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**请求体:**
```json
{
  "context": {
    "recentTasks": [
      {
        "id": "任务ID",
        "title": "完成项目报告",
        "completed": true
      }
    ],
    "weather": "sunny",
    "timeOfDay": "morning"
  }
}
```

**响应:**
```json
{
  "success": true,
  "thought": {
    "id": "心声ID",
    "content": "早上好！今天阳光明媚，看到你完成了项目报告，真为你高兴！",
    "type": "motivation",
    "icon": "🌞",
    "tag": "早安问候",
    "timestamp": "2023-10-16T08:30:00Z"
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