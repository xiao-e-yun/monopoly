<script setup lang="ts">
import { useGameState } from '../../game/state';
import { debug } from '../../game/debug';

const state = useGameState()

function getStyleByPosition(xy: [number, number]) {
  const [x, y] = xy
  return {
    left: `${x}px`,
    top: `${y}px`,
  }
}

function debugText(value: number) {
  return value.toFixed(2)
}
</script>

<template>
  <div class="popup-group">
    <div class="popup center" v-if="state.plunder">
      對 第{{ state.plunder.target }}組 造成 {{ state.plunder.damage }} 點 傷害
    </div>
    <div class="popup center" v-else-if="state.steps !== undefined">
      {{ state.steps }} 步
    </div>

    <TransitionGroup tag="div" name="list" class="popup messages">
      <div v-for="message in state.messages.toArray()" :key="message" class="message">
        {{ message }}
      </div>
    </TransitionGroup>

    <div v-for="[label, pos] in state.playersLabel" :style="getStyleByPosition(pos)" class="popup label">
      第 {{ label }} 組
    </div>
  </div>


  <div v-if="debug.enabled" style="position: fixed; top: .2em;left: .2em;text-align: left;">
    X:<input type="range" v-model.number="debug.x" :max="10" :min="-10" step="0.5" />{{ debugText(debug.x) }}<br>
    Y:<input type="range" v-model.number="debug.y" :max="10" :min="-10" step="0.5" />{{ debugText(debug.y) }}<br>
    Z:<input type="range" v-model.number="debug.z" :max="10" :min="-10" step="0.5" />{{ debugText(debug.z) }}<br>
    AngleX: <input type="range" v-model.number="debug.angleX" :max="180" :min="-180" />{{ debugText(debug.angleX) }}<br>
    AngleY: <input type="range" v-model.number="debug.angleY" :max="180" :min="-180" />{{ debugText(debug.angleY) }}<br>
    AngleZ: <input type="range" v-model.number="debug.angleZ" :max="180" :min="-180" />{{ debugText(debug.angleZ) }}<br>
  </div>

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
.popup-group {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

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

.label {
  padding: 0em 0.2em;
  border-radius: .2em;
  font-size: 0.8em;
  transform: translate(-50%, -50%);
  background: #333;
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