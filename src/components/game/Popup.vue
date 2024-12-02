<script setup lang="ts">
import { useGameState } from '../../game/state';

const state = useGameState()
</script>

<template>
  <div class="popup center" v-if="state.plunder">
    對 第{{ state.plunder.target }}組 造成 {{ state.plunder.damage }} 點 傷害
  </div>
  <div class="popup center" v-else-if="state.steps !== undefined">
    <input type="number" min="1" v-model="state.steps"> 步
    <!-- {{ state.steps }} 步 -->
  </div>

  <TransitionGroup tag="div" name="list" class="popup messages">
    <div v-for="message in state.messages.toArray()" :key="message" class="message">
      {{ message }}
    </div>
  </TransitionGroup>

  <Transition name="event">
    <div class="popup event" v-if="state.event">
      <div class="face front">
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
      <div class="face back">
        <img src="/tiles/destiny.png">
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.popup {
  position: absolute;
  text-shadow: 0 0 0.2em #000;
}

.center {
  top: 1.5em;
  left: 0;
  right: 0;
  padding: 0.5rem;
  font-size: 3em
}

.messages {
  top: 0;
  right: 0;
  gap: 0.2em;
  display: flex;
  padding: 0.5rem;
  font-size: 1.6em;
  flex-direction: column;
  align-items: flex-end;

  & .message {
    background: rgba(0, 0, 0, 0.5);
    padding: 0.2em 0.4em;
    border-radius: .4em;
    width: max-content;
  }
}

.event {
  top: 10vh;
  left: 10vw;
  width: 80vw;
  height: 80vh;


  .face {
    position: absolute;
    height: 100%;
    width: 100%;
    border-radius: 1em;
    backface-visibility: hidden;
  }
  
  .front {
    // TODO 改成圖片
    background: #333;
    box-shadow: 0 0 1em rgba(0, 0, 0, 0.5);
    animation: flip 1.2s 0.5s ease-in-out forwards reverse;
  }
  
  .back {
    background: #555;
    animation: flip 1.2s 0.5s ease-in-out forwards;
    display: flex;
    justify-content: center;
    align-items: center;

    img {
      max-width: 60%;
      height: 60%;
    }
  }

  @keyframes flip {
    0% {
      transform: rotateY(0deg);
    }
    100% {
      transform: rotateY(180deg);
      display: none;
    }
  }

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

  & :deep(.hide) {
    background: #333;
    border-radius: .2em;
    padding: 0.2em 0.4em;
    color: #222;
    background: #222;
    text-shadow: none;

    &:hover {
      color: #fff;
    }
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