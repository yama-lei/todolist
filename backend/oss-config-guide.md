# OSS配置修复指南

您的图片已经成功上传，但URL显示为默认的占位符 "https://your-cdn-host.com"。要修复这个问题，您需要正确配置OSS环境变量。

## 步骤1: 创建或编辑.env文件

在后端项目根目录(backend文件夹)创建一个名为 `.env` 的文件，并添加以下内容：

```
# 阿里云OSS配置
OSS_ACCESS_KEY_ID=您的阿里云AccessKeyID
OSS_ACCESS_KEY_SECRET=您的阿里云AccessKeySecret
OSS_REGION=oss-cn-hangzhou  # 替换为您的存储桶所在区域
OSS_BUCKET=您的存储桶名称  # 替换为您的存储桶名称
# OSS_CDN_HOST=https://您的CDN域名  # 如果有CDN，取消注释并设置
```

## 步骤2: 重启后端服务

配置完环境变量后，重启后端服务使配置生效：

```bash
cd backend
npm run dev  # 或者您用于启动后端的命令
```

## 步骤3: 测试上传

再次尝试上传图片，现在应该会生成正确的阿里云OSS URL，形如：
`https://your-bucket-name.oss-cn-hangzhou.aliyuncs.com/posts/1234567890-abcdef.jpg`

## 常见问题

1. **如何获取AccessKey？**
   登录阿里云控制台 -> 右上角头像 -> AccessKey管理 -> 创建AccessKey

2. **为什么不显示我的图片？**
   检查OSS存储桶权限是否已设置为公共读取。在OSS控制台中进入存储桶 -> 权限管理 -> 读写权限 -> 设置为"公共读"

3. **如何查看我的OSS地区？**
   在OSS控制台 -> 存储桶列表 -> 地域一列可以看到，如"华东1(杭州)"，对应的区域值是"oss-cn-hangzhou"

4. **不同区域对应的值：**
   - 华东1(杭州): oss-cn-hangzhou
   - 华东2(上海): oss-cn-shanghai
   - 华北1(青岛): oss-cn-qingdao
   - 华北2(北京): oss-cn-beijing
   - 华南1(深圳): oss-cn-shenzhen
   - 更多区域请参考阿里云文档

5. **如何处理跨域问题？**
   确保在OSS控制台中设置了跨域规则：存储桶 -> 权限管理 -> 跨域设置 -> 添加规则，设置来源为"*"(或您的应用域名)，允许的方法为"GET, POST, PUT, DELETE, HEAD" 