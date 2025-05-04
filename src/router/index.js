import { createRouter, createWebHistory } from 'vue-router'
import Calendar from '../components/Calendar.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/plant-voice',
    name: 'PlantVoice',
    component: () => import('../views/PlantVoice.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/posts',
    name: 'Posts',
    component: () => import('../views/Posts.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/garden',
    name: 'Garden',
    component: () => import('../views/Garden.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/plant-chat',
    name: 'PlantChat',
    component: () => import('@/views/PlantChat.vue'),
    meta: {
      title: '植物聊天',
      requiresAuth: true
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('@/views/Task.vue'),
    meta: {
      title: '任务管理',
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '用户登录',
      requiresGuest: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: {
      title: '用户注册',
      requiresGuest: true
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: {
      title: '忘记密码',
      requiresGuest: true
    }
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPassword.vue'),
    meta: {
      title: '重置密码',
      requiresGuest: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要登录 - 通过localStorage中是否有token判断
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token && token.trim() !== ''
  
  // 需要登录但未登录，跳转到登录页
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    console.log('需要认证，但未登录，重定向到登录页')
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } 
  // 已登录但访问游客页面，重定向到首页
  else if (to.matched.some(record => record.meta.requiresGuest) && isAuthenticated) {
    console.log('已登录，重定向到首页')
    next({ name: 'Home' })
  } 
  // 其他情况正常跳转
  else {
    next()
  }
})

export default router 