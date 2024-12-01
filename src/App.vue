<script setup lang="ts">
import GameOver from './components/GameOver.vue';
import Start from './components/Start.vue';
import Game from './components/game/Game.vue';
import { useGame } from './game';

const game = useGame();
</script>

<template>
  <Start v-if="!game.ready" />
  <Game v-else-if="game.running" />
  <GameOver v-else />
</template>