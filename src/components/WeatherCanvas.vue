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
let gradientBg = null

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
  
  // 创建背景渐变
  createBackgroundGradient()
  
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

// 创建背景渐变
const createBackgroundGradient = () => {
  if (props.weather === 'sunny') {
    gradientBg = ctx.createLinearGradient(0, 0, 0, props.height)
    gradientBg.addColorStop(0, 'rgba(135, 206, 250, 0.3)')
    gradientBg.addColorStop(1, 'rgba(135, 206, 250, 0)')
  } else if (props.weather === 'rainy') {
    gradientBg = ctx.createLinearGradient(0, 0, 0, props.height)
    gradientBg.addColorStop(0, 'rgba(105, 105, 105, 0.2)')
    gradientBg.addColorStop(1, 'rgba(105, 105, 105, 0)')
  } else if (props.weather === 'cloudy') {
    gradientBg = ctx.createLinearGradient(0, 0, 0, props.height)
    gradientBg.addColorStop(0, 'rgba(200, 200, 200, 0.2)')
    gradientBg.addColorStop(1, 'rgba(200, 200, 200, 0)')
  }
}

// 雨天效果
const initRain = () => {
  // 雨滴数量和类型
  const raindropsCount = 20
  
  for (let i = 0; i < raindropsCount; i++) {
    const isSplash = Math.random() > 0.9
    
    if (isSplash) {
      // 水花粒子
      particles.push({
        type: 'splash',
        x: Math.random() * props.width,
        y: props.height - 10,
        radius: Math.random() * 3 + 1,
        speedX: Math.random() * 3 - 1.5,
        speedY: -Math.random() * 5 - 2,
        gravity: 0.2,
        life: Math.random() * 30 + 30,
        opacity: 0.7
      })
    } else {
      // 雨滴
      particles.push({
        type: 'raindrop',
        x: Math.random() * props.width,
        y: Math.random() * props.height - props.height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 12 + 8,
        thickness: Math.random() * 1.8 + 0.5,
        windOffset: Math.sin(Math.random() * Math.PI) * 0.5
      })
    }
  }
}

// 晴天效果
const initSun = () => {
  // 太阳 - 尺寸减小30%
  particles.push({
    type: 'sun',
    x: props.width * 0.75,
    y: props.height * 0.25,
    radius: props.width * 0.1, // 从0.15减小到0.1
    rayLength: props.width * 0.08, // 从0.12减小到0.08
    rayCount: 12,
    rotation: 0,
    rotationSpeed: 0.002,
    pulse: 0,
    pulseSpeed: 0.03
  })
  
  // 光点 - 减少数量从40降至15，并使它们主要出现在太阳周围
  for (let i = 0; i < 40; i++) {
    // 让大部分光点靠近太阳周围
    let x, y;
    if (i < 10) {
      // 70%的光点集中在太阳周围
      const angle = Math.random() * Math.PI * 2;
      const distance = props.width * 0.1 + Math.random() * props.width * 0.3;
      x = props.width * 0.75 + Math.cos(angle) * distance;
      y = props.height * 0.25 + Math.sin(angle) * distance;
    } else {
      // 30%的光点随机分布
      x = Math.random() * props.width;
      y = Math.random() * props.height;
    }
    
    particles.push({
      type: 'sparkle',
      x: x,
      y: y,
      radius: Math.random() * 2 + 0.5, // 减小光点大小
      alpha: Math.random() * 0.3 + 0.1, // 降低透明度
      speed: Math.random() * 0.3 + 0.1, // 降低移动速度
      pulse: Math.random() * Math.PI * 2
    })
  }
  
  // 小云朵装饰
  for (let i = 0; i < 5; i++) {
    particles.push({
      type: 'smallCloud',
      x: Math.random() * props.width,
      y: Math.random() * (props.height * 0.4),
      radius: Math.random() * 20 + 15,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.2 + 0.1
    })
  }
}

