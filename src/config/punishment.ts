import { Player } from "../game/player";
import { randomGet } from "../game/utils";

export const usePunishments: () => [string, string, (player: Player) => any][] = () => [
  [
    `懲罰1`,
    `懲罰內容
    1. 懲罰內容`,
    (player: Player) => player.score -= 100
  ]
];

export const randomPunishment = () => randomGet(usePunishments());