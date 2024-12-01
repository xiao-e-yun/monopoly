<script setup lang="ts">
import { useGameState } from '../game/state';
import GameRanking from './game/Ranking.vue';

const state = useGameState()
</script>

<template>
  <h1>遊戲結束</h1>
  最終贏家: 第 {{ state.winner }} 組
  <GameRanking />
</template>

<style lang="scss" scoped>
</style>