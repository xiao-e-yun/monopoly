<script setup lang="ts">
import { computed } from 'vue';
import { useGameState } from '../game/state';

const state = useGameState()
const players = computed(() => Array.from(state.players.values()))

const reload = () => location.reload()
</script>

<template>
  <h1>遊戲結束</h1>
  總回合數: {{ state.inning}}<br>
  最終贏家是... {{ state.winner!.name }}！
  
  <div class="player" v-for="player in players.toSorted((a, b) => b.score - a.score)">
    <h3>{{ player.name }}  <i>{{player === state.winner ? '👑' : '👻'}}</i></h3>
    <span>分數: {{ player.score }}</span>
  </div>

  <button @click="reload">重新開始</button>
</template>

<style lang="scss" scoped>
.player {
  margin: 0.5rem auto;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  background: #555;
  width: 16em;
  min-width: 20vw;

  h3 {
    margin: 0;
    font-size: 1.2rem;
  }
}
</style>