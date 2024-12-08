import { shallowReactive } from "vue";

export const useGameLoader = () => loaderInner;
const loaderInner = shallowReactive(new class GameLoader {
  textures = new Map<string, HTMLImageElement>();
  sounds = new Map<string, HTMLAudioElement>();
  loadings = 0;
  logs: string[] = [];

  private log(msg: string) {
    this.logs.push(msg);
  }

  loadTexture(id: string, texture: string) {
    this.log(`Loading texture "${id}" from "${texture}"`);
    const image = new Image();
    image.src = texture;
    this.loadings++;
    image.onload = async () => {
      this.log(`Texture "${id}" loaded`);
      this.textures.set(id, image)
      this.loadings--;
    };
  }

  loadSound(id: string, sound: string) {
    this.log(`Loading sound "${id}" from "${sound}"`);
    const audio = new Audio(sound);
    this.loadings++;
    audio.oncanplaythrough = () => {
      this.log(`Sound "${id}" loaded`);
      this.sounds.set(id, audio)
      this.loadings--;
    };
  }

  getTexture(id: string) {
    return this.textures.get(id);
  }

  getSound(id: string) {
    return this.sounds.get(id);
  }

  dropTexture(id: string) {
    if (!this.textures.has(id)) return;
    this.textures.delete(id);
  }

  isFinished() {
    return this.loadings === 0;
  }
  
})