import { useGameInputs } from "../game/input";
import { Tile, useGameMap } from "../game/map";
import { DEFAULT_PLAYER_HEALTH, Player } from "../game/player";
import { useGameState } from "../game/state";
import { randomGet } from "../game/utils";

export const useOpportunitys: () => [string, string, (player: Player) => any][] = () => [
  [
    `致命節奏`,
    `重骰，繼續前進。`,
    async (player: Player) => {
      const state = useGameState()
      state.steps = await player.throwDice("繼續行動");
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
      const target = await useGameInputs().players.input("���擇一位玩家", state.withoutPlayer(player));
      target.trigger(Tile.Punishment);
    }
  ],
  [
    `聖誕交換禮物`,
    `選擇一位玩家，交換分數。`,
    async (player: Player) => {
      const state = useGameState();
      const target = await useGameInputs().players.input("選擇一位玩家", state.withoutPlayer(player));
      const score = player.score;
      player.score = target.score;
      target.score = score;
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
    `扣至1點生命值、獲得 60% 分數 (最高 300 分，最低 100 分)。`,
    (player: Player) => {
      player.health = 1;
      let gain = Math.floor(player.score * 0.6);
      gain = Math.max(100, Math.min(gain, 300));
      player.score += gain;
    }
  ],
  [
    `聖誕夜`,
    `除你以外所有人暈眩一回合。`,
    (player: Player) => {
      const state = useGameState();
      const players = state.withoutPlayer(player);
      players.forEach(player => player.dizziness++);
    }
  ],
  [
    "重生而降",
    "直接獲得 100 分。",
    (player: Player) => {
      player.score += 100;
    }
  ],
  [
    `回家嚕`,
    `回到最近的起點。`,
    async (player: Player) => {
      const map = useGameMap();

      const spawnerTiles = map.spawners;
      let nearestTile = spawnerTiles[0];
      let minDistance = Infinity;

      for (const tile of spawnerTiles) {
        const distance = Math.abs(player.position.x - tile[0]) + Math.abs(player.position.y - tile[1]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestTile = tile;
        }
      }

      await player.teleport(nearestTile);
      await player.trigger();
    }
  ],
  [
    "我直直撞",
    "前進6步。",
    async (_player: Player) => {
      const state = useGameState();
      state.steps = 6;
    }
  ],
  [
    "滿血復活",
    "回復至最大生命值。",
    (player: Player) => {
      player.health = DEFAULT_PLAYER_HEALTH;
    }
  ],
  [
    "就想看你秀",
    "抽到下一個任務時可指定其餘玩家完成。",
    (_player: Player) => {}
  ],
  [
    "打不到我勒",
    "免疫一回合攻擊。",
    (player: Player) => {
      player.immune++;
    }
  ],
  [
    "Double星",
    "下次移動時獲得雙倍骰子。",
    (player: Player) => {
      player.doubleDice++;
    }
  ],
  [
    "Double星",
    "下次任務獲得雙倍分數。",
    (player: Player) => {
      player.doubleTaskScore++;
    }
  ],
  [
    "我要打鼠你",
    "下一次攻擊時，扣兩倍血量。",
    (player: Player) => {
      player.doubleDamage++;
    }
  ]
];

export const randomOpportunity = randomGet(useOpportunitys());
