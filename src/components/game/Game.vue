<script setup lang="ts">
import GameCanvas from "./Canvas.vue";
import GameInput from "./Input.vue";
import GameRanking from "./Ranking.vue";
// import GameMinimap from "./Minimap.vue";
import GamePopup from "./Popup.vue";

import { debug } from '../../game/debug';
</script>

<template>
  <div class="container"  @click.right.prevent="debug.enabled = !debug.enabled">
    <main>
      <GameCanvas />
      <GameInput />
    </main>
    <aside>
      <GameRanking />
      <!--<GameMinimap />-->
    </aside>
    <GamePopup />
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  height: 100vh;
}

main {
  flex: 1;
  position: relative;
}

aside {
  position: absolute;
  width: 200px;
  height: 100vh;
  // background: #333;
  display: flex;
  flex-direction: column;
  right: 0;
  pointer-events: none;
  z-index: 1;
}
</style>