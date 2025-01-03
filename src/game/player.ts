import { useGame } from ".";
import { randomDestiny, randomOpportunity, randomPunishment, randomTask } from "../config";
import { useGameFx } from "./fx";
import { GameInputMove, useGameInputs } from "./input";
import { GameMap, Tile, useGameMap } from "./map";
import { Position } from "./position";
import { useGameRender } from "./render";
import { useGameState } from "./state";
import { shuffle } from "./utils";

export const DEFAULT_PLAYER_HEALTH = 6
export const PLUNDER_RATIO = 0.4
export class Player {

  active = false
  health = DEFAULT_PLAYER_HEALTH
  dizziness = 0
  fixedDirection = true
  doubleDice = 0
  fixedDices: number[] = []
  immune = 0
  doubleTaskScore = 0
  doubleDamage = 0

  constructor(
    public id: number,
    public name: string,
    public score: number,
    public color: string,
    public position: Position,
    public direction: GameInputMove,
  ) {

  }

  async walk() {
    const map = useGameMap()

    const accepts = map.nextPosition([this.position.x, this.position.y], this.direction)
    if (accepts.size === 0) throw new Error('No moves available')

    const inputs = useGameInputs()
    if (!this.fixedDirection) {
      this.direction = accepts.size === 1 ?
        accepts.keys().next().value! :
        await inputs.move.input("選擇方向", Array.from(accepts.keys()))
    } else {
      this.fixedDirection = false
    }

    const position = accepts.get(this.direction)!
    this.position.set(this.position.x + position[0], this.position.y + position[1], 200)

    const render = useGameRender()
    render.position = this.position.clone()

    await inputs.wait(200)
  }

  async trigger(tile?: Tile) {

    const map = useGameMap()
    const state = useGameState()
    tile ??= map.getTile(this.position.x, this.position.y)

    console.group(`${this.name} 抵達 ${GameMap.tileText(tile)}`)
    const callback = ({
      [Tile.Spawner]: async () => {
        console.log(`獲得 50 分`)
        state.messages.push(`${this.name} 獲得 50 分`)
        this.score += 50

        const victoryScore = state.victoryScore
        if (victoryScore <= this.score) {
          console.log(`獲勝`)
          state.messages.push(`${this.name} 獲勝`)
          state.winner = this
          useGame().running = false
        }
      },

      [Tile.Task]: async () => {
        const task = randomTask()
        console.log(`獲得任務 ${task[0]}`)
        state.messages.push(`${this.name} 獲得任務 ${task[0]}`)
        await state.setEvent(this, "任務", task, true)
      },

      [Tile.Opportunity]: async () => {
        const opportunity = randomOpportunity()
        console.log(`獲得機會 ${opportunity[0]}`)
        state.messages.push(`${this.name} 獲得機會 ${opportunity[0]}`)
        await state.setEvent(this, "機會", opportunity)
      },

      [Tile.Destiny]: async () => {
        const destiny = randomDestiny()
        console.log(`獲得命運 ${destiny[0]}`)
        state.messages.push(`${this.name} 獲得命運 ${destiny[0]}`)
        await state.setEvent(this, "命運", destiny)
      },

      [Tile.Punishment]: async () => {
        const punishment = randomPunishment()
        console.log(`獲得懲罰 ${punishment[0]}`)
        state.messages.push(`${this.name} 獲得懲罰 ${punishment[0]}`)
        await state.setEvent(this, "懲罰", punishment)
      },

      [Tile.Teleport]: async () => {
        const inputs = useGameInputs()
        if (!await inputs.confirm.input("是否傳送")) return

        const teleports = map.teleports.filter(teleport => teleport[0] !== this.position.x && teleport[1] !== this.position.y)
        shuffle(teleports)
        const teleport = teleports.pop()!

        console.log(`傳送至 ${teleport}`)
        state.messages.push(`${this.name} 傳送至 ${teleport}`)

        await this.teleport(teleport)
        await inputs.wait(500)
      },

      [Tile.Prison]: async () => {
        console.log(`被關 1 回合`)
        state.messages.push(`${this.name} 被關 1 回合`)
        this.dizziness++
      },

      [Tile.Hospital]: async () => {
        console.log(`被治療 1 回合`)
        state.messages.push(`${this.name} 被治療 1 回合`)
        this.health = DEFAULT_PLAYER_HEALTH
        this.dizziness++
      },

      // unreachable
      [Tile.Empty]() { throw new Error("Unreachable") }
    })[tile]
    await callback()

    console.groupEnd()
  }

