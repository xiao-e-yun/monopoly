import { GameInputMove } from "./input";
import { useGameLoader } from "./loader";

export enum Tile {
  Empty,
  Spawner,
  Task,
  Opportunity,
  Destiny,
  Punishment,
  Teleport,
  Prison,
  Hospital,
}

export class GameMap {
  constructor(
    rawMap: Tile[][],
    public spawnPointDirections: GameInputMove[]
  ) {
    this.tiles = rawMap;
    this.width = rawMap[0].length;
    this.height = rawMap.length;
    this.flatTiles = this.tiles.flat()

    for (const [index, tile] of this.flatTiles.entries()) {

      switch (tile) {
        case Tile.Teleport: {
          this.teleports.push(this.indexFromFlat(index))
          break
        };
        case Tile.Spawner: {
          this.spawners.push(this.indexFromFlat(index))
          break
        };
        case Tile.Punishment: {
          this.punishments.push(this.indexFromFlat(index))
          break
        };
        case Tile.Prison: {
          this.prisons.push(this.indexFromFlat(index))
          break
        };
        case Tile.Hospital: {
          this.hospitals.push(this.indexFromFlat(index))
          break
        };
      }

    }
  }

  width: number
  height: number
  tiles: Tile[][]
  flatTiles: Tile[]

  teleports: [number, number][] = []
  spawners: [number, number][] = []
  prisons: [number, number][] = []
  hospitals: [number, number][] = []
  punishments: [number, number][] = []

  getTile(x: number, y: number): Tile {
    return this.flatTiles[y * this.width + x]
  }

  indexFromFlat(index: number): [number, number] {
    const x = index % this.width;
    const y = Math.floor(index / this.width);
    return [x, y]
  }

  indexFromPosition(position: [number, number]): number {
    const [x, y] = position
    return y * this.width + x
  }

  spawnPoints(): [[number, number], GameInputMove][] {

    const spawners = this.spawners
    if (this.spawnPointDirections.length !== spawners.length) {
      console.group(`Spawner count not match directions`)
      console.log(`Directions: ${spawners.length}`)
      console.log(`Spawn Points: ${this.spawnPointDirections.length}`)

      console.group("Spawners: ")
      for (const spawner of spawners) {
        const accepts = Array.from(this.nextPosition(spawner).keys())
        console.log(`Spawner: ${spawner}, Accepts: ${accepts}`)
      }
      console.groupEnd()
      console.groupEnd()

      throw new Error("spawner count not match directions")
    }

    const binded = this.spawnPointDirections.map((direction, index) => [spawners[index], direction] as [[number, number], GameInputMove])

    return binded
  }

  nextPosition(position: [number, number], direction?: GameInputMove): Map<GameInputMove, [number, number]> {
    const nextPosition = new Map<GameInputMove, [number, number]>([
      [GameInputMove.UP, [0, -1]],
      [GameInputMove.RIGHT, [1, 0]],
      [GameInputMove.DOWN, [0, 1]],
      [GameInputMove.LEFT, [-1, 0]],
    ])

    const reverseDirection = ({
      [GameInputMove.UP]: GameInputMove.DOWN,
      [GameInputMove.RIGHT]: GameInputMove.LEFT,
      [GameInputMove.DOWN]: GameInputMove.UP,
      [GameInputMove.LEFT]: GameInputMove.RIGHT,
    } as const)[direction!]

    const accepts = new Map<GameInputMove, [number, number]>()
    for (const [moveto, offset] of nextPosition.entries()) {
      if (moveto === reverseDirection) continue

      const x = position[0] + offset[0]
      const y = position[1] + offset[1]

      // out of bounds
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue

      // check if the tile is empty
      const tile = this.getTile(x, y)
      if (tile === Tile.Empty) continue

      accepts.set(moveto, offset)
    }

    return accepts
  }

  static tileColor(tile: Tile): string {
    return ({
      [Tile.Empty]: 'black',
      [Tile.Spawner]: 'green',
      [Tile.Task]: 'blue',
      [Tile.Opportunity]: 'yellow',
      [Tile.Destiny]: 'orange',
      [Tile.Punishment]: 'red',
      [Tile.Teleport]: 'purple',
      [Tile.Prison]: 'gray',
      [Tile.Hospital]: 'white',
    } as const)[tile]
  }

  static tileText(tile: Tile): string {
    return ({
      [Tile.Empty]: '空地',
      [Tile.Spawner]: '出生點',
      [Tile.Task]: '任務',
      [Tile.Opportunity]: '機會',
      [Tile.Destiny]: '命運',
      [Tile.Punishment]: '懲罰',
      [Tile.Teleport]: '傳送門',
      [Tile.Prison]: '監獄',
      [Tile.Hospital]: '醫院',
    } as const)[tile]
  }

  static tileBitmap(tile: Tile): ImageBitmap | undefined {
    const loader = useGameLoader()

    if (Tile.Empty === tile) return undefined

    // example: tile-empty
    const id = "tile-" + ({
      [Tile.Spawner]: 'spawner',
      [Tile.Task]: 'task',
      [Tile.Opportunity]: 'opportunity',
      [Tile.Destiny]: 'destiny',
      [Tile.Punishment]: 'punishment',
      [Tile.Teleport]: 'teleport',
      [Tile.Prison]: 'prison',
      [Tile.Hospital]: 'hospital',
    } as const)[tile]


    return loader.getTexture(id)!
  }

  static stringToTile(text: string): Tile {
    const tile = ({
      '空': Tile.Empty,
      '出': Tile.Spawner,
      '任': Tile.Task,
      '機': Tile.Opportunity,
      '命': Tile.Destiny,
      '懲': Tile.Punishment,
      '傳': Tile.Teleport,
      '監': Tile.Prison,
      '醫': Tile.Hospital,
    } as const)[text]

    if (tile === undefined) throw new Error('Invalid tile')
    return tile
  }

  static TILE_SIZE = 64
}
export const useGameMap = () => gameMap
const rawMap = `
出任機傳命出命任機傳出
命空空空懲空命空空空懲
機空空空傳空機空空空傳
機空空空傳空機空空空傳
傳監醫任命任傳監醫任懲
出空空空命空傳空空空出
命任機傳命機命任機傳命
命空空空懲空命空空空懲
機空空空傳空機空空空傳
命空空空懲空命空空空懲
出監醫任命出傳監醫任出
`.trim()

const spawnerDirections = [
  GameInputMove.RIGHT,
  GameInputMove.RIGHT,
  GameInputMove.DOWN,
  GameInputMove.UP,
  GameInputMove.DOWN,
  GameInputMove.UP,
  GameInputMove.LEFT,
  GameInputMove.LEFT,
]

const gameMap = new GameMap(
  rawMap.split("\n").map(row => row.split("").map(GameMap.stringToTile)),
  spawnerDirections
)