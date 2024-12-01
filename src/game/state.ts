import { reactive } from "vue";
import { Player } from "./player";

export const useGameState = () => stateInner;
const stateInner = reactive(new class GameState {
  players = new Map<number, Player>();
  steps: number | undefined = undefined;
  plunder: number | undefined = undefined;
  inning = 0;
  winner: Player | undefined = undefined;

  // game settings
  victoryScore = 1000;
  quantity = 0;

  messages = new class Messages {
    inner = new Map<number, string>()
    count = 0;
    push(message: string, keep = 5000) {
      const count = this.count++
      this.inner.set(count, message)
      if (keep !== 0) setTimeout(() => this.inner.delete(count), keep)
      return count
    }
    remove(count: number) {
      this.inner.delete(count)
    }
    length() {
      return this.inner.size
    }
    toArray() {
      return Array.from(this.inner.values())
    }
  };

  event: {
    type: string;
    title: string;
    hasFail: boolean;
    description: string;
    callback: (success: boolean) => Promise<void>;
  } | undefined = undefined
  setEvent(player: Player, type: string, event: [string,string,(player: Player,success: boolean) => Promise<void>], hasFail = false) {
    return new Promise<void>((resolve) => {
      const [title,description,action] = event
      this.event = {
        type,
        title,
        hasFail,
        description,
        callback: async (success: boolean) => {
          await action(player,success)
          this.event = undefined
          resolve()
        }
      }
    })
  }

  traps: [number, number, (player: Player) => Promise<void>][] = []

})