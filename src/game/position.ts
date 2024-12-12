import { debug } from "./debug";

export class Position {
  x: number;
  y: number;

  current: [number, number] = [0, 0];
  transition: {
    from: [number, number];
    target: [number, number];
    duration: [number, number];
  } | undefined = undefined;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.current = [x, y];
  }

  set(x: number, y: number, duration: number = 0) {
    const oldX = this.x;
    const oldY = this.y;
    this.x = x;
    this.y = y;

    //transition
    const nonTransition = duration === 0 || !debug.transition
    if (nonTransition) {
      this.current = [x, y];
      this.transition = undefined;
    } else {
      this.current = [oldX, oldY];
      this.transition = {
        from: [oldX, oldY],
        target: [x, y],
        duration: [0, duration],
      };
    }

  }

  move(x: number, y: number, duration: number = 0) {
    this.set(this.x + x, this.y + y, duration);
  }

  tick(delta: number) {
    if (!this.transition) return;
    
    const transition = this.transition;
    transition.duration[0] += delta;
    if (transition.duration[0] >= transition.duration[1]) {
      this.current = transition.target;
      this.transition = undefined;
    } else {
      const progress = transition.duration[0] / transition.duration[1];

      const transform = -(Math.cos(Math.PI * progress) - 1) / 2;;

      const x = transition.from[0] + (transition.target[0] - transition.from[0]) * transform;
      const y = transition.from[1] + (transition.target[1] - transition.from[1]) * transform;
      this.current = [x, y];
    }

  }

  distance(position: Position) {
    return Math.sqrt((this.x - position.x) ** 2 + (this.y - position.y) ** 2);
  }

  equals(position: Position) {
    return this.x === position.x && this.y === position.y;
  }

  clone(): Position {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }

  static from(xy: [number, number]) {
    return new Position(xy[0], xy[1]);
  }
}