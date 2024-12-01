<script setup lang="ts">
import { computed } from 'vue';
import { useGameState } from '../../game/state';

const state = useGameState()
const players = computed(() => Array.from(state.players.values()))
</script>

<template>
  <!-- <h2 class="title">排位</h2> -->
  <TransitionGroup name="list" tag="div" class="list">
    <div class="player" v-for="player in players.toSorted((a, b) => b.score - a.score)" :key="player.id">
      <h3>第 {{ player.id }} 組</h3>
      <div class="info">
        <span>分數: {{ player.score }}</span>
      </div>
    </div>
  </TransitionGroup>
</template>

<style lang="scss" scoped>
// .title {
//   margin: 0;
//   padding: 0.2rem 1rem;
//   text-align: left;
//   font-size: 1.2rem;
//   font-weight: bold;
// }

.list {
  height: 100%;
  overflow: overlay;
}

.list-move {
  transition: all 0.5s ease;
}

.list-leave-active {
  position: absolute;
}


.player {
  margin: 0.5rem;
  padding: 0.2rem 0.5rem;
  background: #222;
  border-radius: 0.5rem;

  h3 {
    margin: 0;
    font-size: 1.2rem;
    text-align: left;
  }

  .info {
    gap: 0.5rem;
    display: flex;
    text-align: right;
  }
}
</style>