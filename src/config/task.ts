import { Player } from "../game/player";
import { randomGet } from "../game/utils";

export const useTasks: () => [string, string, (player: Player, success: boolean) => any][] = () => [
  [
    "吃好吃滿",
    "組內每個人都要裝滿半碗，並在1分鐘吃完。\n\n成功 +80分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 80 : -20
  ],
  [
    "喝好喝滿",
    "組內每個人都要裝滿兩杯飲料，並在30秒喝完。\n\n成功 +50分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 50 : -20
  ],
  [
    "記憶力比拚",
    "記住隊內至少三個人的名字並說出。\n\n成功 +80分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 80 : -20
  ],
  [
    "記憶力比拚",
    "播放歌曲，記住該段歌詞並唱出。\n\n成功 +100分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 100 : -20
  ],
  [
    "四不像",
    "團體做出指定團體動作，在1分鐘內完成。\n\n成功 +50分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 50 : -20
  ],
  [
    "有你真好",
    "找一位其他隊伍的人 (不可重複) 拍照，1分鐘內完成。\n\n成功 +60分\n失敗 -50分",
    (player: Player, success: boolean) => player.score += success ? 60 : -50
  ],
  [
    "聖誕你不知",
    "回答聖誕節冷知識\n\n聖誕老人住哪裡? (國家)\n<span class=\"hide\">芬蘭 羅瓦涅米</span>\n\n成功 +50分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 50 : -20
  ],
  [
    "聖誕你不知",
    "回答聖誕節冷知識\n\n聖誕老人的馴鹿是公還是母?\n<span class=\"hide\">母的</span>\n\n成功 +50分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 50 : -20
  ],
  [
    "擠眉弄眼",
    "隊內互相使用便條紙貼在對方臉上某個部位，只能使用臉部肌肉把便條紙拿下，1分鐘內完成。\n\n成功 +80分\n失敗 -40分",
    (player: Player, success: boolean) => player.score += success ? 80 : -40
  ],
  [
    "支援前線",
    "拿到主持人要求物品及數量，回到原位，1分鐘內完成。\n\n成功 +60分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 60 : -20
  ],
  [
    "比手劃腳",
    "指定一位並背對所有人，其他人提示直到猜到題目，3分鐘內完成。\n\n成功 +80分\n失敗 -40分",
    (player: Player, success: boolean) => player.score += success ? 80 : -40
  ],
  [
    "誰的腳腳最靈活",
    "每位組員接力用腳夾裝有豆子的杯子依序傳遞，最後數量占1/4者成功。\n\n成功 +80分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 80 : -20
  ],
  [
    "誰是花栗鼠",
    "每位組員跟著簡易節拍唸出繞口令，1分鐘內完成。\n\n成功 +60分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 60 : -20
  ],
  [
    "Just dance",
    "玩家須在無音樂時跳出\"APT\"副歌舞蹈 或 freestyle 滿一分鐘即成功。\n\n成功 +60分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 60 : -20
  ],
  [
    "歌王大道",
    "玩家須唱出一首歌滿一分鐘即成功。\n\n成功 +50分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 50 : -20
  ],
  [
    "你畫我猜",
    "每位組員接力畫出題目，使猜題者猜，2分鐘內答對2題即成功。\n\n成功 +50分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 50 : -20
  ],
  [
    "屁屁超人",
    "玩家想出一句話，並依序用屁股寫出各個字，其餘玩家猜出即成功。\n\n成功 +60分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 60 : -20
  ],
  [
    "誰是老鼠屎",
    "玩家站成一排，利用頭或臉部把物品傳遞給下一個人，中途無掉落，2分鐘內完成即成功。\n\n成功 +80分\n失敗 -20分",
    (player: Player, success: boolean) => player.score += success ? 80 : -20
  ],
  [
    "有你真好",
    "找一位工作人員 (不可重複) 拍照，1分鐘內完成。\n\n成功 +60分\n失敗 -40分",
    (player: Player, success: boolean) => player.score += success ? 60 : -40
  ]
];

export const randomTask = () => randomGet(useTasks());