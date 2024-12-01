import { Player } from "../game/player";
import { randomGet } from "../game/utils";

export const useTasks: () => [string, string, (player: Player, success: boolean) => any][] = () => [
  [
    `任務1`,
    `任務內容
    1. 任務內容`,
    (player: Player, success: boolean) => {
      if(success) player.score += 100
    }
  ],
];

export const randomTask = () => randomGet(useTasks());