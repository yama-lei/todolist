import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePlantStore } from './plant'
import { postApi } from '../services/api'
import { ElMessage } from 'element-plus'

export const usePostStore = defineStore('post', () => {
  // 所有帖子数据
  const posts = ref([])
  const loading = ref(false)

  // 获取所有帖子
  const fetchPosts = async (type = 'all') => {
    loading.value = true
    try {
      const response = await postApi.getPosts(type)
      posts.value = response.posts
      return response.posts
    } catch (error) {
      console.error('获取帖子失败:', error)
      ElMessage.error('获取帖子列表失败')
      return []
    } finally {
      loading.value = false
    }
  }

  // 添加自定义帖子（支持日记和说说）
  const addCustomPost = async (postData) => {
    try {
      // 确保有创建时间字段，如果已经有就用原来的，没有则设置为当前时间
      const dataToSubmit = {
        ...postData,
        createdAt: postData.createdAt || new Date().toISOString()
      };
      console.log('准备提交到后端的帖子数据:', dataToSubmit);
      
      const response = await postApi.createPost(dataToSubmit);
      await fetchPosts();
      return true;
    } catch (error) {
      console.error('发布失败:', error);
      ElMessage.error('发布失败，请稍后再试');
      return false;
    }
  }
  
  // 兼容旧的添加说说方法
  const addPost = async (content, images = [], location = '') => {
    return await addCustomPost({
      content,
      images,
      location,
      type: 'thought'
    })
  }
  
  // 删除帖子
  const removePost = async (id) => {
    loading.value = true
    try {
      await postApi.deletePost(id)
      // 更新本地状态
      posts.value = posts.value.filter(post => post._id !== id)
      ElMessage.success('删除成功')
      return true
    } catch (error) {
      console.error('删除帖子失败:', error)
      ElMessage.error('删除失败，请稍后再试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  // 更新帖子
  const updatePost = async (id, postData) => {
    try {
      // 确保保留原始创建时间
      const dataToSubmit = {
        ...postData,
        // 如果提供了创建时间就使用它，否则使用当前时间
        createdAt: postData.createdAt || new Date().toISOString()
      };
      console.log('更新帖子数据:', dataToSubmit);
      
      const response = await postApi.updatePost(id, dataToSubmit);
      await fetchPosts();
      ElMessage.success('更新成功');
      return true;
    } catch (error) {
      console.error('更新失败:', error);
      ElMessage.error('更新失败，请稍后再试');
      return false;
    }
  }
  
  // 初始化时加载帖子
  const init = () => {
    fetchPosts()
  }
  
  // 自动初始化
  init()
  
  return {
    posts,
    loading,
    fetchPosts,
    addPost,
    addCustomPost,
    removePost,
    updatePost
  }
}) 