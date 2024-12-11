import { reactive } from "vue";
import { Player } from "./player";
import { useGameInputs } from "./input";

export const useGameState = () => stateInner;
const stateInner = reactive(new class GameState {
  players = new Map<number, Player>();

  dices: [number,number] | [number] | undefined = undefined;

  steps: number | undefined = undefined;
  inning = 0;
  winner: Player | undefined = undefined;

  // game settings
  victoryScore = 1000;
  quantity = 0;

  messages = new class Messages {
    inner = new Map<number, string>()
    counter = 0;
    push(message: string, keep = 5000) {
      const counter = this.counter++
      this.inner.set(counter, message)
      if (keep !== 0) setTimeout(() => this.inner.delete(counter), keep)
      return counter
    }
    remove(counter: number) {
      this.inner.delete(counter)
    }
    length() {
      return this.inner.size
    }
    toArray() {
      return Array.from(this.inner.values())
    }
  };

  playersLabel: [string, [number, number]][] = [];

  event: {
    type: string;
    title: string;
    hasFail: boolean;
    description: string;
    callback: (success: boolean) => Promise<void>;
  } | undefined = undefined
  setEvent(player: Player, type: string, event: [string, string, (player: Player, success: boolean) => Promise<void>], hasFail = false) {
    return new Promise<void>((resolve) => {
      const [title, description, action] = event
      this.event = {
        type,
        title,
        hasFail,
        description: description.trim().replaceAll("\n", "<br>"),
        callback: async (success: boolean) => {
          this.event = undefined
          await action(player, success)
          resolve()
        }
      }
    })
  }

  traps: [number, number, (player: Player) => Promise<void>][] = []

  withoutPlayer(player: Player) {
    return Array.from(this.players.values()).filter(p => p !== player)
  }

  async throwDice(text: string,doubles = false, fixedDice?: number[]) {
    const input = useGameInputs()

    const amount = doubles ? 2 : 1
    const duration = 1500
    const refresh = 15

    for (let index = 0; index < refresh; index++) {
      this.dices = Array.from({ length: amount }, () => Math.floor(Math.random() * 6) + 1) as [number]
      await input.wait(duration / refresh)
    }

    if (fixedDice)
      this.dices = this.dices!.map(value=>fixedDice.shift() ?? value) as [number, number] | [number]

    await input.next.input(text)
    const count = this.dices!.reduce((a, b) => a + b, 0)
    this.dices = undefined
    return count
  }
})