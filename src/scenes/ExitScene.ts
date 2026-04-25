// src/scenes/ExitScene.ts
import * as Phaser from 'phaser';

export class ExitScene extends Phaser.Scene {
  constructor() {
    super('ExitScene');
  }

  preload() {
    // Arguments: (key, path)
    this.load.image('background', 'src/assets/1863_intro_scene_background.png');
  }

  create() {
    const { width, height } = this.scale;

    let bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    
    bg.setDisplaySize(this.sys.game.config.width, this.sys.game.config.height)

    // Fade in from black
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Wait a bit, then fade out and go to menu
    this.time.delayedCall(1000 * 60 * 60, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);

      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start('MenuScene');
        }
      );
    });
  }
}