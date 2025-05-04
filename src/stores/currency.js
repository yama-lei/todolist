import { defineStore } from 'pinia'
import api from '../services/api'
import { ElMessage } from 'element-plus'

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    coins: parseInt(localStorage.getItem('coins') || '100'),
    loading: false
  }),
  
  actions: {
    // 增加金币
    addCoins(amount) {
      this.coins += amount
      this.saveCoins()
    },
    
    // 减少金币
    deductCoins(amount) {
      if (this.coins >= amount) {
        this.coins -= amount
        this.saveCoins()
        return true
      }
      return false
    },
    
    // 保存金币到本地存储
    saveCoins() {
      localStorage.setItem('coins', this.coins.toString())
    },
    
    // 重置金币
    resetCoins() {
      this.coins = 100
      this.saveCoins()
    }
  }
}) 