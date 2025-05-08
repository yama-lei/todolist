# TodoList API 文档

## 目录
1. [认证接口](#认证接口)
2. [任务管理](#任务管理)
3. [系统任务](#系统任务)
4. [植物管理](#植物管理)
5. [日历功能](#日历功能)
6. [数据洞察](#数据洞察)
7. [社区功能](#社区功能)

## 认证接口

### 用户注册
```http
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

**错误响应:**
```json
{
  "success": false,
  "error": "错误信息"
}
```

### 用户登录
```http
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

## 任务管理

### 获取任务列表
```http
GET /api/tasks
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| status | string | 否 | 任务状态：all/active/completed |
| sort | string | 否 | 排序方式：createdAt/deadline/priority |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |

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
      "createdAt": "创建时间",
      "completedAt": "完成时间"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### 创建任务
```http
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
  "important": false,
  "tags": ["标签1", "标签2"]
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
    "tags": ["标签1", "标签2"],
    "createdAt": "创建时间"
  }
}
```

### 更新任务
```http
PUT /api/tasks/:id
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**路径参数:**
| 参数名 | 类型 | 描述 |
|--------|------|------|
| id | string | 任务ID |

**请求体:**
```json
{
  "title": "新标题",
  "description": "新描述",
  "deadline": "新截止日期",
  "important": true,
  "tags": ["新标签"]
}
```

### 删除任务
```http
DELETE /api/tasks/:id
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**路径参数:**
| 参数名 | 类型 | 描述 |
|--------|------|------|
| id | string | 任务ID |

## 系统任务

### 获取系统任务列表
```http
GET /api/tasks/system
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| category | string | 否 | 任务分类 |
| frequency | string | 否 | 任务频率：daily/weekly/monthly |

**响应:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "系统任务ID",
      "title": "任务标题",
      "description": "任务描述",
      "frequency": "daily",
      "reward": 10,
      "icon": "💧",
      "category": "分类名称"
    }
  ]
}
```

## 植物管理

### 获取植物列表
```http
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
      "name": "植物名称",
      "type": "植物类型",
      "health": 100,
      "growth": 50,
      "lastWatered": "上次浇水时间",
      "nextWatering": "下次浇水时间"
    }
  ]
}
```

### 浇水
```http
POST /api/plants/:id/water
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**路径参数:**
| 参数名 | 类型 | 描述 |
|--------|------|------|
| id | string | 植物ID |

## 日历功能

### 获取日历事件
```http
GET /api/calendar/events
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| start | string | 是 | 开始日期 |
| end | string | 是 | 结束日期 |

**响应:**
```json
{
  "success": true,
  "events": [
    {
      "id": "事件ID",
      "title": "事件标题",
      "start": "开始时间",
      "end": "结束时间",
      "type": "事件类型"
    }
  ]
}
```

## 数据洞察

### 获取任务统计
```http
GET /api/insights/tasks
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| period | string | 否 | 统计周期：week/month/year |

**响应:**
```json
{
  "success": true,
  "stats": {
    "total": 100,
    "completed": 80,
    "completionRate": 0.8,
    "averageCompletionTime": "2小时",
    "mostProductiveDay": "周一"
  }
}
```

## 社区功能

### 获取帖子列表
```http
GET /api/posts
```

**请求头:**
```
Authorization: Bearer JWT令牌
```

**查询参数:**
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| sort | string | 否 | 排序方式：latest/popular |

**响应:**
```json
{
  "success": true,
  "posts": [
    {
      "id": "帖子ID",
      "title": "帖子标题",
      "content": "帖子内容",
      "author": {
        "id": "作者ID",
        "username": "作者名"
      },
      "likes": 10,
      "comments": 5,
      "createdAt": "创建时间"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "错误代码",
    "message": "错误信息"
  }
}
```

## 错误代码说明

| 错误代码 | 描述 |
|----------|------|
| AUTH_001 | 未授权访问 |
| AUTH_002 | 令牌过期 |
| VALID_001 | 参数验证失败 |
| NOT_FOUND | 资源不存在 |
| SERVER_ERR | 服务器内部错误 |