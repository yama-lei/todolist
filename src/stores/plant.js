import { defineStore } from 'pinia'

export const usePlantStore = defineStore('plant', {
  state: () => ({
    plant: JSON.parse(localStorage.getItem('plant') || JSON.stringify({
      name: '小绿',
      level: 1,
      experience: 0,
      mood: 'happy', // happy, neutral, sad
      state: 'growing', // growing, flowering, fruiting
      weather: 'sunny', // sunny, rainy, cloudy
      lastThoughtDate: null,
      thoughts: [],
    }))
  }),
  
  actions: {
    gainExperience(amount) {
      this.plant.experience += amount
      this.checkLevelUp()
      this.savePlant()
    },
    
    checkLevelUp() {
      const nextLevelExp = this.plant.level * 100
      if (this.plant.experience >= nextLevelExp) {
        this.plant.level += 1
        this.plant.experience -= nextLevelExp
        this.updateState()
      }
    },
    
    updateState() {
      if (this.plant.level >= 10) {
        this.plant.state = 'fruiting'
      } else if (this.plant.level >= 5) {
        this.plant.state = 'flowering'
      } else {
        this.plant.state = 'growing'
      }
      this.savePlant()
    },
    
    updateWeather(weather) {
      this.plant.weather = weather
      this.savePlant()
    },
    
    setMood(mood) {
      this.plant.mood = mood
      this.savePlant()
    },
    
    addThought(thought) {
      const newThought = {
        id: Date.now(),
        content: thought,
        date: new Date().toISOString()
      }
      this.plant.thoughts.unshift(newThought)
      this.plant.lastThoughtDate = new Date().toISOString()
      this.savePlant()
    },
    
    savePlant() {
      localStorage.setItem('plant', JSON.stringify(this.plant))
    }
  },
  
  getters: {
    currentLevel() {
      return this.plant.level
    },
    
    experienceToNextLevel() {
      return this.plant.level * 100 - this.plant.experience
    },
    
    avatarImage() {
      const state = this.plant.state
      const weather = this.plant.weather
      const mood = this.plant.mood
      
      // 返回不同状态下的图片路径
      return `/images/plant/${state}_${weather}_${mood}.png`
    },
    
    recentThoughts() {
      return this.plant.thoughts.slice(0, 5)
    }
  }
}) 