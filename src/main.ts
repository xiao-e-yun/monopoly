import { useGameLoader } from './game/loader';
import { createApp } from 'vue'
import App from './App.vue'
import './style.scss'


createApp(App).mount('#app')

const loader = useGameLoader();
// load textures
// loader.loadTexture('background', '/background.png');
loader.loadTexture('tile-spawner', '/tiles/spawner.webp')
loader.loadTexture("tile-task", "/tiles/task.png")
loader.loadTexture("tile-opportunity", "/tiles/opportunity.png")
loader.loadTexture("tile-destiny", "/tiles/destiny.png")
loader.loadTexture("tile-punishment", "/tiles/punishment.png")
loader.loadTexture("tile-teleport", "/tiles/teleport.png")
loader.loadTexture("tile-prison", "/tiles/prison.png")
loader.loadTexture("tile-hospital", "/tiles/hospital.png")


loader.loadTexture('player-1-normal', '/players/player.1.normal.png');
loader.loadTexture('player-1-dizziness', '/players/player.1.dizziness.png');
loader.loadTexture('player-2-normal', '/players/player.1.normal.png');
loader.loadTexture('player-2-dizziness', '/players/player.1.dizziness.png');

loader.loadTexture('arrow', '/arrow.png');

// load sounds
// loader.loadSound('background', '/background.mp3');
