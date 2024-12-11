<script setup lang="ts">
import { useGameState } from '../../game/state';
import { debug } from '../../game/debug';
import { DEFAULT_PLAYER_HEALTH } from '../../game/player';
import { computed } from 'vue';

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

import TaskIcon from '/tiles/task.png'
import OpportunityIcon from '/tiles/opportunity.png'
import DestinyIcon from '/tiles/destiny.png'
import PunishmentIcon from '/tiles/punishment.png'
const backgroundIcon = computed(()=>{
  if (!state.event) return ''
  return {
    "任務": TaskIcon,
    "機會": OpportunityIcon,
    "命運": DestinyIcon,
    "懲罰": PunishmentIcon,
  }[state.event.type]
})
</script>

<template>
  <div class="popup-group">
    <div class="popup center" v-if="state.plunder">
      對 第{{ state.plunder.target }}組 造成 {{ state.plunder.damage }} 點 傷害
    </div>
    <div class="popup center" v-else-if="state.steps !== undefined">
      {{ state.steps }} 步
    </div>
    <div class="popup center dices" v-else-if="state.dices !== undefined">
      <img v-for="dice in state.dices" :src="`/others/dice${dice}.png`" />
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


  <div v-if="debug.enabled" class="popup debug">
    <details open>

      <summary>Current</summary>
      
      <span>Step: <input v-if="state.steps !== undefined" type="range" v-model.number="state.steps" :max="32" :min="0" />{{ state.steps ?? "Undefined" }}</span>
    </details>
    <details open v-for="player in state.players.values()">
      <summary>Player {{ player.id }}</summary>
      <span>Health: <input type="range" v-model.number="player.health" :max="DEFAULT_PLAYER_HEALTH" min="0" /> {{ player.health }}</span>
      <span>Dizziness: <input type="range" v-model.number="player.dizziness" max="10" min="0"/> {{ player.dizziness }}</span>
      <span>DoubleDice: <input type="range" v-model.number="player.doubleDice" max="10" min="0"/> {{ player.doubleDice }}</span>
      <span>Score: <input type="number" v-model.number="player.score" max="10" min="0" /></span>
    </details>
    <details open>
      <summary>View</summary>
      <span>X:<input type="range" v-model.number="debug.x" :max="10" :min="-10" step="0.5" />{{ debugText(debug.x) }}</span>
      <span>Y:<input type="range" v-model.number="debug.y" :max="10" :min="-10" step="0.5" />{{ debugText(debug.y) }}</span>
      <span>Z:<input type="range" v-model.number="debug.z" :max="10" :min="-10" step="0.5" />{{ debugText(debug.z) }}</span>
      <span>AngleX: <input type="range" v-model.number="debug.angleX" :max="180" :min="-180" />{{ debugText(debug.angleX) }}</span>
      <span>AngleY: <input type="range" v-model.number="debug.angleY" :max="180" :min="-180" />{{ debugText(debug.angleY) }}</span>
      <span>AngleZ: <input type="range" v-model.number="debug.angleZ" :max="180" :min="-180" />{{ debugText(debug.angleZ) }}</span>
    </details>
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
        <img :src="backgroundIcon">
        <span>{{ state.event.type }}</span>
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

.dices {
  gap: 1em;
  display: flex;
  justify-content: center;
  & img {
    width: 10%;
    border-radius: 10%;
  }
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
    animation: flip 1.2s 0.5s ease-in-out forwards;
    justify-content: center;
    align-items: center;
    background: #555;
    display: flex;

    img {
      image-rendering: pixelated;
      max-width: 60%;
      height: 60%;
    }

    span {
      text-shadow: none;
      position: absolute;
      font-size: 20vh;
      margin: 0.5em;
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

.debug {
  overflow: overlay;
  width: max-content;
  max-height: calc(100% - 1.2em);
  width: 16em;

  margin: .2em;
  top: 0;
  left: 0;
  text-align: left;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(1em);
  display: flex;
  flex-direction: column;
  gap: .2em;
  padding: .4em .6em;
  border-radius: .4em;
  & span {
    gap: 0.5em;
    display: flex;
    padding-left: 1em;
    justify-content: space-between;
    & > input {
      width: 100%;
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