<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useGame } from '../game';
import Loader from './Loader.vue';
import { useGameLoader } from '../game/loader';

const victoryScore = ref(1000);
const virtualDice = ref(true)
const playerNames = reactive<string[]>([
  "哭哭貓貓",
  "胡桃搖",
  "點一下玩一年",
  "狼師",
  "已購買小孩愛吃",
  "少女自用，99新"
])

const game = useGame();
const loader = useGameLoader();

const init = () => {

  if (!loader.isFinished()) {
    errorText.value = 'The game is not ready yet';
    return;
  }

  game.init(victoryScore.value, virtualDice. value,playerNames)
};

const errorText = ref('');
</script>

<template>
  <form @submit.prevent="init">
    <h1>Monopoly</h1>
    <label>
      <span>victory Score: </span>
      <input type="number" min="500" max="10000" step="100" v-model="victoryScore" />
    </label>
    <label>
      <span>Virtual Dice: </span>
      <input type="checkbox" v-model="virtualDice" />
    </label>
    <details open>
      <summary>Players</summary>
      <div class="players">
        <label v-for="i in playerNames.length">
          <span>{{ i }}. </span>
          <input v-model="playerNames[i - 1]" >
        </label>
        <button type="button" @click="playerNames.push((playerNames.length + 1).toString())">Add</button>
      </div>
      </details>
      <button class="confirm">Start</button>
      <span class="error" v-if="errorText">Warring: {{ errorText }}</span>
  </form>
  <Loader />
</template>

<style lang="scss" scoped>
.players {
  gap: .6em;
  display: flex;
  align-items: center;
  flex-direction: column;
}

form {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  gap: 1rem;
}

.confirm {
  width: 16em;
  margin: auto;
  font-weight: bold;
}

.error {
  display: block;
  color: #ee3333;
  font-weight: bold;
  background: #ccc;
  margin: auto;
  padding: .2rem .5rem;
  border-radius: 0.5rem;
}
</style>