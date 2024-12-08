import { useGame } from ".";
import { randomDestiny, randomOpportunity, randomPunishment, randomTask } from "../config";
import { useGameFx } from "./fx";
import { GameInputMove, useGameInputs } from "./input";
import { GameMap, Tile, useGameMap } from "./map";
import { Position } from "./position";
import { useGameRender } from "./render2";
import { useGameState } from "./state";
import { getRandomSubset, poissonDiskSampling, shuffle } from "./utils";

export const DEFAULT_PLAYER_HEALTH = 6
export const PLUNDER_RATIO = 0.6
export class Player {

  active = false
  health = DEFAULT_PLAYER_HEALTH
  dizziness = 0
  fixedDirection = true
  doubleStep = 0

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

  async trigger(tile?: Tile) {

    const map = useGameMap()
    const state = useGameState()
    tile ??= map.getTile(this.position.x, this.position.y)

    console.group(`玩家 ${this.id} 抵達 ${GameMap.tileText(tile)}`)
    const callback = ({
      [Tile.Spawner]: async () => {
        console.log(`獲得 100 分`)
        state.messages.push(`玩家 ${this.id} 獲得 100 分`)
        this.score += 100

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

        console.log(`傳送至 ${teleport}`)
        state.messages.push(`玩家 ${this.id} 傳送至 ${teleport}`)
        
        await this.teleport(teleport)
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

  async attack(other: Player, force = false) {
    const map = useGameMap()
    const state = useGameState()

    if (map.getTile(this.position.x, this.position.y) === Tile.Hospital) {
      console.log(`玩家 ${this.id} 在醫院，無法攻擊`)
      state.messages.push(`玩家 ${this.id} 在醫院，無法攻擊`)
      return
    }

    const inputs = useGameInputs();
    if (!force && !await inputs.confirm.input(`是否攻擊玩家 ${other.id}`)) {
      console.log(`玩家 ${this.id} 放棄攻擊`)
      state.messages.push(`玩家 ${this.id} 放棄攻擊`)
      return
    }

    console.group(`玩家 ${this.id} 與玩家 ${other.id} 對戰`)
    const plunder = Math.floor(Math.random() * 6) + 1
    state.plunder = {
      target: other.id,
      damage: plunder,
    }

    await inputs.next.input("進行攻擊")
    state.plunder = undefined
    await other.damage(plunder, this)

    console.groupEnd()
  }

  async damage(damage: number, player?: Player) {
    console.log(`玩家 ${this.id} 受到 ${damage} 點傷害`)
    const state = useGameState()
    state.messages.push(`玩家 ${this.id} 受到 ${damage} 點傷害`)
    this.health -= damage;

    // fx
    const fx = useGameFx()
    let [x, y] = this.position.current
    const size = [0.2, 0.2] as [number, number]
    x = x + 0.5 - 0.1, y = y + 0.5 - 0.1
    
    const points = poissonDiskSampling(1,1,0.4)
    const selectedPoints = getRandomSubset(points, damage);
    // const dur = fx.sound("fx-damaged")
    for (const [offsetX,offsetY] of selectedPoints) {
      const realX = x + offsetX - 0.5
      const realY = y + offsetY - 0.5
      fx.effect("fx-damaged", [realX, realY], size, 800)
    }

    // check if player is dead
    if (this.health > 0) {
      await useGameInputs().wait(1000)
      return;
    }
    
    console.log(`玩家 ${this.id} 被擊倒`)
    state.messages.push(`玩家 ${this.id} 被擊倒`)
    
    this.health = DEFAULT_PLAYER_HEALTH
    this.dizziness = 1
    
    if (player) {
      const plunderScore = Math.floor(this.score * PLUNDER_RATIO)
      
      console.log(`玩家 ${player.id} 獲得 ${plunderScore} 分`)
      state.messages.push(`玩家 ${player.id} 掠奪了 ${plunderScore} 分`)
      
      this.score -= plunderScore
      player.score += plunderScore
    } else {
      const loss = Math.floor(this.score * 0.2)
      console.log(`玩家 ${this.id} 掉落 ${loss} 分`)
      state.messages.push(`玩家 ${this.id} 掉落了 ${loss} 分`)
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