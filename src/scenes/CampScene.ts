// src/scenes/CampScene.ts
import * as Phaser from 'phaser';

export class CampScene extends Phaser.Scene {
  constructor() {
    super('CampScene');
  }

  preload() {
    this.load.image('camp_bg', 'src/assets/background/camp_bg.png');
    
    this.load.image('img_tubman_invoice', 'src/assets/docs/tubman_invoice.png');
    this.load.image('img_josie_king_taylor', 'src/assets/docs/josie_king_taylor.png');
    this.load.image('img_confed_evac_flyer', 'src/assets/docs/confederate_evac_flyer.png');
    this.load.image('img_self_liberated_list', 'src/assets/docs/self_liberated_list.png');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Background
    const bg = this.add
      .image(width / 2, height / 2, 'camp_bg')
      .setScrollFactor(0);

    // Scale like CSS background-size: cover
    const bgW = bg.width;
    const bgH = bg.height;
    const scaleX = width / bgW;
    const scaleY = height / bgH;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    // Title text (optional, you can remove later)
    this.add
      .text(width / 2, 80, 'Camp', {
        fontSize: '36px',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.add.text(
      50,
      140,
      'Click on items in camp to talk and collect mementos (prototype placeholder).',
      {
        fontSize: '20px',
        color: '#ffffff',
        wordWrap: { width: width - 100 }
      }
    ).setScrollFactor(0);

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