// 多云效果
const initClouds = () => {
  // 大云朵
  for (let i = 0; i < 5; i++) {
    particles.push({
      type: 'bigCloud',
      x: Math.random() * props.width * 1.5 - props.width * 0.25,
      y: Math.random() * (props.height * 0.6),
      radius: Math.random() * 60 + 40,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.5 + 0.4,
      details: Math.floor(Math.random() * 3) + 3
    })
  }
  
  // 小云朵
  for (let i = 0; i < 8; i++) {
    particles.push({
      type: 'smallCloud',
      x: Math.random() * props.width * 1.5 - props.width * 0.25,
      y: Math.random() * (props.height * 0.8),
      radius: Math.random() * 30 + 15,
      speed: Math.random() * 0.6 + 0.2,
      opacity: Math.random() * 0.4 + 0.2
    })
  }
}

// 更新雨天粒子
const updateRain = () => {
  ctx.clearRect(0, 0, props.width, props.height)
  
  // 绘制背景
  ctx.fillStyle = gradientBg
  ctx.fillRect(0, 0, props.width, props.height)
  
  particles.forEach((particle, index) => {
    if (particle.type === 'raindrop') {
      // 绘制雨滴
      const rainAlpha = Math.min(1, particle.speed / 15)
      ctx.strokeStyle = `rgba(174, 194, 224, ${rainAlpha})`
      ctx.lineCap = 'round'
      
      ctx.beginPath()
      ctx.lineWidth = particle.thickness
      ctx.moveTo(particle.x, particle.y)
      ctx.lineTo(
        particle.x + particle.windOffset,
        particle.y + particle.length
      )
      ctx.stroke()
      
      particle.y += particle.speed
      particle.x += particle.windOffset * 0.5
      
      // 如果雨滴落到画布底部，有概率创建水花
      if (particle.y > props.height) {
        if (Math.random() > 0.7) {
          // 创建水花效果
          for (let i = 0; i < 3; i++) {
            particles.push({
              type: 'splash',
              x: particle.x,
              y: props.height - 5,
              radius: Math.random() * 2 + 1,
              speedX: Math.random() * 3 - 1.5,
              speedY: -Math.random() * 3 - 2,
              gravity: 0.15,
              life: Math.random() * 20 + 10,
              opacity: 0.7
            })
          }
        }
        // 重置雨滴位置
        particle.y = -particle.length
        particle.x = Math.random() * props.width
        particle.windOffset = Math.sin(Math.random() * Math.PI) * 0.5
      }
    } else if (particle.type === 'splash') {
      // 绘制水花
      ctx.fillStyle = `rgba(174, 194, 224, ${particle.opacity})`
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fill()
      
      // 更新水花位置
      particle.x += particle.speedX
      particle.y += particle.speedY
      particle.speedY += particle.gravity
      particle.life--
      particle.opacity = particle.life / 40
      
      // 移除消失的水花
      if (particle.life <= 0) {
        particles.splice(index, 1)
      }
    }
  })
}

