import { reactive } from "vue";

export const debug = reactive({
  // base
  enabled: false,
  // render
  x: 0,
  y: 0,
  z: 0,
  angleX: 0,
  angleY: 0,
  angleZ: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
})