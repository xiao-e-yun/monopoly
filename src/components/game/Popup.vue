<script setup lang="ts">
import { useGameState } from '../../game/state';

const state = useGameState()
</script>

<template>
  <div class="popup steps" v-if="state.plunder">
    造成 {{ state.plunder }} 傷害
  </div>
  <div class="popup steps" v-else-if="state.steps">
    <input type="number" min="1" v-model="state.steps"> 步
  </div>

  <TransitionGroup tag="div" name="list" class="popup messages">
    <div v-for="(message, index) in state.messages.toArray()" :key="index" class="message">
      {{ message }}
    </div>
  </TransitionGroup>

  <Transition name="event">
    <div class="popup event" v-if="state.event">
      <h1>{{ state.event.type }}</h1>
      <h2>{{ state.event.title }}</h2>
      <p v-html="state.event.description"></p>
      <div class="btns">
        <template v-if="state.event.hasFail">
          <button @click="state.event.callback(true)">成功</button>
          <button @click="state.event.callback(false)">失敗</button>
        </template>
        <template v-else>
          <button @click="state.event.callback(true)">完成</button>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.popup {
  position: absolute;
}

.steps {
  top: 1.5em;
  left: 0;
  right: 0;
  padding: 0.5rem;
  font-size: 3em
}

.messages {
  top: 0;
  right: 0;
  padding: 0.5rem;
  font-size: 1.6em;
  display: flex;
  flex-direction: column;
  gap: 0.2em;

  & .message {
    background: rgba(0, 0, 0, 0.5);
    padding: 0.2em 0.4em;
    border-radius: .4em;
  }
}

.event {
  top: 10vh;
  left: 10vw;
  width: 80vw;
  height: 80vh;

  // TODO 改成圖片
  background: #000;
  border-radius: 1em;

  h1 {
    position: absolute;
    font-size: 2em;
    margin: 0.5em;
  }

  h2 {
    font-size: 2.5em;
    margin: 0.2em;
  }

  p {
    font-weight: bold;
    font-size: 1.5em;
    margin: 0.5em;
  }

  .btns {
    gap: 1em;
    display: flex;
    position: absolute;
    font-size: 0.8em;
    right: 1em;
    bottom: 1em;
  }

}

// transition
.event-enter-active,
.event-leave-active {
  transition: all 0.3s ease;
}

.event-enter-from,
.event-leave-to {
  transform: translateY(10%);
  opacity: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
}
</style>