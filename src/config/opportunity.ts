import { useGameInputs } from "../game/input";
import { Tile } from "../game/map";
import { Player } from "../game/player";
import { useGameState } from "../game/state";
import { randomGet } from "../game/utils";

export const useOpportunitys: () => [string, string, (player: Player) => any][] = () => [
  [
    `致命節奏`,
    `重骰，繼續前進。`,
    async (player: Player) => {
      const state = useGameState()
      state.steps = await state.throwDice("繼續行動", !!player.doubleDice);
      player.doubleDice = Math.max(0, player.doubleDice - 1)
    }
  ],
  [
    `量子科技`,
    `與隨機一名玩家交換位置。`,
    async (player: Player) => {
      const state = useGameState();
      const players = state.withoutPlayer(player);
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      const otherPlayerPosition = randomPlayer.position.clone();

      randomPlayer.teleportPosition(player.position);
      await player.teleportPosition(otherPlayerPosition);
    }
  ],
  [
    `背刺`,
    `移動至分數最高(不含自己)一位玩家並攻擊他。`,
    async (player: Player) => {
      const state = useGameState();
      const players = state.withoutPlayer(player);
      const highestScoringPlayer = players.reduce((max, p) => p.score > max.score ? p : max, players[0]);
      await player.teleportPosition(highestScoringPlayer.position);
      await player.attack(highestScoringPlayer,true);
    }
  ],
  [
    `共同富裕`,
    `與分數最高者，平分分數。(本身為最高時，與最低分者平分)`,
    (player: Player) => {
      const state = useGameState();
      const players = state.withoutPlayer(player);
      const highestScoringPlayer = players.reduce((max, p) => p.score > max.score ? p : max, players[0]);
      const lowestScoringPlayer = players.reduce((min, p) => p.score < min.score ? p : min, players[0]);
      
      const targetPlayer = player.score >= highestScoringPlayer.score ? lowestScoringPlayer : highestScoringPlayer;
      const totalScore = player.score + targetPlayer.score;
      player.score = Math.floor(totalScore / 2);
      targetPlayer.score = totalScore - player.score;
    }
  ],
  [
    `聖誕交換禮物`,
    `選擇一位玩家，接受懲罰。`,
    async (player: Player) => {
      const state = useGameState();
      const target = await useGameInputs().players.input("選擇一位玩家", state.withoutPlayer(player));
      target.trigger(Tile.Punishment);
    }
  ],
  [
    `聖誕禮物`,
    `獲得 30 分、回復一點生命值。`,
    (player: Player) => {
      player.score += 30;
      player.health += 1;
    }
  ],
  [
    `聖誕禮物`,
    `扣至1點生命值、獲得 60% 分數 (最高 300 分，最低 100 分)`,
    (player: Player) => {
      player.health = 1;
      let gain = Math.floor(player.score * 0.6);
      gain = Math.max(100, Math.min(gain, 300));
      player.score += gain;
    }
  ],
  [
    `聖誕夜`,
    `除你以外所有人暈眩一回合`,
    (player: Player) => {
      const state = useGameState();
      const players = state.withoutPlayer(player);
      players.forEach(player => player.dizziness++);
    }
  ],
];

export const randomOpportunity = () => randomGet(useOpportunitys());