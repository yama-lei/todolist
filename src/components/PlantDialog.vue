<template>
  <div class="plant-dialog" :class="{ 'show': isVisible }">
    <div class="dialog-bubble">
      <p class="dialog-text">{{ text }}</p>
      <div class="dialog-buttons" v-if="showButtons">
        <el-button size="small" type="primary" @click="$emit('primary-action')">{{ primaryButtonText }}</el-button>
        <el-button size="small" @click="$emit('secondary-action')">{{ secondaryButtonText }}</el-button>
      </div>
    </div>
    <div class="dialog-tail"></div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  isVisible: {
    type: Boolean,
    default: false
  },
  showButtons: {
    type: Boolean,
    default: false
  },
  primaryButtonText: {
    type: String,
    default: '确定'
  },
  secondaryButtonText: {
    type: String,
    default: '取消'
  }
})

defineEmits(['primary-action', 'secondary-action'])
</script>

<style scoped>
.plant-dialog {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 10;
  margin-bottom: 20px;
  max-width: 300px;
}

.plant-dialog.show {
  opacity: 1;
  visibility: visible;
}

.dialog-bubble {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: pulse 2s infinite ease-in-out;
}

.dialog-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  gap: 10px;
}

.dialog-tail {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(255, 255, 255, 0.95);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}
</style> 