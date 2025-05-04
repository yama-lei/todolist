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
    loading.value = true
    try {
      const response = await postApi.createPost({
        title: postData.title || '',
        content: postData.content,
        images: postData.images || [],
        location: postData.location || '',
        mood: postData.mood || 'neutral',
        weather: postData.weather || 'sunny',
        type: postData.type || 'thought' // 'thought' 或 'diary'
      })
      
      // 添加到本地状态
      posts.value.unshift(response.post)
      
      // 同时给植物添加经验
      const plantStore = usePlantStore()
      if (plantStore.currentPlant) {
        const plantId = plantStore.currentPlant._id || plantStore.currentPlant.id
        if (plantId) {
          await plantStore.gainExperience(plantId, 10)
        }
      }
      
      ElMessage.success(`${postData.type === 'diary' ? '日记' : '说说'}发布成功`)
      return response.post
    } catch (error) {
      console.error('发布失败:', error)
      ElMessage.error('发布失败，请稍后再试')
      return null
    } finally {
      loading.value = false
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
  
  // 点赞帖子
  const likePost = async (id) => {
    try {
      const response = await postApi.likePost(id)
      // 更新本地状态
      const post = posts.value.find(post => post._id === id)
      if (post) {
        post.likes = response.likes
      }
      return response.likes
    } catch (error) {
      console.error('点赞失败:', error)
      ElMessage.error('点赞失败')
      return null
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
    likePost
  }
}) 