  async attack(other: Player, force = false) {
    const map = useGameMap()
    const state = useGameState()

    if (map.getTile(this.position.x, this.position.y) === Tile.Hospital) {
      console.log(`${other.name} 在醫院，無法攻擊`)
      state.messages.push(`${other.name} 在醫院，無法攻擊`)
      return
    }

    if (other.immune) {
      console.log(`${other.name} 處於無敵狀態`)
      state.messages.push(`${other.name} 處於無敵狀態`)
      return
    }

    const inputs = useGameInputs();
    if (!force && !await inputs.confirm.input(`是否攻擊${other.name}`)) {
      console.log(`${this.name} 放棄攻擊`)
      state.messages.push(`${this.name} 放棄攻擊`)
      return
    }

    console.group(`${this.name} 與${other.name} 對戰`)
    let plunder = await this.throwDice(`對 ${ other.name } 進行攻擊`)
    if (this.doubleDamage) {
      this.doubleDamage--
      plunder *= 2
    }

    await other.damage(plunder, this)

    console.groupEnd()
  }

  async damage(damage: number, player?: Player) {
    console.log(`${this.name} 受到 ${damage} 點傷害`)
    const state = useGameState()
    state.messages.push(`${this.name} 受到 ${damage} 點傷害`)
    this.health -= damage;

    // fx
    const fx = useGameFx()
    let [x, y] = this.position.current

    // const dur = fx.sound("fx-damaged")
    for (let index = 0; index < damage; index++) {
      const radian = Math.random() * Math.PI * 2

      fx.effect({
        name: "damaged",
        position: [x, y],
        direction: [Math.sin(radian), Math.cos(radian)],
        time: 0,
      }, 800)
    }

    // check if player is dead
    if (this.health > 0) {
      await useGameInputs().wait(1000)
      return;
    }

    console.log(`${this.name} 被擊倒`)
    state.messages.push(`${this.name} 被擊倒`)

    this.health = DEFAULT_PLAYER_HEALTH
    this.dizziness = 1

    if (player) {
      const plunderScore = Math.floor(this.score * PLUNDER_RATIO)

      console.log(`${player.id} 獲得 ${plunderScore} 分`)
      state.messages.push(`${player.id} 掠奪了 ${plunderScore} 分`)

      this.score -= plunderScore
      player.score += plunderScore
    } else {
      const loss = Math.floor(this.score * 0.2)
      console.log(`${this.name} 掉落 ${loss} 分`)
      state.messages.push(`${this.name} 掉落了 ${loss} 分`)
      this.score -= loss
    }

    await useGameInputs().wait(1000)
  }

  async teleport(position: [number, number]) {
    const map = useGameMap()
    const camera = this.active
    this.position.set(position[0], position[1], 200)
    if (camera) useGameRender().position = this.position.clone()

    const directions = Array.from(map.nextPosition([position[0], position[1]]).keys())
    shuffle(directions)

    this.direction = directions.pop()!
    this.fixedDirection = true
    if (camera) await useGameInputs().wait(200)
  }

  async throwDice(text: string) {
    const state = useGameState()
    const dice = await state.throwDice(text, !!this.doubleDice, this.fixedDices)
    this.doubleDice = Math.max(0, this.doubleDice - 1)
    return dice
  }

  reverseDirection() {
    this.direction = ({
      [GameInputMove.UP]: GameInputMove.DOWN,
      [GameInputMove.RIGHT]: GameInputMove.LEFT,
      [GameInputMove.DOWN]: GameInputMove.UP,
      [GameInputMove.LEFT]: GameInputMove.RIGHT,
    })[this.direction]
  }

  teleportPosition(position: Position) {
    return this.teleport([position.x, position.y])
  }

  status() {
    if (this.dizziness) return PlayerStatus.Dizziness
    return PlayerStatus.Normal
  }
}

export enum PlayerStatus {
  Normal = "normal",
  Dizziness = "dizziness",
}