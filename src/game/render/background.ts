import Regl from "regl";
import { GameRender } from ".";
import { GameMap, Tile, useGameMap } from "../map";
import { mat4, vec4 } from "gl-matrix";

//================================================================
// Render
//================================================================
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

//================================================================
// Props
//================================================================
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

//================================================================
// Shaders
//================================================================
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