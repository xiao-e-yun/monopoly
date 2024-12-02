import { reactive } from "vue";
import { Player } from "./player";

export const useGameState = () => stateInner;
const stateInner = reactive(new class GameState {
  players = new Map<number, Player>();
  steps: number | undefined = undefined;
  plunder: {damage: number,target: number} | undefined = undefined;
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
        description: description.trim().replaceAll("\n","<br>"),
        callback: async (success: boolean) => {
          this.event = undefined
          await action(player,success)
          resolve()
        }
      }
    })
  }

  traps: [number, number, (player: Player) => Promise<void>][] = []

  withoutPlayer(player: Player) {
    return Array.from(this.players.values()).filter(p => p !== player)
  }
})