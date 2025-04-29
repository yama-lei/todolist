import { createRouter, createWebHistory } from 'vue-router'
import Calendar from '../components/Calendar.vue'

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
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 