// 更新晴天粒子
const updateSun = () => {
  ctx.clearRect(0, 0, props.width, props.height)
  
  // 绘制渐变背景
  ctx.fillStyle = gradientBg
  ctx.fillRect(0, 0, props.width, props.height)

  particles.forEach((particle, index) => {
    if (particle.type === 'sun') {
      // 绘制太阳
      const sun = particle
      
      // 脉动效果 - 只用于光芒和光晕效果，太阳本体大小保持稳定
      sun.pulse += sun.pulseSpeed
      // 将脉动因子设为常数1，不再变化太阳大小
      const pulseFactor = 1
      
      // 外围光晕 - 调整为更温和的颜色
      const outerGlow = ctx.createRadialGradient(
        sun.x, sun.y, sun.radius * 0.5,
        sun.x, sun.y, sun.radius * 3.5
      )
      outerGlow.addColorStop(0, 'rgba(255, 220, 130, 0.3)') 
      outerGlow.addColorStop(0.5, 'rgba(255, 210, 100, 0.15)') 
      outerGlow.addColorStop(1, 'rgba(255, 210, 100, 0)')
      
      ctx.fillStyle = outerGlow
      ctx.beginPath()
      ctx.arc(sun.x, sun.y, sun.radius * 3.5, 0, Math.PI * 2)
      ctx.fill()
      
      // 中间光晕 - 光晕可以有轻微脉动
      const glowPulse = 1 + Math.sin(sun.pulse * 0.5) * 0.05 // 非常轻微的脉动
      
      const middleGlow = ctx.createRadialGradient(
        sun.x, sun.y, sun.radius * 0.2,
        sun.x, sun.y, sun.radius * 2 * glowPulse
      )
      middleGlow.addColorStop(0, 'rgba(255, 220, 130, 0.7)') 
      middleGlow.addColorStop(0.5, 'rgba(255, 190, 80, 0.3)')
      middleGlow.addColorStop(1, 'rgba(255, 180, 80, 0)')
      
      ctx.fillStyle = middleGlow
      ctx.beginPath()
      ctx.arc(sun.x, sun.y, sun.radius * 2 * glowPulse, 0, Math.PI * 2)
      ctx.fill()
      
      // 太阳本体 - 调整为更柔和的黄色系，大小保持稳定
      const sunCenter = sun.x - sun.radius * 0.3
      const sunCenterY = sun.y - sun.radius * 0.3
      
      const sunGradient = ctx.createRadialGradient(
        sunCenter, sunCenterY, 0,
        sun.x, sun.y, sun.radius
      )
      sunGradient.addColorStop(0, '#FFF8E1') // 更柔和的乳白色中心
      sunGradient.addColorStop(0.4, '#FFECB3') // 淡黄色
      sunGradient.addColorStop(0.8, '#FFD54F') // 温和的黄色
      sunGradient.addColorStop(1, '#FFB300') // 柔和的琥珀色边缘
      
      ctx.fillStyle = sunGradient
      ctx.beginPath()
      ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2)
      ctx.fill()
      
      // 太阳光芒 - 光芒长度可以有变化，但起点固定
      ctx.strokeStyle = 'rgba(255, 213, 79, 0.7)' // 更柔和的黄色
      
      for (let i = 0; i < sun.rayCount; i++) {
        const angle = (i * (Math.PI * 2) / sun.rayCount) + sun.rotation
        // 光芒长度随时间变化，但不影响太阳大小
        const rayLength = sun.rayLength * (0.85 + Math.sin(sun.pulse * 0.8 + i * 0.3) * 0.15)
        
        const startX = sun.x + Math.cos(angle) * (sun.radius + 2)
        const startY = sun.y + Math.sin(angle) * (sun.radius + 2)
        const endX = sun.x + Math.cos(angle) * (sun.radius + rayLength)
        const endY = sun.y + Math.sin(angle) * (sun.radius + rayLength)
        
        ctx.lineWidth = 2 + Math.sin(sun.pulse + i * 0.5) * 1.5 // 光芒宽度变化
        ctx.globalAlpha = 0.7 + Math.sin(sun.pulse + i * 0.3) * 0.2
        
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }
      
      // 次要短光芒 - 同样只有长度变化，不影响太阳本体
      ctx.strokeStyle = 'rgba(255, 213, 79, 0.5)' // 更柔和的黄色
      ctx.lineWidth = 1.5
      
      for (let i = 0; i < sun.rayCount * 2; i++) {
        const angle = (i * (Math.PI * 2) / (sun.rayCount * 2)) + sun.rotation * 1.5
        const rayLength = sun.rayLength * 0.4 * (0.7 + Math.sin(sun.pulse * 1.2 + i * 0.5) * 0.3)
        
        const startX = sun.x + Math.cos(angle) * (sun.radius + 2)
        const startY = sun.y + Math.sin(angle) * (sun.radius + 2)
        const endX = sun.x + Math.cos(angle) * (sun.radius + rayLength)
        const endY = sun.y + Math.sin(angle) * (sun.radius + rayLength)
        
        ctx.globalAlpha = 0.2 + Math.cos(sun.pulse * 0.8 + i) * 0.2
        
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }
      
      // 三角形光晕 - 位置可以轻微变化，但基于固定太阳半径
      ctx.fillStyle = 'rgba(255, 230, 160, 0.3)' // 更柔和的颜色
      
      for (let i = 0; i < 8; i++) {
        const angle = (i * (Math.PI * 2) / 8) + sun.rotation * 0.7
        const distance = sun.radius * (1.6 + Math.sin(sun.pulse * 0.9) * 0.15)
        
        const point1X = sun.x + Math.cos(angle) * distance
        const point1Y = sun.y + Math.sin(angle) * distance
        
        const point2X = sun.x + Math.cos(angle + 0.2) * (distance * 0.7)
        const point2Y = sun.y + Math.sin(angle + 0.2) * (distance * 0.7)
        
        const point3X = sun.x + Math.cos(angle - 0.2) * (distance * 0.7)
        const point3Y = sun.y + Math.sin(angle - 0.2) * (distance * 0.7)
        
        ctx.globalAlpha = 0.15 + Math.sin(sun.pulse + i * 0.7) * 0.1 // 透明度变化
        
        ctx.beginPath()
        ctx.moveTo(point1X, point1Y)
        ctx.lineTo(point2X, point2Y)
        ctx.lineTo(point3X, point3Y)
        ctx.closePath()
        ctx.fill()
      }
      
      // 太阳表面光斑 - 位置变化，大小保持稳定
      ctx.fillStyle = 'rgba(255, 250, 230, 0.7)' // 更柔和的亮点
      
      for (let i = 0; i < 3; i++) {
        const spotAngle = sun.rotation * 2 + i * Math.PI / 2.5
        const spotDistance = sun.radius * 0.5 * Math.random()
        const spotX = sun.x + Math.cos(spotAngle) * spotDistance
        const spotY = sun.y + Math.sin(spotAngle) * spotDistance
        const spotSize = sun.radius * (0.04 + Math.random() * 0.06)
        
        ctx.globalAlpha = 0.2 + Math.random() * 0.3
        
        ctx.beginPath()
        ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // 重置全局透明度
      ctx.globalAlpha = 1
      
      // 更新太阳旋转
      sun.rotation += sun.rotationSpeed * (1 + Math.sin(sun.pulse * 0.3) * 0.1)
    } else if (particle.type === 'sparkle') {
      // 更新漂浮光点 - 减弱星光闪烁效果
      const sparkle = particle
      sparkle.pulse += 0.05 + Math.random() * 0.01 // 减慢脉动速度
      
      // 更柔和的闪烁
      const alphaFactor = 0.3 + Math.sin(sparkle.pulse) * 0.3 // 减弱闪烁变化
      
      // 不同亮度的星光
      if (Math.random() > 0.98) {
        // 更少的亮闪烁概率
        ctx.fillStyle = `rgba(255, 255, 200, ${sparkle.alpha * 1.2})`
        ctx.shadowColor = 'rgba(255, 255, 180, 0.6)'
        ctx.shadowBlur = 3
      } else {
        ctx.fillStyle = `rgba(255, 255, 220, ${sparkle.alpha * alphaFactor})`
        ctx.shadowBlur = 0
      }
      
      ctx.beginPath()
      ctx.arc(sparkle.x, sparkle.y, sparkle.radius * (0.7 + alphaFactor * 0.3), 0, Math.PI * 2)
      ctx.fill()
      
      // 重置阴影
      ctx.shadowBlur = 0
      
      // 光点移动路径更温和
      sparkle.y += sparkle.speed * 0.8
      sparkle.x += Math.sin(sparkle.pulse * 0.1) * 0.2
      
      // 重置到顶部，但增加一些随机性使其不像下雪
      if (sparkle.y > props.height) {
        sparkle.y = -sparkle.radius * 2;
        // 大部分光点重置到太阳周围
        if (Math.random() > 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const distance = props.width * 0.1 + Math.random() * props.width * 0.3;
          sparkle.x = props.width * 0.75 + Math.cos(angle) * distance;
        } else {
          sparkle.x = Math.random() * props.width;
        }
      }
    } else if (particle.type === 'smallCloud') {
      // 绘制小云朵
      drawCloud(particle.x, particle.y, particle.radius, particle.opacity)
      
      particle.x += particle.speed
      
      // 当云移出画布时，重置位置
      if (particle.x > props.width + particle.radius) {
        particle.x = -particle.radius * 2
        particle.y = Math.random() * (props.height / 2)
      }
    }
  })
}

