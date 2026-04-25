// src/scenes/MenuScene.ts
import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.add
      .text(width / 2, height * 0.2, 'Main Menu', {
        fontSize: '40px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const options = [
      { label: 'How To Play', scene: 'HelpScene' },
      { label: 'Camp', scene: 'CampScene' },
      { label: 'Scout Practice', scene: 'ScoutPracticeScene' },
      { label: 'Glossary', scene: 'GlossaryScene' },
    ];

    const startY = height * 0.35;
    const gap = 60;

    options.forEach((opt, index) => {
      const text = this.add
        .text(width / 2, startY + index * gap, opt.label, {
          fontSize: '28px',
          color: '#fff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        text.setStyle({ color: 'green' });
      });

      text.on('pointerout', () => {
        text.setStyle({ color: '#fff' });
      });

      text.on('pointerup', () => {
        this.handleMenuClick(opt.scene);
      });
    });
  }

  private handleMenuClick(targetScene: string) {
    this.cameras.main.fadeOut(400, 0, 0, 0);

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start(targetScene);
      }
    );
  }
}