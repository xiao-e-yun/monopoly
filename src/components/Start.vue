<script setup lang="ts">
import { ref } from 'vue';
import { useGame } from '../game';
import Loader from './Loader.vue';
import { useGameLoader } from '../game/loader';

const quantity = ref(2);

const game = useGame();
const loader = useGameLoader();

const init = () => {
  if (quantity.value < 2 || quantity.value > 8) {
    errorText.value = 'The quantity must be between 2 and 8';
    return;
  }

  if (!loader.isFinished()) {
    errorText.value = 'The game is not ready yet';
    return;
  }

  game.init(quantity.value)
};

const errorText = ref('');
</script>

<template>
  <form @submit.prevent="init">
    <h1>Monopoly</h1>
    <label>
      <span>Quantity: </span>
      <input type="number" min="2" max="8" v-model="quantity" />
    </label>
    <button class="confirm">Start</button>
    <span class="error" v-if="errorText">Warring: {{ errorText }}</span>
  </form>
  <Loader />
</template>

<style lang="scss" scoped>
form {
  display: flex;
  flex-direction: column;
  width: 720px;
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