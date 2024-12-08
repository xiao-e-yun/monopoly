import Regl from "regl";
import { GameRender, useGameRender } from ".";
import { mat4, vec2 } from "gl-matrix";
import { useGameLoader } from "../loader";
import { useGameFx } from "../fx";

//================================================================
// Render
//================================================================
export class GameFxRender {
  damagedCommand: Regl.DrawCommand<Regl.DefaultContext, DamagedProps>;

  constructor(render: GameRender) {
    const ctx = render.ctx;

    // build player render command
    const playerProp = <T extends keyof DamagedProps>(name: T) => ctx.prop<DamagedProps, T>(name);
    this.damagedCommand = ctx<DamagedProps, {}, DamagedProps>({
      vert: damagedVertex,
      frag: damagedFragment,
      uniforms: {
        u_projection: playerProp("u_projection"),
        u_direction: playerProp("u_direction"),
        u_texture: playerProp("u_texture"),
        u_time: playerProp("u_time"),
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

  protected textures = new Map<string, Regl.Texture2D>();

  draw(_render: GameRender, cameraMatrix: mat4, delta: number) {
    const fx = useGameFx();

    // draw damaged props
    const damagedPropList: DamagedProps[] = []
    for (const value of fx.inner.values()) {
      if (fx.check("damaged",value)) {
        value.time += delta;
  
        const u_texture = this.getTexture("fx-damaged")
        if (!u_texture) continue
  
        const [x, y] = value.position;
        const u_projection = mat4.create();
        mat4.translate(u_projection, cameraMatrix, [x, 0.5, y + 0.1]);
        mat4.scale(u_projection, u_projection, [0.2, -0.2, 1]);
        damagedPropList.push({
          u_time: value.time,
          u_direction: value.direction,
          u_projection,
          u_texture
        })
      }
    }

    this.damagedCommand(damagedPropList)
  }

  getTexture(name: string) {
    let texture = this.textures.get(name)
    if (texture === undefined) {
      const image = useGameLoader().getTexture(name)!
      texture = useGameRender().ctx.texture(image)
      if (!texture) return
      this.textures.set(name, texture)
    }
    return texture
  }

}

//================================================================
// Props
//================================================================
type DamagedProps = {
  u_projection: mat4,
  u_texture: Regl.Texture2D,
  u_direction: vec2,
  u_time: number,
}

//================================================================
// Shader
//================================================================
const damagedVertex = `
precision mediump float;
attribute vec2 a_position;
attribute vec2 a_uv;

uniform mat4 u_projection;
uniform vec2 u_direction;
uniform float u_time;

varying vec2 uv;

void main() {
  uv = a_uv;
  vec2 move = u_direction * u_time / 800.0 * 2.0;
  gl_Position = u_projection * vec4(a_position - move, 0, 1);
}
`
const damagedFragment = `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_time;

varying vec2 uv;

void main() {
  float t = u_time / 800.0;
  vec4 color = texture2D(u_texture, uv);
  gl_FragColor = vec4(color.rgb, color.a * (1.0 - t));
}
`