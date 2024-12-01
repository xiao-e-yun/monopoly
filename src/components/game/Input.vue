<script setup lang="ts">
import { GameInputMove, useGameInputs } from '../../game/input';

const inputs = useGameInputs()

const next = inputs.next
const move = inputs.move
const confirm = inputs.confirm

function includes<T>(arr: T[], value: T) {
  if (arr.length === 0) return true
  return arr.includes(value)
}

const moveKeyAndLabel = [
  [GameInputMove.UP, '⬆'],
  [GameInputMove.DOWN, '⬇'],
  [GameInputMove.LEFT, '⬅'],
  [GameInputMove.RIGHT, '➡']
] as const

const confirmKeyAndLabel = [
  [true, '接受'],
  [false, '拒絕'],
] as const
</script>

<template>
  <div class="popup">{{ next.text }}</div>
  <div class="popup">{{ move.text }}</div>
  <div class="popup">{{ confirm.text }}</div>

  <div class="input">

    <template v-if="next.receive">
      <button @click="next.resolve()">下一步</button>
    </template>

    <template v-if="move.receive" v-for="[key, label] in moveKeyAndLabel">
      <button v-if="includes(move.accept, key)" @click="move.resolve(key)">{{ label }}</button>
    </template>

    <template v-if="confirm.receive" v-for="[key, label] in confirmKeyAndLabel">
      <button v-if="includes(confirm.accept, key)" @click="confirm.resolve(key)">{{ label }}</button>
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
}

.popup {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  font-size: 3em
}
</style>