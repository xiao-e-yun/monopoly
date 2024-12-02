import { Player } from "../game/player";
import { randomGet } from "../game/utils";

export const usePunishments: () => [string, string, (player: Player) => any][] = () => [
  [
    `懲罰1`,
    `扣除 20 分`,
    (player: Player) => player.score -= 20
  ]
];

export const randomPunishment = () => randomGet(usePunishments());