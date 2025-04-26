<template>
  <div class="plant-status-message" :class="{ 'show': message }">
    <div class="message-bubble">
      <div class="message-icon" v-if="icon">{{ icon }}</div>
      <div class="message-content">
        <p class="message-text">{{ message }}</p>
        <div class="message-meta" v-if="showMeta">
          <span class="message-time">{{ formattedTime }}</span>
          <span class="message-tag" v-if="tag">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'
import { format } from 'date-fns'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  messageType: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'weather', 'reminder', 'motivation', 'tip'].includes(value)
  },
  icon: {
    type: String,
    default: ''
  },
  tag: {
    type: String,
    default: ''
  },
  timestamp: {
    type: [Date, Number, String],
    default: () => new Date()
  },
  showMeta: {
    type: Boolean,
    default: true
  }
})

// 格式化时间
const formattedTime = computed(() => {
  if (!props.timestamp) return ''
  
  const date = props.timestamp instanceof Date 
    ? props.timestamp 
    : new Date(props.timestamp)
    
  return format(date, 'HH:mm')
})

</script>

<style scoped>
.plant-status-message {
  margin-top: 20px;
  width: 100%;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.plant-status-message.show {
  opacity: 1;
  transform: translateY(0);
}

.message-bubble {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: flex-start;
  position: relative;
}

.message-bubble:before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 10px 10px;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.95) transparent;
}

.message-icon {
  font-size: 1.5rem;
  margin-right: 12px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-text {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #888;
}

.message-tag {
  background-color: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
}

@media (max-width: 768px) {
  .message-bubble {
    padding: 12px;
  }
  
  .message-text {
    font-size: 0.9rem;
  }
}
</style> 