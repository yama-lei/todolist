import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { usePlantStore } from './plant'

export const usePostStore = defineStore('post', () => {
  // 所有帖子数据
  const posts = ref([])

  // 添加自定义帖子（支持日记和说说）
  const addCustomPost = (postData) => {
    const now = new Date()
    
    const newPost = {
      id: uuidv4(),
      title: postData.title || '',
      content: postData.content,
      images: postData.images || [],
      location: postData.location || '',
      mood: postData.mood || '',
      weather: postData.weather || '',
      type: postData.type || 'thought', // 'thought' 或 'diary'
      date: now.toISOString(),
      likes: 0,
    }
    
    posts.value.unshift(newPost)
    
    // 保存到本地存储
    savePostsToLocalStorage()
    
    // 同时给植物添加经验
    const plantStore = usePlantStore()
    plantStore.gainExperience(10)
    
    return newPost
  }
  
  // 兼容旧的添加说说方法
  const addPost = (content, images = [], location = '') => {
    return addCustomPost({
      content,
      images,
      location,
      type: 'thought'
    })
  }
  
  // 删除帖子
  const removePost = (id) => {
    const index = posts.value.findIndex(post => post.id === id)
    if (index !== -1) {
      posts.value.splice(index, 1)
      savePostsToLocalStorage()
    }
  }
  
  // 点赞帖子
  const likePost = (id) => {
    const post = posts.value.find(post => post.id === id)
    if (post) {
      post.likes++
      savePostsToLocalStorage()
    }
  }
  
  // 将帖子保存到本地存储
  const savePostsToLocalStorage = () => {
    localStorage.setItem('posts', JSON.stringify(posts.value))
  }
  
  // 从本地存储加载帖子
  const loadPostsFromLocalStorage = () => {
    const savedPosts = localStorage.getItem('posts')
    if (savedPosts) {
      posts.value = JSON.parse(savedPosts)
    } else {
      // 示例数据
      posts.value = [
        {
          id: uuidv4(),
          title: '我的第一篇日记',
          content: '今天开始使用这个ToDo应用，感觉很棒！希望能够持续记录生活的点滴。',
          images: [],
          location: '家里',
          mood: 'happy',
          weather: 'sunny',
          type: 'diary',
          date: new Date(Date.now() - 86400000).toISOString(), // 昨天
          likes: 3
        },
        {
          id: uuidv4(),
          content: '刚刚完成了一个重要的任务，心情舒畅！',
          images: [],
          location: '办公室',
          mood: 'happy',
          type: 'thought',
          date: new Date().toISOString(),
          likes: 5
        }
      ]
      savePostsToLocalStorage()
    }
  }
  
  // 初始化加载
  loadPostsFromLocalStorage()
  
  return {
    posts,
    addPost,
    addCustomPost,
    removePost,
    likePost
  }
}) 