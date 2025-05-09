# OSS图片上传服务使用说明

本项目使用阿里云OSS存储用户上传的图片。以下是前端使用说明：

## 前端配置

无需特殊配置，所有OSS凭证都从后端获取。

## 使用方法

1. 导入OSS服务：

```javascript
import ossApi from '@/services/ossApi'
```

2. 单个文件上传：

```javascript
// file是从input或上传组件获取的File对象
try {
  const fileUrl = await ossApi.uploadFile(file, 'posts/')
  console.log('上传成功，图片URL:', fileUrl)
} catch (error) {
  console.error('上传失败:', error)
}
```

3. 批量文件上传：

```javascript
// files是File对象数组
try {
  const fileUrls = await ossApi.uploadMultipleFiles(files, 'posts/')
  console.log('上传成功，图片URL列表:', fileUrls)
} catch (error) {
  console.error('批量上传失败:', error)
}
```

## 在Posts.vue中的实现流程

1. 用户选择图片，调用`handleFileChange`方法，图片被存入`newPost.uploadFiles`数组
2. 用户点击提交按钮，调用`handleSubmit`方法
3. `handleSubmit`方法调用`uploadImages`上传所有图片到OSS
4. 获取上传后的图片URL数组，与帖子数据一起提交到后端
5. 提交成功后清空表单和上传列表

## 注意事项

- 上传前先显示加载提示，上传完成后关闭提示
- 编辑帖子时，已有图片显示在文件列表中，新上传的图片会合并到已有图片中
- 图片被移除时会从文件列表和已上传图片中同时移除
- 使用了元素的`loading`指示器来提供良好的用户体验

## 排错指南

如果上传失败，请检查：

1. 后端`.env`文件是否正确配置了OSS信息
2. 后端是否正确安装了ali-oss依赖
3. 网络是否通畅
4. OSS存储桶是否设置了正确的CORS规则
5. 浏览器控制台是否有相关错误信息 