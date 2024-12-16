<script setup lang="ts">
import { computed } from 'vue';
import { GameInputMove, useGameInputs } from '../../game/input';

const inputs = useGameInputs()

const next = inputs.next
const move = inputs.move
const confirm = inputs.confirm
const players = inputs.players

function includes<T>(arr: T[], value: T) {
  if (arr.length === 0) return true
  return arr.includes(value)
}

const moveKeyAndLabel = [
  [GameInputMove.UP, '⇑'],
  [GameInputMove.DOWN, '⇓'],
  [GameInputMove.LEFT, '⇐'],
  [GameInputMove.RIGHT, '⇒']
] as const

const confirmKeyAndLabel = [
  [true, '接受'],
  [false, '拒絕'],
] as const

const playersKeyAndLabel = computed(() => Array.from(players.accept).map((player) => [player, player.name] as const))
</script>

<template>
  <div class="popup">
    {{ next.text }}
    {{ move.text }}
    {{ confirm.text }}
  </div>

  <div class="input">

    <template v-if="next.receive">
      <button @click="next.resolve()">下一步</button>
    </template>

    <template v-if="move.receive" v-for="[key, label] in moveKeyAndLabel">
      <button :disabled="!includes(move.accept, key)" @click="move.resolve(key)">{{ label }}</button>
    </template>

    <template v-if="confirm.receive" v-for="[key, label] in confirmKeyAndLabel">
      <button v-if="includes(confirm.accept, key)" @click="confirm.resolve(key)">{{ label }}</button>
    </template>

    <template v-if="players.receive" v-for="[key, label] in playersKeyAndLabel">
      <button v-if="includes(players.accept, key)" @click="players.resolve(key)">{{ label }}</button>
    </template>

  </div>
</template>

<style lang="scss" scoped>
.input {
  position: absolute;
  padding: 1rem;
  bottom: 0;
  right: 0;
  display: flex;
  gap: 0.5rem;
  font-family: monospace;
  user-select: none;
  z-index: 100;
}

.popup {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  font-size: 3em;
  text-shadow: 0 0 0.2em #000;
  user-select: none;
}
</style>
