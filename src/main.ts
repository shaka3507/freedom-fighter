// src/main.ts
import * as Phaser from 'phaser';
import { IntroScene } from './scenes/IntroScene';
import { MenuScene } from './scenes/MenuScene';
import { GlossaryScene } from './scenes/GlossaryScene';
import { CampScene } from './scenes/CampScene';
import { ScoutPracticeScene } from './scenes/ScoutPracticeScene';
import { HelpScene } from './scenes/HelpScene';
import { ExitScene } from './scenes/ExitScene';


const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 1920,
  height: 1080,
  resolution: window.devicePixelRatio || 1, // 👈 Key fix for blurry images on HiDPI screens
  antialias: true,                           // 👈 Smooth scaling
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,        // fit into available space
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [IntroScene, MenuScene, GlossaryScene, CampScene, ScoutPracticeScene, HelpScene, ExitScene]
};


new Phaser.Game(config);