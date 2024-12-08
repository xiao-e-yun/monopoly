import { reactive } from "vue";
import { useGameLoader } from "./loader";

export const useGameFx = () => fxInner;
const fxInner = reactive(new class GameFx {
  inner = new Map<number,Fx[keyof Fx]>();
  counter = 0;

  effect<T extends keyof Fx>(data: Fx[T], keep = 1000) {
    const counter = this.counter++;
    this.inner.set(counter, data);
    setTimeout(() => this.inner.delete(counter),keep);
  }
  sound(name: string) {
    const loader = useGameLoader()
    const audio = loader.getSound(name);
    if (!audio) throw new Error('Sound not found');
    audio.currentTime = 0;
    audio.play();
    return audio;
  }

  check<T extends keyof Fx>(name: T, data: Fx[keyof Fx]): data is Fx[T] {
    return name === data.name
  }
});

export interface Fx {
  damaged: {
    name: "damaged";
    position: [number, number];
    time: number;
    direction: [number, number];
  }
}