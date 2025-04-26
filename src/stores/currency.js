import { defineStore } from 'pinia'

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    coins: parseInt(localStorage.getItem('coins') || '0')
  }),
  
  actions: {
    addCoins(amount) {
      this.coins += amount
      this.saveCoins()
    },
    
    useCoins(amount) {
      if (this.coins >= amount) {
        this.coins -= amount
        this.saveCoins()
        return true
      }
      return false
    },
    
    saveCoins() {
      localStorage.setItem('coins', this.coins.toString())
    }
  }
}) 