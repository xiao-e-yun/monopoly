import Regl from "regl";

import { mat4, vec3, vec4 } from "gl-matrix"
import { GameMap, Tile, useGameMap } from "./map";
import { Position } from "./position";
import { useGameState } from "./state";
import { useGameLoader } from "./loader";
import { GameInputMove, useGameInputs } from "./input";
import { debug } from "./debug";

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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = Regl({
      pixelRatio: 1,
      canvas,
    });

    this.backgroundRender = new GameBackgroundRender(this);
    this.playersRender = new GamePlayerRender(this);

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

  draw(last: number = 0) {
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

type UpdateMapProps = {
  u_projection: mat4,
  u_texture: Regl.Texture2D,
}

type UndergroundAndSkyProps = {
  u_projection: mat4,
  u_color: vec4,
}

type BackgroundDrawOnSceneCommand = {
  u_projection: mat4,
  u_texture: Regl.Texture2D,
}
export class GameBackgroundRender {
  fbo: Regl.Framebuffer;
  width: number;
  height: number;
  changed = true;

  updateMapCommand: Regl.DrawCommand<Regl.DefaultContext, UpdateMapProps>;
  mapCommand: Regl.DrawCommand<Regl.DefaultContext, {}>;
  undergroundCommand: Regl.DrawCommand<Regl.DefaultContext, UndergroundAndSkyProps>;
  skyCommand: Regl.DrawCommand<Regl.DefaultContext, UndergroundAndSkyProps>;

  constructor(render: GameRender) {
    const ctx = render.ctx;

    const map = useGameMap();
    const width = (this.width = map.width) * GameMap.TILE_SIZE;
    const height = (this.height = map.height) * GameMap.TILE_SIZE;
    this.fbo = ctx.framebuffer({ width, height })

    // build update map command
    const updateMapProp = <T extends keyof UpdateMapProps>(name: T) => ctx.prop<UpdateMapProps, T>(name);
    this.updateMapCommand = ctx<UpdateMapProps, {}, UpdateMapProps>({
      vert: backgroundRenderVertex,
      frag: backgroundRenderFragment,
      framebuffer: this.fbo,
      uniforms: {
        u_projection: updateMapProp("u_projection"),
        u_texture: updateMapProp("u_texture"),
      },
      attributes: {
        a_position: ctx.buffer([
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]),
        a_uv: ctx.buffer([
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]),
      },
      elements: ctx.elements([
        [2, 1, 0],
        [0, 3, 2],
      ]),
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'src alpha',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha',
        },
      },
    })

    // build map command
    const mapProp = <T extends keyof UpdateMapProps>(name: T) => ctx.prop<UpdateMapProps, T>(name);
    this.mapCommand = ctx<BackgroundDrawOnSceneCommand, {}, BackgroundDrawOnSceneCommand>({
      vert: backgroundRenderVertex,
      frag: backgroundRenderFragment,
      uniforms: {
        u_projection: mapProp("u_projection"),
        u_texture: mapProp("u_texture"),
      },
      attributes: {
        a_position: ctx.buffer([
          [-1, 1],
          [1, 1],
          [1, -1],
          [-1, -1],
        ]),
        a_uv: ctx.buffer([
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]),
      },
      elements: ctx.elements([
        [2, 1, 0],
        [0, 3, 2],
      ]),
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'src alpha',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha',
        },
      },
    })

    const undergroundAndSkyProp = <T extends keyof UndergroundAndSkyProps>(name: T) => ctx.prop<UndergroundAndSkyProps, T>(name);
    // build underground command
    this.undergroundCommand = ctx<UndergroundAndSkyProps, {}, UndergroundAndSkyProps>({
      vert: undergroundRenderVertex,
      frag: undergroundRenderFragment,
      uniforms: {
        u_projection: undergroundAndSkyProp("u_projection"),
        u_color: vec4.fromValues(0.4609375, 0.640625, 0.2890625, 1),
      },
      attributes: {
        a_position: ctx.buffer([
          // top
          [-1, 1, -1],
          [1, 1, -1],
          [1, 1, 1],
          [-1, 1, 1],
          // front
          [-1, -1, 1],
          [1, -1, 1],
          [1, 1, 1],
          [-1, 1, 1],
          // left
          [-1, -1, -1],
          [-1, 1, -1],
          [-1, 1, 1],
          [-1, -1, 1],
          //right
          [1, -1, -1],
          [1, -1, 1],
          [1, 1, 1],
          [1, 1, -1],
        ]),
      },
      elements: ctx.elements([
        [2, 1, 0],
        [0, 3, 2],
        [6, 5, 4],
        [4, 7, 6],
        [10, 9, 8],
        [8, 11, 10],
        [14, 13, 12],
        [12, 15, 14],
      ]),
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'src alpha',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha',
        },
      },
    })

    // build sky command
    this.skyCommand = ctx<UndergroundAndSkyProps, {}, UndergroundAndSkyProps>({
      vert: skyRenderVertex,
      frag: skyRenderFragment,
      uniforms: {
        u_projection: undergroundAndSkyProp("u_projection"),
        u_color: vec4.fromValues(0.4921875, 0.8359375, 0.8515625, 1),
      },
      attributes: {
        a_position: ctx.buffer([
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]),
      },
      elements: ctx.elements([
        [2, 1, 0],
        [0, 3, 2],
      ]),
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'src alpha',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha',
        },
      },
    })
  }

  protected textures = new Map<Tile, Regl.Texture2D>();

  draw(render: GameRender, cameraMatrix: mat4) {
    const map = useGameMap();

    if (this.changed) {
      // clear
      const ctx = render.ctx
      ctx.clear({
        depth: 1,
        color: [0, 0, 0, 0],
        framebuffer: this.fbo,
      })

      // draw background
      const propList: UpdateMapProps[] = []
      for (const index in map.flatTiles) {
        const tile = map.flatTiles[index]
        let bitmap = this.textures.get(tile)
        if (bitmap === undefined) {
          const image = GameMap.tileBitmap(tile)
          if (!image) continue
          bitmap = ctx.texture(image)
          if (!bitmap) continue
          this.textures.set(tile, bitmap)
        }

        const projection = mat4.create();
        const [x, y] = map.indexFromFlat(parseInt(index))
        mat4.translate(projection, projection, [-1, 1, 0])
        mat4.scale(projection, projection, [1 / map.width, -1 / map.height, 0])
        mat4.translate(projection, projection, [x * 2 + 1, y * 2 + 1, 0])

        propList.push({
          u_projection: projection,
          u_texture: bitmap,
        })
      }

      this.updateMapCommand(propList)

      // do something else
      this.changed = false
    }

    const centerX = Math.floor(map.width / 2);
    const centerY = Math.floor(map.height / 2);

    const undergroundProjection = mat4.create();
    mat4.translate(undergroundProjection, cameraMatrix, [centerX, -0.01, centerY])
    mat4.scale(undergroundProjection, undergroundProjection, [map.width / 2 + 0.5, 5, map.height / 2 + 0.5])
    mat4.translate(undergroundProjection, undergroundProjection, [0, -1, 0])
    this.undergroundCommand({
      u_projection: undergroundProjection
    })



    const skyProjection = mat4.create();
    mat4.translate(skyProjection, cameraMatrix, [centerX, 25, centerY - 10])
    mat4.scale(skyProjection, skyProjection, [100, 100, 1])
    // mat4.rotateY(skyProjection, skyProjection, Math.PI)
    this.skyCommand({
      u_projection: skyProjection
    })

    // draw on scene
    const projection = mat4.create();
    mat4.translate(projection, cameraMatrix, [centerX, 0, centerY])
    mat4.rotateX(projection, projection, Math.PI / 2)
    mat4.scale(projection, projection, [this.width / 2, this.height / 2, 1])
    this.mapCommand({
      u_projection: projection,
      u_texture: this.fbo
    })

  }
}
const backgroundRenderVertex = `
precision mediump float;
attribute vec2 a_position;
attribute vec2 a_uv;

uniform mat4 u_projection;

varying vec2 uv;

void main() {
  uv = a_uv;
  gl_Position = u_projection * vec4(a_position, 0, 1);
}
`
const backgroundRenderFragment = `
precision mediump float;
uniform sampler2D u_texture;

varying vec2 uv;

void main() {
  gl_FragColor = texture2D(u_texture, uv);
}
`
const undergroundRenderVertex = `
precision mediump float;
attribute vec3 a_position;

uniform mat4 u_projection;

varying float height;
void main() {
  height = a_position.y;
  gl_Position = u_projection * vec4(a_position, 1);
}
`
const undergroundRenderFragment = `
precision mediump float;
uniform vec4 u_color;

varying float height;
void main() {
  gl_FragColor = u_color * height;
  if (height < 0.995) {
    gl_FragColor -= vec4(0.1, 0.1, 0.1, 0);
  }
}
`
const skyRenderVertex = `
precision mediump float;
attribute vec2 a_position;

uniform mat4 u_projection;

void main() {
  gl_Position = u_projection * vec4(a_position, 0, 1);
}
`
const skyRenderFragment = `
precision mediump float;
uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
`

