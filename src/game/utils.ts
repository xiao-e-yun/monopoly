export function shuffle(array: unknown[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

export const randomGet = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)]


type Point = [number, number];
export function poissonDiskSampling(width: number, height: number, radius: number, k: number = 30): Point[] {
  const cellSize = radius / Math.sqrt(2);
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid: (Point | null)[][] = Array.from({ length: gridWidth }, () => Array(gridHeight).fill(null));
  const points: Point[] = [];
  const processList: Point[] = [];

  function getRandomPointAround(x: number, y: number): Point {
    const r = radius + Math.random() * radius;
    const angle = Math.random() * 2 * Math.PI;
    return [
      x + r * Math.cos(angle),
      y + r * Math.sin(angle)
    ];
  }

  function isInBounds(point: Point): boolean {
    return point[0] >= 0 && point[0] < width && point[1] >= 0 && point[1] < height;
  }

  function isValidPoint(point: Point): boolean {
    const gridX = Math.floor(point[0] / cellSize);
    const gridY = Math.floor(point[1] / cellSize);
    const startX = Math.max(0, gridX - 2);
    const endX = Math.min(gridWidth, gridX + 3);
    const startY = Math.max(0, gridY - 2);
    const endY = Math.min(gridHeight, gridY + 3);

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const neighbor = grid[x][y];
        if (neighbor) {
          const dx = neighbor[0] - point[0];
          const dy = neighbor[1] - point[1];
          if (dx * dx + dy * dy < radius * radius) {
            return false;
          }
        }
      }
    }
    return true;
  }

  const initialPoint: Point = [
    Math.random() * width,
    Math.random() * height
  ];
  points.push(initialPoint);
  processList.push(initialPoint);
  grid[Math.floor(initialPoint[0] / cellSize)][Math.floor(initialPoint[1] / cellSize)] = initialPoint;

  while (processList.length > 0) {
    const pointIndex = Math.floor(Math.random() * processList.length);
    const point = processList[pointIndex];
    let found = false;

    for (let i = 0; i < k; i++) {
      const newPoint = getRandomPointAround(point[0], point[1]);
      if (isInBounds(newPoint) && isValidPoint(newPoint)) {
        points.push(newPoint);
        processList.push(newPoint);
        grid[Math.floor(newPoint[0] / cellSize)][Math.floor(newPoint[1] / cellSize)] = newPoint;
        found = true;
      }
    }

    if (!found) {
      processList.splice(pointIndex, 1);
    }
  }

  return points;
}

export function getRandomSubset(points: Point[], count: number): Point[] {
  const cloned = points.slice();
  shuffle(cloned);
  return cloned.slice(0, count);
}