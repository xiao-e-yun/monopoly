<script setup lang="ts">
import { useGameLoader } from '../game/loader';
import { computed } from '@vue/reactivity';

const loader = useGameLoader();
const total = computed(() => loader.textures.size + loader.sounds.size + loader.loadings);
const ready = computed(() => total.value - loader.loadings);
</script>

<template>
  <div class="loader">
    <span class="progress">{{ ready }} / {{ total }} <progress :max="total" :value="ready" /></span>
    <p v-if="loader.isFinished()">Loading Completed</p>
    <div class="log" v-else>
      <span v-for="(log, index) in loader.logs.toReversed()" :key="index">{{ log }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loader {
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 1rem auto;
  width: 360px;
  max-height: 200px;
  overflow: auto;
  background: #333;
  border-radius: 1rem;

  .progress {
    background: #444;
    position: sticky;
    width: 100%;
    top: 0;
  }

  .log {
    font-size: 0.8rem;
    text-align: left;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
  }
}
</style>