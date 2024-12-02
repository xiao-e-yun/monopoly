import { useGameLoader } from './game/loader';
import { createApp } from 'vue'
import App from './App.vue'
import './style.scss'


createApp(App).mount('#app')

const loader = useGameLoader();
// load textures
import TilesSpawner from "/tiles/spawner.webp"
import TilesTask from "/tiles/task.png"
import TilesOpportunity from "/tiles/opportunity.png"
import TilesDestiny from "/tiles/destiny.png"
import TilesPunishment from "/tiles/punishment.png"
import TilesTeleport from "/tiles/teleport.png"
import TilesPrison from "/tiles/prison.png"
import TilesHospital from "/tiles/hospital.png"
loader.loadTexture('tile-spawner', TilesSpawner)
loader.loadTexture("tile-task", TilesTask)
loader.loadTexture("tile-opportunity", TilesOpportunity)
loader.loadTexture("tile-destiny", TilesDestiny)
loader.loadTexture("tile-punishment", TilesPunishment)
loader.loadTexture("tile-teleport", TilesTeleport)
loader.loadTexture("tile-prison", TilesPrison)
loader.loadTexture("tile-hospital", TilesHospital)


import Player1 from '/players/player.1.png'
import Player2 from '/players/player.2.png'
loader.loadTexture('player-1', Player1);
loader.loadTexture('player-2', Player2);
loader.loadTexture('player-3', Player1);
loader.loadTexture('player-4', Player1);
loader.loadTexture('player-5', Player1);
loader.loadTexture('player-6', Player1);

import FxDamaged from '/fx/damaged.png';
loader.loadTexture('fx-damaged', FxDamaged);

import Arrow from '/others/arrow.png';
import Dizziness from '/others/dizziness.png';
loader.loadTexture('arrow', Arrow);
loader.loadTexture('dizziness', Dizziness);

// load sounds
// loader.loadSound('background', '/background.mp3');