import { reactive } from "vue";
import { Player } from "./player";
import { debug } from "./debug";

export class GameInput<T extends unknown> {
  private callback: ((arg: T) => void) | undefined = undefined;
  accept: T[] = [];
  receive = false;
  text = '';

  async input(text: string,accept: T[] = []): Promise<T> {
    this.receive = true;
    this.text = text;
    return new Promise((callback) => {
      this.accept = accept;
      this.callback = callback;
    })
  }

  resolve(arg: T) {
    if (!this.callback) throw new Error('No callback');
    this.callback(arg);
    this.callback = undefined;
    this.receive = false;
    this.text = '';
    this.accept = [];
  }
}

export const useGameInputs = () => gameInputsInner;
let gameInputsInner = reactive(new class GameInputs {
  next = new GameInput<void>();
  move = new GameInput<GameInputMove>();
  confirm = new GameInput<boolean>();
  players = new GameInput<Player>();

  wait(duration: number): Promise<void> {
    if (!debug.transition) duration = 0
    return new Promise((resolve) => setTimeout(resolve, duration))
  }
});


export enum GameInputMove {
  UP = "up",
  RIGHT = "right",
  DOWN = "down",
  LEFT = "left",
}