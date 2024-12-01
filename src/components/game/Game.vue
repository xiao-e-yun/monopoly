<script setup lang="ts">
import GameCanvas from "./Canvas.vue";
import GameInput from "./Input.vue";
import GameRanking from "./Ranking.vue";
import GameMinimap from "./Minimap.vue";
import GamePopup from "./Popup.vue";


</script>

<template>
  <div class="container">
    <main>
      <GameCanvas />
      <GameInput />
      <GamePopup />
    </main>
    <aside>
      <GameRanking />
      <GameMinimap />
    </aside>
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
  width: 200px;
  height: 100vh;
  background: #333;
  display: flex;
  flex-direction: column;
}
</style>