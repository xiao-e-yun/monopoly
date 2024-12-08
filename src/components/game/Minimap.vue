<script setup lang="ts">
import { useTemplateRef, watch, computed } from 'vue';
import { useGameState } from '../../game/state';
import { GameMap, useGameMap } from '../../game/map';
import { debug } from '../../game/debug';

const map = useGameMap();

let background: ImageBitmap | null = null;
let context: CanvasRenderingContext2D | null = null;
const canvas = useTemplateRef('canvas');
watch(canvas, (canvas) => {
  context = null;
  if (!canvas) return;
  context = canvas.getContext("2d")!;

  // resize
  resize(canvas, context);
  window.addEventListener("resize", resize.bind(null, canvas, context));

  function resize(el: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    let { width, height } = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaledWidth = el.width = width * dpr;
    const scaledHeight = el.height = height * dpr;

    // to clip position
    const transformWidth = scaledWidth / map.width;
    const transformHeight = scaledHeight / map.height;

    context.setTransform(transformWidth, 0, 0, transformHeight, 0, 0);

    // offscreen canvas
    const offscreenCanvas = new OffscreenCanvas(scaledWidth, scaledHeight);
    const offscreenContext = offscreenCanvas.getContext("2d")!;
    offscreenContext.setTransform(transformWidth, 0, 0, transformHeight, 0, 0);

    for (const [index, tile] of map.flatTiles.entries()) {
      const [x, y] = map.indexFromFlat(index);
      const image = GameMap.tileBitmap(tile);

      if (!image) continue;
      offscreenContext.drawImage(image, 0, 0, image.width, image.height, x, y, 1, 1);
    }
    background = offscreenCanvas.transferToImageBitmap();

    // update
    updateMinimap();
  }
});

const state = useGameState();
watch(state, () => requestAnimationFrame(updateMinimap));

const aspectRatio = computed(() => map.width / map.height);

let lastTime = NaN;
function updateMinimap(time: number = 0) {
  if (!context) return;
  
  if (time === lastTime) return;
  lastTime = time;

  const mapWidth = map.width;
  const mapHeight = map.height;
  context.clearRect(0, 0, mapWidth, mapHeight);
  context.drawImage(background!, 0, 0, mapWidth, mapHeight);

  context.font = `0.8px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "hanging";

  for (const player of state.players.values()) {
    const playerPosition = player.position;

    const x = playerPosition.current[0] + 0.1;
    const y = playerPosition.current[1] + 0.1;
    const color = player.color;

    // draw player block
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(x, y, 0.8, 0.8, 0.1);
    context.fill();

    // draw player id
    context.fillStyle = "#fff";
    context.fillText(player.id.toString(), x + 0.4, y + 0.1);
  }
}
</script>

<template>
  <canvas class="minimap" ref="canvas" :style="{ aspectRatio }" @click.right.prevent="debug.enabled = !debug.enabled" />
</template>

<style lang="scss" scoped>
.minimap {
  width: 100%;
  display: block;
  background: #111;
}
</style>