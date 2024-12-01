import { Player } from "../game/player";
import { randomGet } from "../game/utils";

export const useDestinys: () => [string, string, (player: Player) => any][] = () => [
  [
    `命運1`,
    `命運內容
    1. 命運內容`,
    (player: Player) => player.score += 100
  ],
];

export const randomDestiny = () => randomGet(useDestinys());