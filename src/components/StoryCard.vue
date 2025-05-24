<!-- StoryCard.vue -->
<template>
  <div class="story-card">
    <div class="image-container" v-if="imageSrc">
      <a :href="link" target="_blank" >
        <img :src="imageSrc" alt="Story image" />
      </a>
    </div>
    <div class="content">
      <h3 class="title" v-if="title && title.trim()">{{ title }}</h3>
      <p class="description">{{ description }}</p>
    </div>
    <div class="side">
      <div class="explore" v-if="link">
        <!-- From Uiverse.io by barisdogansutcu -->
        <a :href="link">
          <button onclick="handleClickButton()">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"
              stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            阅读全文
          </button>
        </a>
      </div>
    </div>
  </div>
</template>


<script setup>
import { defineProps,ref } from 'vue'
const props = defineProps({
  imageSrc: String,
  title: String,
  description: String,
  link: String,
  time: String,
  commets: String,
  showComments: Boolean,
  likesNum:Number
})


</script>
<style scoped>
.story-card {
  border: none;
  border-radius: 12px;
  padding: 20px;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.story-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
.image-container {
  flex: 0 0 180px;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.image-container:hover img {
  transform: scale(1.05);
}

.content {
  flex: 1;
}

.title {
  color: #2d3748;
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.description {
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: end;
}

.likes :hover {
  cursor: pointer;
}

.explore {

  /* From Uiverse.io by barisdogansutcu */
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #7e97b8;
    background-color: #e0e8ef;
    border-style: solid;
    border-width: 2px 2px 2px 2px;
    border-color: rgba(255, 255, 255, 0.333);
    border-radius: 10px;
    padding: 8px 12px 8px 14px;
    transform: translate(0px, 0px) rotate(0deg);
    transition: 0.2s;
    box-shadow: -4px -2px 16px 0px #ffffff, 4px 2px 16px 0px rgb(95 157 231 / 48%);
  }

  button:hover {
    color: #516d91;
    background-color: #E5EDF5;
    box-shadow: -2px -1px 8px 0px #ffffff, 2px 1px 8px 0px rgb(95 157 231 / 48%);
  }

  button:active {
    box-shadow: none;
  }
}

@media (max-width: 640px) {
  .story-card {
    flex-direction: column;
  }

  .image-container {
    flex: none;
    width: 100%;
    height: 200px;
  }
}
</style>