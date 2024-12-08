import { useGameFx } from "./fx";
import { GameInputMove, useGameInputs } from "./input";
import { useGameLoader } from "./loader";
import { GameMap, Tile, useGameMap } from "./map";
import { Position } from "./position";
import { useGameState } from "./state";

export const useGameRender = () => gameRenderInner!;
export const bindGameRender = (canvas: HTMLCanvasElement) => {
  gameRenderInner = new GameRender(canvas)
  gameRenderInner.draw()
};
let gameRenderInner: GameRender | undefined = undefined;

export class GameRender {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  width = 0;
  height = 0;
  rawWidth = 0;
  rawHeight = 0;
  position = new Position(0, 0);
  tiles: ImageBitmap;
  paused = false;
  viewport = 600;


  playerRender = new GamePlayersRender();
  fxRender = new GameFxRender();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.tiles = createGameTiles();

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
  }

  draw(delta: number = 0) {

    const [x, y] = this.position.current;

    const offsetX = x * GameMap.TILE_SIZE - this.width / 2 + GameMap.TILE_SIZE / 2;
    const offsetY = y * GameMap.TILE_SIZE - this.height / 2 + GameMap.TILE_SIZE / 2;;

    // absolute position
    this.setTransform(1, 0, 0);
    this.drawBackground();
    this.drawMap(offsetX, offsetY);

    // relative position
    this.setTransform(GameMap.TILE_SIZE, -offsetX, -offsetY);
    this.playerRender.draw(this.ctx, delta);
    this.fxRender.draw(this.ctx);

    // tick position
    this.position.tick(delta);

    // request next frame
    if (this.paused) return;
    const now = Date.now();
    requestAnimationFrame(() => this.draw.bind(this)(Date.now() - now));
  }

  drawBackground() {
    // const backgroundOffsetX = offsetX - 0
    // const backgroundOffsetY = offsetY - 0
    // const background = useGameLoader().getTexture('background')!;
    // this.ctx.drawImage(background, backgroundOffsetX, backgroundOffsetY, this.width, this.height, 0, 0, this.width, this.height);

    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawMap(offsetX: number, offsetY: number) {
    this.ctx.drawImage(this.tiles, -offsetX, -offsetY);
  }

  resize() {
    let { width, height } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;

    this.rawWidth = this.canvas.width = width * dpr;
    this.rawHeight = this.canvas.height = height * dpr;

    this.width = this.viewport;
    this.height = this.viewport * (height / width);
  }

  setTransform(scale: number, offsetX: number, offsetY: number) {
    const viewportScale = this.rawWidth / this.viewport;
    this.ctx.setTransform(
      scale * viewportScale,
      0,
      0,
      scale * viewportScale,
      offsetX * viewportScale,
      offsetY * viewportScale
    );
  }

  pause() {
    this.paused = true;
  }

  resume() {
    const isPaused = this.paused;
    this.paused = false;
    if (isPaused) this.draw();
  }
}

export class GamePlayersRender {
  draw(ctx: CanvasRenderingContext2D, delta: number) {
    const state = useGameState();
    const loader = useGameLoader()

    const players = Array.from(state.players.values()).toSorted((a) => a.active ? 1 : -1);
    for (const player of players) {
      player.position.tick(delta);

      const [x, y] = player.position.current;

      // arrow
      const arrow = loader.getTexture('arrow')!;
      let directions = [player.direction]
      if (player.active) {
        const accepts = useGameInputs().move.accept
        if (accepts.length) directions = accepts
      };

      for (const direction of directions) {
        const rotate = ({
          [GameInputMove.UP]: 0,
          [GameInputMove.RIGHT]: 1,
          [GameInputMove.DOWN]: 2,
          [GameInputMove.LEFT]: 3,
        })[direction];

        ctx.save();
        ctx.translate(x + 0.5, y + 0.5);
        ctx.rotate(rotate * Math.PI / 2);
        ctx.drawImage(arrow, -0.25, -0.8, 0.5, 0.5);
        ctx.restore();
      }

      const bitmapName = `player-${player.id}`;
      const bitmap = loader.getTexture(bitmapName)!
      const status = player.status()

      // player
      const scale = bitmap.height / bitmap.width;
      const offsetX = x + 0.1;
      const offsetY = y + 0.1 + 1 - scale;
      const width = 0.8;
      const height = 0.8 * scale;
      ctx.drawImage(bitmap, offsetX, offsetY, width, height);

      // dizziness
      if (status === "dizziness") {
        const dizziness = loader.getTexture('dizziness')!;
        const ratio = dizziness.height / dizziness.width;
        ctx.drawImage(dizziness, x + 0.5 - 0.3, y - 0.8, 0.6, ratio * 0.6);
      }

      // name tag
      ctx.beginPath();
      ctx.roundRect(x + 0.1, y + 0.8, 0.8, 0.25, 0.08);
      ctx.fillStyle = "#fff";
      ctx.fill();

      ctx.font = 'bold 0.2px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = "#111";
      ctx.fillText(`第 ${player.id} 組`, x + 0.5, y + 1);
    }
  }
}

export class GameFxRender {
  draw(ctx: CanvasRenderingContext2D) {
    const fx = useGameFx().inner;

    for (const { position, bitmap, size } of fx.values()) {
      const [x, y] = position;
      const [width, height] = size;
      ctx.drawImage(bitmap, x, y, width, height);
    }

  }

}


export function createGameTiles() {
  const canvas = new OffscreenCanvas(0, 0);
  const ctx = canvas.getContext('2d')!;

  const map = useGameMap();
  canvas.width = map.width * GameMap.TILE_SIZE;
  canvas.height = map.height * GameMap.TILE_SIZE;

  ctx.setTransform(GameMap.TILE_SIZE, 0, 0, GameMap.TILE_SIZE, 0, 0);

  // draw the map
  const cachedBitmap = {} as Record<number, ImageBitmap>;
  for (const [index, tile] of map.flatTiles.entries()) {
    if (tile === Tile.Empty) continue;

    let [x, y] = map.indexFromFlat(index);
    const bitmap = cachedBitmap[tile] ??= GameMap.tileBitmap(tile)!;
    ctx.drawImage(bitmap, x, y, 1, 1);
  }

  //clean up
  // const bitmaps = [
  //   'spawner',
  //   'task',
  //   'opportunity',
  //   'destiny',
  //   'punishment',
  //   'teleport',
  //   'prison',
  //   'hospital'
  // ].map(name => `tile-${name}`)
  // const loader = useGameLoader();
  // for (const bitmapId of bitmaps) loader.dropTexture(bitmapId);

  return canvas.transferToImageBitmap();
};
