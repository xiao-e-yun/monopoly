import Regl from "regl";

import { debug } from "../debug";
import { Position } from "../position";
import { GamePlayerRender } from "./player";
import { mat4, vec3, vec4 } from "gl-matrix";
import { GameBackgroundRender } from "./background";
import { GameFxRender } from "./fx";

export const useGameRender = () => gameRenderInner!;
export const bindGameRender = (canvas: HTMLCanvasElement) => gameRenderInner = new GameRender(canvas)
  ;
let gameRenderInner: GameRender | undefined = undefined;

export class GameRender {
  canvas: HTMLCanvasElement;
  ctx: Regl.Regl;
  viewport = 600;
  paused = true;
  position = new Position(0, 0);

  aspect = NaN
  width = NaN
  height = NaN

  backgroundRender: GameBackgroundRender;
  playersRender: GamePlayerRender;
  fxRender: GameFxRender;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = Regl({
      pixelRatio: 1,
      canvas,
    });

    this.backgroundRender = new GameBackgroundRender(this);
    this.playersRender = new GamePlayerRender(this);
    this.fxRender = new GameFxRender(this);

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
  }


  start() {
    const wasPaused = this.paused
    this.paused = false
    if (wasPaused) this.draw()
  }

  stop() {
    this.paused = true
  }

  draw(last: number = Date.now()) {
    if (this.paused) return


    const now = Date.now();
    const delta = now - last;
    this.position.tick(delta);
    const skip = delta <= 1000 / 60
    requestAnimationFrame(() => this.draw(skip ? last : now))

    if (skip) return;

    this.ctx.poll();
    this.clear();

    const zNear = 1;
    const zFar = 10000;
    const projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 3, this.aspect, zNear, zFar);

    const cameraMatrix = mat4.create();

    const distance = 5;
    const radian = 30 * Math.PI / 180;
    const cameraHeight = distance * Math.sin(radian);
    const cameraDistance = distance * Math.cos(radian);
    const defaultPlayerHeight = 0.8;

    const [x, y] = this.position.current;
    mat4.translate(cameraMatrix, cameraMatrix, [debug.x + x, debug.y + defaultPlayerHeight + cameraHeight, debug.z + y + cameraDistance])
    mat4.rotateX(cameraMatrix, cameraMatrix, debug.angleX * Math.PI / 180 - radian)
    mat4.rotateY(cameraMatrix, cameraMatrix, debug.angleY * Math.PI / 180)
    mat4.rotateZ(cameraMatrix, cameraMatrix, debug.angleZ * Math.PI / 180)
    const viewMatrix = mat4.invert(mat4.create(), cameraMatrix);

    const viewProjectionMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);

    this.backgroundRender.draw(this, viewProjectionMatrix)
    this.playersRender.draw(this, viewProjectionMatrix, delta)
    this.fxRender.draw(this, viewProjectionMatrix, delta)
  }

  clear() {
    this.ctx.clear({
      color: [0, 0, 0, 1],
      depth: 1
    });
  }

  resize() {
    let { width, height } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    this.canvas.height = height * dpr;
    this.canvas.width = width * dpr;
    this.aspect = width / height;
    this.height = height;
    this.width = width;
  }

  projectPoint(point: vec3, viewProjectionMatrix: mat4) {
    const vec4Point = vec4.fromValues(point[0], point[1], point[2], 1);
    const clipSpacePoint = vec4.transformMat4(vec4.create(), vec4Point, viewProjectionMatrix);
    return [
      (clipSpacePoint[0] / clipSpacePoint[3] + 1) * 0.5 * this.width,
      (1 - clipSpacePoint[1] / clipSpacePoint[3]) * 0.5 * this.height,
    ] as [number, number]
  }
}