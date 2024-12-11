import { useGameInputs } from "../game/input";
import { Tile, useGameMap } from "../game/map";
import { DEFAULT_PLAYER_HEALTH, Player } from "../game/player";
import { useGameState } from "../game/state";
import { randomGet, shuffle } from "../game/utils";

export const useDestinys: () => [string, string, (player: Player) => any][] = () => [
  [
    "暴風雪",
    "全部人受到 1 點傷害",
    (_player: Player) => {
      const state = useGameState();
      for (const player of state.players.values()) {
        player.damage(1);
      }
    }
  ],
  [
    "掉錢包",
    "遺失 25% 分數 (最高 100, 最低 20)",
    (player: Player) => {
      const loss = Math.min(100, Math.max(20, Math.floor(player.score * 0.25)));
      player.score -= loss;
    }
  ],
  [
    "刑事拘留",
    "傳送並關入監獄",
    async (player: Player) => {
      const map = useGameMap()
      const prisons = map.prisons;

      let dist = Infinity;
      let latestPrison = prisons[0];
      for (const prison of prisons) {
        const xd = player.position.x - prison[0];
        const yd = player.position.y - prison[1];
        const d = xd * xd + yd * yd;
        if (d < dist) {
          dist = d;
          latestPrison = prison;
        }
      }

      await player.teleport(latestPrison);
      await player.trigger(Tile.Prison);
      await useGameInputs().wait(500);
    }
  ],
  [
    "大流感",
    "全部玩家傳送至醫院，使所有人降低至3點血",
    async (_player: Player) => {
      const state = useGameState();
      const map = useGameMap();
      const hospitals = map.hospitals;
      const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];

      for (const player of state.players.values()) {
        player.teleport(hospital);
        player.health = Math.min(3, player.health);
      }

      await useGameInputs().wait(500);
    }
  ],
  [
    "海克斯科技",
    "全部人互相傳送",
    async (_player: Player) => {
      const state = useGameState();
      const players = Array.from(state.players.values());
      const positions = players.map(player => [player.position.x, player.position.y] as [number, number]);

      shuffle(positions);
      for (const index in players) {
        const player = players[index];
        const position = positions[index];
        player.teleport(position);
      }

      await useGameInputs().wait(500);
    }
  ],
  [
    "大聖人",
    "向所有分享自己的金錢，但也分享給自己",
    (player: Player) => {
      const state = useGameState();
      const totalPlayers = state.players.size;
      const shareAmount = Math.floor(player.score / totalPlayers);

      for (const p of state.players.values()) {
        player.score -= shareAmount
        p.score += shareAmount;
      }
    }
  ],
  [
    "監獄超收",
    "全部玩家傳送到監獄",
    async (_player: Player) => {
      const state = useGameState();
      const map = useGameMap();
      const prisons = map.prisons;
      const prison = prisons[Math.floor(Math.random() * prisons.length)];

      for (const player of state.players.values()) {
        player.teleport(prison);
        player.trigger(Tile.Prison);
      }

      await useGameInputs().wait(500);
    }
  ],
  [
    "最後的晚餐",
    "全部人承受不足致命的傷害。(除非剩下1滴血)",
    (_player: Player) => {
      const state = useGameState();
      for (const player of state.players.values()) {
        const damage = Math.max(1, Math.floor(Math.random() * player.health));
        player.damage(damage);
      }
    }
  ],
  [
    "雪球大戰",
    "隨機攻擊玩家",
    async (player: Player) => {
      const state = useGameState();
      const players = state.withoutPlayer(player);
      const target = players[Math.floor(Math.random() * players.length)];
      await player.attack(target, true);
    }
  ],
  [
    "平安夜",
    "全部人回復至滿血",
    (_player: Player) => {
      const state = useGameState();
      for (const player of state.players.values()) {
        player.health = DEFAULT_PLAYER_HEALTH;
      }
    }
  ],
  [
    "聖誕狂歡曲",
    "全部人下次移動時獲得雙倍骰子",
    (_player: Player) => {
      const state = useGameState();
      for (const player of state.players.values()) {
        player.doubleDice++;
      }
    }
  ],
  [
    "北極探險",
    "玩家前進到最近的懲罰格接受懲罰",
    async (player: Player) => {
      const map = useGameMap();
      const penaltyTiles = map.punishments;
      let nearestTile = penaltyTiles[0];
      let minDistance = Infinity;

      for (const tile of penaltyTiles) {
        const distance = Math.abs(player.position.x - tile[0]) + Math.abs(player.position.y - tile[1]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestTile = tile;
        }
      }

      await player.teleport(nearestTile);
      await player.trigger(Tile.Punishment);
    }
  ],
  [
    "金錢危機",
    "須支付5%分數給其餘玩家",
    (player: Player) => {
      const state = useGameState();
      const payment = Math.floor(player.score * 0.05);

      for (const p of state.players.values()) {
        if (p === player) continue
        player.score -= payment;
        p.score += payment;
      }
      
    }
  ]
];

export const randomDestiny = () => randomGet(useDestinys());