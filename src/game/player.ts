import { useGame } from ".";
import { randomDestiny, randomOpportunity, randomPunishment, randomTask } from "../config";
import { GameInputMove, useGameInputs } from "./input";
import { GameMap, Tile, useGameMap } from "./map";
import { Position } from "./position";
import { useGameRender } from "./render";
import { useGameState } from "./state";
import { shuffle } from "./utils";

export const DEFAULT_PLAYER_HEALTH = 6
export class Player {

  active = false
  health = DEFAULT_PLAYER_HEALTH
  dizziness = 0
  fixedDirection = false

  constructor(
    public id: number,
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

  async trigger() {

    const map = useGameMap()
    const state = useGameState()
    const tile = map.getTile(this.position.x, this.position.y)

    console.group(`玩家 ${this.id} 抵達 ${GameMap.tileText(tile)}`)
    const callback = ({
      [Tile.Spawner]: async () => {
        console.log(`獲得 50 分`)
        state.messages.push(`玩家 ${this.id} 獲得 50 分`)
        this.score += 50

        const victoryScore = state.victoryScore
        if (victoryScore <= this.score) {
          console.log(`獲勝`)
          state.messages.push(`玩家 ${this.id} 獲勝`)
          state.winner = this
          useGame().running = false
        }
      },

      [Tile.Task]: async () => {
        const task = randomTask()
        console.log(`獲得任務 ${task[0]}`)
        state.messages.push(`玩家 ${this.id} 獲得任務 ${task[0]}`)
        await state.setEvent(this, "任務", task, true)
      },

      [Tile.Opportunity]: async () => {
        const opportunity = randomOpportunity()
        console.log(`獲得機會 ${opportunity[0]}`)
        state.messages.push(`玩家 ${this.id} 獲得機會 ${opportunity[0]}`)
        await state.setEvent(this, "機會", opportunity)
      },

      [Tile.Destiny]: async () => {
        const destiny = randomDestiny()
        console.log(`獲得命運 ${destiny[0]}`)
        state.messages.push(`玩家 ${this.id} 獲得命運 ${destiny[0]}`)
        await state.setEvent(this, "命運", destiny)
      },

      [Tile.Punishment]: async () => {
        const punishment = randomPunishment()
        console.log(`獲得懲罰 ${punishment[0]}`)
        state.messages.push(`玩家 ${this.id} 獲得懲罰 ${punishment[0]}`)
        await state.setEvent(this, "懲罰", punishment)
      },

      [Tile.Teleport]: async () => {
        const inputs = useGameInputs()
        if (!await inputs.confirm.input("是否傳送")) return

        const teleports = map.teleports.filter(teleport => teleport[0] !== this.position.x && teleport[1] !== this.position.y)
        shuffle(teleports)

        const teleport = teleports.pop()!
        this.position.set(teleport[0], teleport[1], 200)
        console.log(`傳送至 ${teleport}`)
        state.messages.push(`玩家 ${this.id} 傳送至 ${teleport}`)

        const directions = Array.from(map.nextPosition([teleport[0], teleport[1]]).keys())
        shuffle(directions)

        this.direction = directions.pop()!
        this.fixedDirection = true
        
        useGameRender().position = this.position.clone()
        await inputs.wait(500)
      },

      [Tile.Prison]: async () => {
        console.log(`被關 1 回合`)
        state.messages.push(`玩家 ${this.id} 被關 1 回合`)
        this.dizziness++
      },

      [Tile.Hospital]: async () => {
        console.log(`被治療 1 回合`)
        state.messages.push(`玩家 ${this.id} 被治療 1 回合`)
        this.health = DEFAULT_PLAYER_HEALTH
        this.dizziness++
      },

      // unreachable
      [Tile.Empty]() { throw new Error("Unreachable") }
    })[tile]
    await callback()

    console.groupEnd()
  }

  async attack(other: Player) {
    const map = useGameMap()
    const state = useGameState()

    if (map.getTile(this.position.x, this.position.y) === Tile.Hospital) {
      console.log(`玩家 ${this.id} 在醫院，無法攻擊`)
      state.messages.push(`玩家 ${this.id} 在醫院，無法攻擊`)
      return
    }

    console.group(`玩家 ${this.id} 與玩家 ${other.id} 對戰`)
    const plunder = Math.floor(Math.random() * 5) + 1
    state.plunder = plunder
    const inputs = useGameInputs();
    await inputs.next.input("進行攻擊")
    state.plunder = 0

    other.health -= plunder
    console.log(`造成 ${plunder} 點傷害，剩餘 ${other.health} 點血量`)

    if (other.health <= 0) {
      console.log(`玩家 ${other.id} 被擊敗`)
      const plunderRatio = 0.6
      const plunderScore = Math.floor(other.score * plunderRatio)

      console.log(`玩家 ${this.id} 獲得 ${plunderScore} 分`)
      other.score -= plunderScore
      this.score += plunderScore

      console.log(`玩家 ${other.id} 重生 (回復至 ${DEFAULT_PLAYER_HEALTH} 點血量)`)
      other.health = DEFAULT_PLAYER_HEALTH
      console.log(`玩家 ${other.id} 眩暈 1 回合`)
      other.dizziness = 1

      await inputs.wait(500)
    }

    console.groupEnd()
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