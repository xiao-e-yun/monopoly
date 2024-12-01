import { nextTick, shallowReactive } from "vue";
import { useGameState } from "./state";
import { Player } from "./player";
import { useGameMap } from "./map";
import { useGameRender } from "./render";
import { useGameInputs } from "./input";
import { Position } from "./position";
import { shuffle } from "./utils";

export const useGame = () => gameInner;
const gameInner = shallowReactive(new class GameCore {
  ready = false;
  running = false;

  async setup() {
    console.info("初始化遊戲")
    const state = useGameState()
    const map = useGameMap()

    console.info("初始化玩家")
    const spawners = map.spawnPoints()


    const colors = [
      "#8650a6",
      "#56ae6c",
      "#b84c7d",
      "#ac9c3d",
      "#6881d8",
      "#ba543d"
    ]

    if (spawners.length < state.quantity)
      throw new Error('Not enough spawners')

    shuffle(spawners)
    let first: [number, number] | undefined = undefined
    for (let i = 0; i < state.quantity; i++) {
      const spawn = spawners.pop()!
      if (i === 0) first = spawn[0]
      const position = Position.from(spawn[0])
      const direction = spawn[1]
      const player = new Player(i + 1, 100, colors[i], position, direction)
      player.fixedDirection = true
      state.players.set(i, player)
    }

    const render = useGameRender()
    render.position.set(first![0], first![1])
  }

  async run() {
    const state = useGameState()
    const render = useGameRender()
    const inputs = useGameInputs()

    state.inning++
    console.group(`第 ${state.inning} 回合`)

    // loop all players
    const players = state.players
    for (const player of players.values()) {
      player.active = true

      const x = player.position.x
      const y = player.position.y
      render.position.set(x, y, player.position.distance(render.position) * 50)

      if (player.dizziness) {
        console.info(`玩家 ${player.id} 眩暈中`)
        state.messages.push(`玩家 ${player.id} 眩暈中`)
        await inputs.wait(1000)
        player.active = false
        player.dizziness--
        continue
      }


      state.steps = Math.floor(Math.random() * 5) + 1
      await inputs.wait(1500)

      for (; state.steps > 0; state.steps--) {

        // walk
        await player.walk()

        // 觸發陷阱
        const traps = state.traps
        for (const trap of traps) {
          const playerPosition = player.position
          const eqX = trap[0] === playerPosition.x
          const eqY = trap[1] === playerPosition.y
          if (!eqX || !eqY) continue
          await trap[2](player)
        }

        //確認是否對戰
        for (const other of players.values()) {
          if (player === other) continue

          if (player.position.equals(other.position)) await player.attack(other)

        }

      }

      state.steps = undefined

      // 觸發圖塊主效果
      await player.trigger()

      // 結束回合
      await inputs.wait(500)
      player.active = false
    }

    console.groupEnd()
    if (this.running) nextTick(() => this.run());
  }

  async init(quantity: number) {
    console.info("初始化狀態")
    this.ready = true;
    this.running = true;

    const state = useGameState()
    state.quantity = quantity;
    // window.onbeforeunload =  () => this.running || undefined;

    // wait canvas mounted
    nextTick(async () => {
      await this.setup();
      await this.run();
    })
  }

})

