import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/plant-voice',
    name: 'PlantVoice',
    component: () => import('../views/PlantVoice.vue')
  },
  {
    path: '/posts',
    name: 'Posts',
    component: () => import('../views/Posts.vue')
  },
  {
    path: '/garden',
    name: 'Garden',
    component: () => import('../views/Garden.vue')
  },
  {
    path: '/plant-chat',
    name: 'PlantChat',
    component: () => import('@/views/PlantChat.vue'),
    meta: {
      title: '植物聊天'
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 