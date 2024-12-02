import { reactive } from "vue";
import { useGameLoader } from "./loader";

export const useGameFx = () => fxInner;
const fxInner = reactive(new class Fx {
  inner = new Map<number, {
    position: [number, number];
    size: [number,number];
    bitmap: ImageBitmap;
  }>();
  counter = 0;




  fx(name: string, position: [number, number], size: [number,number]) {
    const audio = this.sound(name);
    this.effect(name, position, size, audio.duration * 1000);
  }
  effect(name: string, position: [number, number], size: [number,number], duration: number) {
    const loader = useGameLoader()
    const bitmap = loader.getTexture(name);
    if (!bitmap) throw new Error('Texture not found');
    
    const counter = this.counter++;
    this.inner.set(counter, {
      position,
      bitmap,
      size,
    });
    setTimeout(() => this.inner.delete(counter), duration);
  }
  sound(name: string) {
    const loader = useGameLoader()
    const audio = loader.getSound(name);
    if (!audio) throw new Error('Sound not found');
    audio.currentTime = 0;
    audio.play();
    return audio;
  }
});