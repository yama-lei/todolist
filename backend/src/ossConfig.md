# 阿里云OSS图片上传配置说明

本项目支持使用阿里云OSS存储图片。以下是配置步骤：

## 步骤1: 阿里云OSS准备工作

1. 注册阿里云账号并实名认证
2. 开通OSS服务并创建存储桶(Bucket)
3. 创建RAM子账号并获取AccessKey和AccessKeySecret
4. 为RAM账号分配OSS操作权限

## 步骤2: 项目配置

在项目根目录创建`.env`文件，添加以下配置：

```bash
# 阿里云OSS配置
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_REGION=oss-cn-hangzhou  # 替换为您的OSS存储桶所在区域
OSS_BUCKET=your-bucket-name  # 替换为您的存储桶名称
OSS_CDN_HOST=https://your-cdn-host.com  # 如果使用了CDN，则填写CDN域名
```

## 步骤3: 安装依赖

确保已安装ali-oss依赖：

```bash
npm install ali-oss
```

## 步骤4: 跨域设置

在阿里云OSS控制台中，为您的存储桶设置跨域规则：

1. 进入存储桶 -> 权限管理 -> 跨域设置
2. 添加规则：
   - 来源: 您的前端域名（开发时可设置为 * ）
   - 允许Methods: GET, POST, PUT, DELETE, HEAD
   - 允许Headers: *
   - 暴露Headers: ETag, Content-Length
   - 缓存时间: 86400秒

## 注意事项

- 出于安全考虑，请不要将AccessKey和Secret直接硬编码在源代码中
- 生产环境建议使用STS临时授权或OSS Policy签名进行访问控制
- 确保OSS存储桶的读写权限设置合理，避免安全风险

## 相关API介绍

本项目已实现以下OSS相关API：

- `GET /api/oss/config`: 获取OSS配置信息（包括临时凭证）
- `GET /api/oss/policy`: 获取OSS上传策略，用于前端直传

前端已集成此功能，可以在发布帖子时上传图片。 