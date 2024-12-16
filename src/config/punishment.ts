import { Player } from "../game/player";
import { randomGet } from "../game/utils";

export const usePunishments: () => [string, string, (player: Player) => any][] = () => [
  [
    `我是青蛙`,
    `蹲下學青蛙跳，並發出呱呱呱的聲音。`,
    (_player: Player) => {}
  ],
  [
    `我是企鵝`,
    `模仿企鵝走路繞一圈。`,
    (_player: Player) => {}
  ],
  [
    `我是大猩猩`,
    `模仿大猩猩雙手捶胸跑一圈。`,
    (_player: Player) => {}
  ],
  [
    `我是雞王`,
    `模仿公雞雙手擺動繞一圈，並發出咕咕咕的聲音。`,
    (_player: Player) => {}
  ],
  [
    `臭腳ㄚ攻擊`,
    `聞自己的襪子30秒，並說真香。`,
    (_player: Player) => {}
  ],
  [
    `我最好看`,
    `絲襪套頭5秒。`,
    (_player: Player) => {}
  ],
  [
    `人體噴水秀`,
    `含水唱出兩隻老虎。`,
    (_player: Player) => {}
  ],
  [
    `人體彩繪`,
    `請下一組玩家在你的臉上畫畫。`,
    (_player: Player) => {}
  ],
  [
    `斗六火車讚`,
    `上傳自拍照到限時動態，@營建系學會並打上一句話。`,
    (_player: Player) => {}
  ],
  [
    `老香了`,
    `聞自己的胳肢窩，並說真香。`,
    (_player: Player) => {}
  ],
  [
    `要活就要動`,
    `棒式1分鐘。`,
    (_player: Player) => {}
  ],
  [
    `誰能比我騷`,
    `M字腿五次。`,
    (_player: Player) => {}
  ],
  [
    `乾淨乖寶寶`,
    `背對大家，一邊扭屁股擺動作一邊唱洗刷刷*n遍。`,
    (_player: Player) => {}
  ]
];

export const randomPunishment = randomGet(usePunishments());