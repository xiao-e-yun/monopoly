import { Player } from "../game/player";
import { randomGet } from "../game/utils";

export const useOpportunitys: () => [string, string, (player: Player) => any][] = () => [
  [
    `機會1`,
    `機會內容
    1. 機會內容`,
    (player: Player) => player.score += 100
  ],
];

export const randomOpportunity = () => randomGet(useOpportunitys());