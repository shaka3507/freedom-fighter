// src/main.ts
import * as Phaser from 'phaser';
import { IntroScene } from './scenes/IntroScene';
import { MenuScene } from './scenes/MenuScene';
import { GlossaryScene } from './scenes/GlossaryScene';
import { CampScene } from './scenes/CampScene';
import { ScoutPracticeScene } from './scenes/ScoutPracticeScene';
import { HelpScene } from './scenes/HelpScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  scale: {
    mode: Phaser.Scale.FIT,        // fit into available space
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,                    // base “design” resolution
    height: 600
  },
  scene: [IntroScene, MenuScene, GlossaryScene, CampScene, ScoutPracticeScene]
};

new Phaser.Game(config);