type PlayerProps = {
  u_projection: mat4,
  u_texture: Regl.Texture2D,
}

type PlayerShadowCommand = {
  u_projection: mat4,
}
export class GamePlayerRender {
  drawPlayerCommand: Regl.DrawCommand<Regl.DefaultContext, PlayerProps>;
  drawPlayerShadowCommand: Regl.DrawCommand<Regl.DefaultContext, PlayerShadowCommand>;

  constructor(render: GameRender) {
    const ctx = render.ctx;

    // build player render command
    const playerProp = <T extends keyof PlayerProps>(name: T) => ctx.prop<PlayerProps, T>(name);
    this.drawPlayerCommand = ctx<PlayerProps, {}, PlayerProps>({
      vert: playerRenderVertex,
      frag: playerRenderFragment,
      uniforms: {
        u_projection: playerProp("u_projection"),
        u_texture: playerProp("u_texture"),
      },
      attributes: {
        a_position: ctx.buffer([
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]),
        a_uv: ctx.buffer([
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]),
      },
      elements: ctx.elements([
        [2, 1, 0],
        [0, 3, 2],
      ]),
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 1,
          dstRGB: 'one minus src alpha',
          dstAlpha: 1,
        },
        equation: {
          rgb: 'add', alpha: 'add'
        }
      },
    })

    const playerShadowProp = <T extends keyof PlayerShadowCommand>(name: T) => ctx.prop<PlayerShadowCommand, T>(name);
    this.drawPlayerShadowCommand = ctx<PlayerShadowCommand, {}, PlayerShadowCommand>({
      vert: playerRenderVertex,
      frag: playerShadowRenderFragment,
      uniforms: {
        u_projection: playerShadowProp("u_projection"),
      },
      attributes: {
        a_position: ctx.buffer([
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]),
        a_uv: ctx.buffer([
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]),
      },
      elements: ctx.elements([
        [2, 1, 0],
        [0, 3, 2],
      ]),
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 1,
          dstRGB: 'one minus src alpha',
          dstAlpha: 1,
        },
        equation: {
          rgb: 'add', alpha: 'add'
        }
      },
    })
  }

  protected playerTextures = new Map<number, Regl.Texture2D>();
  protected textures = new Map<string, Regl.Texture2D>();

  draw(render: GameRender, cameraMatrix: mat4, delta: number) {
    const map = useGameMap();
    const state = useGameState();
    const loader = useGameLoader()

    const getChunkStayOffset = (count: number) => ([
      [0, 0, 0],
      [0.2, 0, -0.2],
      [-0.2, 0, 0.2],
      [0.2, 0, 0.2],
      [-0.2, 0, -0.2],
    ][count] ?? [0, 0, 0]) as [number, number, number]

    // draw Players
    const playerPropList: PlayerProps[] = []
    const playerFxList: PlayerProps[] = []
    const playerShadowList: PlayerShadowCommand[] = []

    const playerLabelList: [string,[number,number]][] = []

    let dizziness = this.textures.get("dizziness")
    if (dizziness === undefined) {
      const image = loader.getTexture("dizziness")!
      dizziness = render.ctx.texture(image)
      if (dizziness) this.textures.set("dizziness", dizziness)
    }

    let arrow = this.textures.get("arrow")
    if (arrow === undefined) {
      const image = loader.getTexture("arrow")!
      arrow = render.ctx.texture(image)
      if (arrow) this.textures.set("arrow", arrow)
    }

    const chunkPeople = new Map<number, number>()
    for (const player of state.players.values()) {
      player.position.tick(delta)

      // 相同格子時計算位移
      const [x, y] = player.position.current

      const projection = mat4.clone(cameraMatrix);
      if (!player.position.transition) {
        const chunkIndex = map.indexFromPosition([player.position.x, player.position.y])
        const peopleCount = chunkPeople.get(chunkIndex) ?? 0;
        chunkPeople.set(chunkIndex, peopleCount + 1)
        mat4.translate(projection, projection, getChunkStayOffset(peopleCount))
      }

      let bitmap = this.playerTextures.get(player.id)
      if (bitmap === undefined) {
        const bitmapName = `player-${player.id}`;
        const image = loader.getTexture(bitmapName)!
        if (!image) continue
        bitmap = render.ctx.texture(image)
        if (!bitmap) continue
        this.playerTextures.set(player.id, bitmap)
      }
      const aspect = bitmap.height / bitmap.width

      // const status = player.status()
      mat4.translate(projection, projection, [x, 0, y])

      // player
      const playerProjection = mat4.clone(projection)
      const height = 0.4 * aspect
      mat4.translate(playerProjection, playerProjection, [0, height, 0])
      mat4.scale(playerProjection, playerProjection, [0.4, -height, 1])

      playerPropList.push({
        u_projection: playerProjection,
        u_texture: bitmap,
      })

      // dizziness
      if (dizziness && player.dizziness) {
        const dizzinessProjection = mat4.clone(projection)
        mat4.translate(dizzinessProjection, dizzinessProjection, [0, 2 * height, 0.1])
        mat4.scale(dizzinessProjection, dizzinessProjection, [0.25, -0.25, 1])

        playerFxList.push({
          u_projection: dizzinessProjection,
          u_texture: dizziness,
        })
      }

      // arrow
      if (arrow) {
        let directions = [player.direction]
        if (player.active) {
          const accepts = useGameInputs().move.accept
          if (accepts.length) directions = accepts
        };
        for (const direction of directions) {
          const rotate = ({
            [GameInputMove.UP]: 0,
            [GameInputMove.RIGHT]: 1,
            [GameInputMove.DOWN]: 2,
            [GameInputMove.LEFT]: 3,
          })[direction];

          const arrowProjection = mat4.clone(projection)

          const offsetX = Math.sin(rotate * Math.PI / 2) * 0.5
          const offsetY = -Math.cos(rotate * Math.PI / 2) * 0.5
          mat4.translate(arrowProjection, arrowProjection, [offsetX, 0.1, offsetY])

          mat4.scale(arrowProjection, arrowProjection, [0.25, 1, 0.25])
          mat4.rotateX(arrowProjection, arrowProjection, Math.PI / 2)
          mat4.rotateZ(arrowProjection, arrowProjection, rotate * Math.PI / 2)


          playerFxList.push({
            u_projection: arrowProjection,
            u_texture: arrow,
          })
        }
      }

      // shadow
      const shadowProjection = mat4.clone(projection)
      mat4.translate(shadowProjection, shadowProjection, [0, 0.01, 0])
      mat4.rotateX(shadowProjection, shadowProjection, Math.PI / 2)
      mat4.scale(shadowProjection, shadowProjection, [0.4, 0.2, 1])
      playerShadowList.push({
        u_projection: shadowProjection,
      })

      // add label
      const labelPosition = render.projectPoint([x, 2 * height, y], cameraMatrix)
      const label = `${player.id}`
      playerLabelList.push([label,labelPosition])
    }

    this.drawPlayerCommand(playerPropList)
    this.drawPlayerShadowCommand(playerShadowList)
    this.drawPlayerCommand(playerFxList)

    // replace with label
    state.playersLabel = playerLabelList
  }

}
const playerRenderVertex = `
precision mediump float;
attribute vec2 a_position;
attribute vec2 a_uv;

uniform mat4 u_projection;

varying vec2 uv;

void main() {
  uv = a_uv;
  gl_Position = u_projection * vec4(a_position, 0, 1);
}
`
const playerRenderFragment = `
precision mediump float;
uniform sampler2D u_texture;

varying vec2 uv;

void main() {
  vec4 color = texture2D(u_texture, uv);
  if (color.a < 0.1) discard;
  gl_FragColor = color;
}
`
const playerShadowRenderFragment = `
precision mediump float;

varying vec2 uv;

void main() {
  float distance_to_center = distance(uv, vec2(0.5));
  if (distance_to_center > 0.5) discard;
  gl_FragColor = vec4(0.1, 0.1, 0.1, 0.8);
}
`