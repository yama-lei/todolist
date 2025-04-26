<template>
  <canvas ref="canvas" class="weather-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  weather: {
    type: String,
    required: true,
    default: 'sunny',
    validator: (value) => ['sunny', 'rainy', 'cloudy'].includes(value)
  },
  width: {
    type: Number,
    default: 300
  },
  height: {
    type: Number,
    default: 300
  }
})

const canvas = ref(null)
let ctx = null
let animationFrameId = null
let particles = []

// 初始化画布和粒子
const initCanvas = () => {
  if (!canvas.value) return
  
  const dpr = window.devicePixelRatio || 1
  ctx = canvas.value.getContext('2d')
  
  // 设置画布尺寸
  canvas.value.width = props.width * dpr
  canvas.value.height = props.height * dpr
  
  // 适应高分辨率显示器
  ctx.scale(dpr, dpr)
  
  // 重置粒子数组
  particles = []
  
  // 根据天气类型初始化不同的粒子
  if (props.weather === 'rainy') {
    initRain()
  } else if (props.weather === 'sunny') {
    initSun()
  } else if (props.weather === 'cloudy') {
    initClouds()
  }
  
  // 开始动画循环
  startAnimation()
}

// 雨天效果
const initRain = () => {
  // 增加雨滴数量
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * props.width,
      y: Math.random() * props.height,
      length: Math.random() * 20 + 10,
      speed: Math.random() * 10 + 5,
      thickness: Math.random() * 2 + 1
    })
  }
}

// 晴天效果
const initSun = () => {
  // 太阳位置和大小调整
  particles.push({
    x: props.width * 0.75,
    y: props.height * 0.25,
    radius: props.width * 0.18,
    rayLength: props.width * 0.15,
    rayCount: 16,
    rotation: 0,
    rotationSpeed: 0.003
  })
  
  // 增加光点数量
  for (let i = 0; i < 30; i++) {
    particles.push({
      type: 'sparkle',
      x: Math.random() * props.width,
      y: Math.random() * props.height,
      radius: Math.random() * 4 + 1,
      alpha: Math.random() * 0.5 + 0.3,
      speed: Math.random() * 0.7 + 0.3
    })
  }
}

// 多云效果
const initClouds = () => {
  // 增加云朵数量和大小
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: Math.random() * props.width * 1.5 - props.width * 0.25,
      y: Math.random() * (props.height * 0.7),
      radius: Math.random() * 50 + 30,
      speed: Math.random() * 0.6 + 0.1,
      opacity: Math.random() * 0.5 + 0.4
    })
  }
}

// 更新雨天粒子
const updateRain = () => {
  ctx.clearRect(0, 0, props.width, props.height)
  ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)'
  ctx.lineCap = 'round'
  
  particles.forEach(particle => {
    ctx.beginPath()
    ctx.lineWidth = particle.thickness
    ctx.moveTo(particle.x, particle.y)
    ctx.lineTo(particle.x, particle.y + particle.length)
    ctx.stroke()
    
    particle.y += particle.speed
    
    // 如果雨滴落到画布底部，将它重置到顶部
    if (particle.y > props.height) {
      particle.y = 0 - particle.length
      particle.x = Math.random() * props.width
    }
  })
}

// 更新晴天粒子
const updateSun = () => {
  ctx.clearRect(0, 0, props.width, props.height)
  
  // 绘制太阳
  const sun = particles[0]
  
  // 发光效果
  const gradient = ctx.createRadialGradient(
    sun.x, sun.y, sun.radius * 0.2,
    sun.x, sun.y, sun.radius * 1.2
  )
  gradient.addColorStop(0, 'rgba(255, 225, 125, 0.8)')
  gradient.addColorStop(1, 'rgba(255, 225, 125, 0)')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(sun.x, sun.y, sun.radius * 1.2, 0, Math.PI * 2)
  ctx.fill()
  
  // 太阳本体
  ctx.fillStyle = '#FFE17D'
  ctx.beginPath()
  ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2)
  ctx.fill()
  
  // 太阳光芒
  ctx.strokeStyle = '#FFE17D'
  ctx.lineWidth = 3
  
  for (let i = 0; i < sun.rayCount; i++) {
    const angle = (i * (Math.PI * 2) / sun.rayCount) + sun.rotation
    const startX = sun.x + Math.cos(angle) * (sun.radius + 5)
    const startY = sun.y + Math.sin(angle) * (sun.radius + 5)
    const endX = sun.x + Math.cos(angle) * (sun.radius + sun.rayLength)
    const endY = sun.y + Math.sin(angle) * (sun.radius + sun.rayLength)
    
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }
  
  // 更新太阳旋转
  sun.rotation += sun.rotationSpeed
  
  // 更新漂浮光点
  for (let i = 1; i < particles.length; i++) {
    const sparkle = particles[i]
    if (sparkle.type === 'sparkle') {
      ctx.fillStyle = `rgba(255, 255, 200, ${sparkle.alpha})`
      ctx.beginPath()
      ctx.arc(sparkle.x, sparkle.y, sparkle.radius, 0, Math.PI * 2)
      ctx.fill()
      
      sparkle.y += sparkle.speed
      
      // 重置到顶部
      if (sparkle.y > props.height) {
        sparkle.y = 0
        sparkle.x = Math.random() * props.width
      }
    }
  }
}

// 更新多云粒子
const updateClouds = () => {
  ctx.clearRect(0, 0, props.width, props.height)
  
  particles.forEach(cloud => {
    // 绘制云朵
    drawCloud(cloud.x, cloud.y, cloud.radius, cloud.opacity)
    
    cloud.x += cloud.speed
    
    // 当云移出画布时，重置位置
    if (cloud.x > props.width + cloud.radius) {
      cloud.x = -cloud.radius * 2
      cloud.y = Math.random() * (props.height / 2)
    }
  })
}

// 绘制云朵
const drawCloud = (x, y, radius, opacity) => {
  ctx.fillStyle = `rgba(180, 180, 180, ${opacity})`
  
  // 绘制主体云朵（由多个圆形组成）
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.35, y - radius * 0.2, radius * 0.4, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.75, y, radius * 0.45, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.4, y + radius * 0.2, radius * 0.35, 0, Math.PI * 2)
  ctx.fill()
}

// 动画循环
const animate = () => {
  if (props.weather === 'rainy') {
    updateRain()
  } else if (props.weather === 'sunny') {
    updateSun()
  } else if (props.weather === 'cloudy') {
    updateClouds()
  }
  
  animationFrameId = requestAnimationFrame(animate)
}

// 开始动画
const startAnimation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  animate()
}

// 监听天气变化
watch(() => props.weather, (newWeather) => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  particles = []
  
  if (newWeather === 'rainy') {
    initRain()
  } else if (newWeather === 'sunny') {
    initSun()
  } else if (newWeather === 'cloudy') {
    initClouds()
  }
  
  startAnimation()
})

// 组件挂载时初始化
onMounted(() => {
  initCanvas()
  
  // 监听窗口大小变化，重新调整画布
  window.addEventListener('resize', initCanvas)
})

// 组件卸载时清理
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', initCanvas)
})
</script>

<style scoped>
.weather-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
}
</style> 