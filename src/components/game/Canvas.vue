<script setup lang="ts">
import { useTemplateRef, watch } from 'vue';
import { bindGameRender, useGameRender } from '../../game/render2';

const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
watch(canvas, (canvas) => {
  const render = useGameRender()
  if (render) render.stop() // stop previous render
  if (canvas) bindGameRender(canvas)
});


</script>

<template>
  <canvas class="canvas" ref="canvas" />
  <!-- <div style="background: #000; position: absolute; top: 50%; left: 50%; width: 5px; height: 5px;" /> -->
</template>

<style lang="scss" scoped>
.canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>