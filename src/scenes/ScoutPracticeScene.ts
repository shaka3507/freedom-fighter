// src/scenes/ScoutPracticeScene.ts
import * as Phaser from 'phaser';

export class ScoutPracticeScene extends Phaser.Scene {
  constructor() {
    super('ScoutPracticeScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.add
      .text(width / 2, 80, 'ScoutPractice', {
        fontSize: '36px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.add.text(50, 140, 'Here is where your ScoutPractice content will go.', {
      fontSize: '20px',
      color: '#ffffff',
      wordWrap: { width: width - 100 }
    });

    this.addBackButton();
  }

  private addBackButton() {
    const back = this.add
      .text(20, 20, '< Back to Menu', {
        fontSize: '20px',
        color: '#ffff00'
      })
      .setInteractive({ useHandCursor: true });

    back.on('pointerup', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('MenuScene')
      );
    });
  }
}