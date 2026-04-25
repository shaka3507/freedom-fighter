// src/scenes/IntroScene.ts
import * as Phaser from 'phaser';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    const { width, height } = this.scale;

    const title = this.add.text(width / 2, height / 2, '1863: Harriet Tubman and the Combahee River Raid', {
      fontSize: '18px',
      color: '#ffffff'
    });
    title.setOrigin(0.5);

    // Fade in from black
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Wait a bit, then fade out and go to menu
    this.time.delayedCall(2000, () => {
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