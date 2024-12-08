import Regl from "regl";
import { GameRender } from ".";
import { useGameMap } from "../map";
import { mat4 } from "gl-matrix";
import { GameInputMove, useGameInputs } from "../input";
import { useGameState } from "../state";
import { useGameLoader } from "../loader";

//================================================================
// Render
//================================================================
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

    const playerLabelList: [string, [number, number]][] = []

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
      playerLabelList.push([label, labelPosition])
    }

    this.drawPlayerCommand(playerPropList)
    this.drawPlayerShadowCommand(playerShadowList)
    this.drawPlayerCommand(playerFxList)

    // replace with label
    state.playersLabel = playerLabelList
  }

}

//================================================================
// Props
//================================================================
type PlayerProps = {
  u_projection: mat4,
  u_texture: Regl.Texture2D,
}

type PlayerShadowCommand = {
  u_projection: mat4,
}

//================================================================
// Shader
//================================================================
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