// 更新多云粒子
const updateClouds = () => {
  ctx.clearRect(0, 0, props.width, props.height)
  
  // 绘制渐变背景
  ctx.fillStyle = gradientBg
  ctx.fillRect(0, 0, props.width, props.height)
  
  // 按大小排序云朵绘制（小的在前，大的在后）
  particles.sort((a, b) => a.radius - b.radius)
  
  particles.forEach(cloud => {
    if (cloud.type === 'bigCloud') {
      // 绘制大云朵
      drawDetailedCloud(cloud.x, cloud.y, cloud.radius, cloud.opacity, cloud.details)
    } else {
      // 绘制小云朵
      drawCloud(cloud.x, cloud.y, cloud.radius, cloud.opacity)
    }
    
    cloud.x += cloud.speed
    
    // 当云移出画布时，重置位置
    if (cloud.x > props.width + cloud.radius) {
      cloud.x = -cloud.radius * 2
      cloud.y = Math.random() * (props.height * 0.6)
      // 随机调整下一次的高度
      cloud.radius = cloud.type === 'bigCloud' 
        ? Math.random() * 60 + 40 
        : Math.random() * 30 + 15
    }
  })
}

// 绘制基本云朵
const drawCloud = (x, y, radius, opacity) => {
  ctx.fillStyle = `rgba(220, 220, 220, ${opacity})`
  
  // 绘制云朵（由多个圆形组成）
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.35, y - radius * 0.2, radius * 0.4, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.75, y, radius * 0.45, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.4, y + radius * 0.2, radius * 0.35, 0, Math.PI * 2)
  ctx.fill()
  
  // 云朵亮边
  ctx.fillStyle = `rgba(250, 250, 250, ${opacity * 0.6})`
  ctx.beginPath()
  ctx.arc(x, y - radius * 0.12, radius * 0.35, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.35, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制详细云朵
const drawDetailedCloud = (x, y, radius, opacity, details) => {
  // 绘制云朵阴影
  ctx.fillStyle = `rgba(180, 180, 180, ${opacity * 0.5})`
  ctx.beginPath()
  ctx.arc(x + 5, y + 5, radius * 0.6, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.35 + 5, y - radius * 0.2 + 5, radius * 0.5, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.75 + 5, y + 5, radius * 0.55, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制主体云朵
  ctx.fillStyle = `rgba(220, 220, 220, ${opacity})`
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.35, y - radius * 0.2, radius * 0.5, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.75, y, radius * 0.55, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.4, y + radius * 0.3, radius * 0.45, 0, Math.PI * 2)
  
  // 添加额外的细节
  for (let i = 0; i < details; i++) {
    const offsetX = Math.cos(i * Math.PI / 4) * radius * 0.6
    const offsetY = Math.sin(i * Math.PI / 4) * radius * 0.4
    ctx.arc(x + offsetX, y + offsetY, radius * 0.3, 0, Math.PI * 2)
  }
  
  ctx.fill()
  
  // 绘制云朵亮边
  ctx.fillStyle = `rgba(250, 250, 250, ${opacity * 0.7})`
  ctx.beginPath()
  ctx.arc(x, y - radius * 0.15, radius * 0.4, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.35, y - radius * 0.35, radius * 0.3, 0, Math.PI * 2)
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
  
  // 更新背景渐变
  createBackgroundGradient()
  
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
  pointer-events: none; /* 允许点击穿透到下层元素 */
}
</style> 