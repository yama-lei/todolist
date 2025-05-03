# Plantodo 后端

Plantodo项目的后端服务，提供API接口和数据存储功能。

## 特性

- 简单的数据存储方案，使用NeDB作为本地数据库
- 完整的API接口，支持前端和Electron桌面应用
- 支持用户认证和数据安全
- 支持任务系统、植物养成、说说日记等功能
- 良好的可扩展性，方便添加新功能

## 技术栈

- Node.js & Express.js：API服务框架
- nedb-promises：轻量级JavaScript数据库，支持最新版Node.js
- JWT：用户认证
- bcryptjs：密码加密（纯JavaScript实现）

## 运行方式

### 开发环境

1. 安装依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm run dev
```

### 生产环境

```bash
npm start
```

## 数据存储

系统使用NeDB作为默认存储方式，数据文件保存在`/data`目录下：

- `users.db`：用户数据
- `tasks.db`：用户任务
- `plants.db`：植物数据
- `plant_thoughts.db`：植物心声
- `conversations.db`：对话记录
- `posts.db`：帖子和日记
- `system_tasks.db`：系统任务
- `user_system_tasks.db`：用户完成的系统任务

## API接口

详细API接口文档请查看：[API文档](../docs/API_Documentation.md)

主要接口包括：

### 用户认证
- 用户注册 `POST /api/auth/register`
- 用户登录 `POST /api/auth/login`

### 任务管理
- 获取所有任务 `GET /api/tasks`
- 创建任务 `POST /api/tasks`
- 完成任务 `PUT /api/tasks/:id/complete`

### 植物系统
- 获取植物 `GET /api/plants`
- 创建植物 `POST /api/plants`
- 获取植物心声 `GET /api/plants/:id/thoughts`
- 植物对话 `POST /api/plants/:id/conversations`

### 帖子和日记
- 获取所有帖子 `GET /api/posts`
- 创建新帖子 `POST /api/posts`

### 日历和统计
- 获取日历数据 `GET /api/calendar/monthly`
- 获取统计信息 `GET /api/insights/tasks`
- 获取周报 `GET /api/insights/weekly`

## 本地与远程存储同步

本项目同时支持本地存储和远程服务器存储，数据同步策略为：

1. 默认使用本地NeDB存储所有数据，完全不需要数据库安装
2. 在有网络连接时，可以将数据同步到远程服务器
3. 支持冲突解决策略，确保数据一致性

## 贡献

欢迎提交Pull Request或Issues来改进本项目。

## 协议

MIT 