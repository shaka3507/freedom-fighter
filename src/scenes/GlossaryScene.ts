// src/scenes/GlossaryScene.ts
import * as Phaser from 'phaser';

export class GlossaryScene extends Phaser.Scene {
  constructor() {
    super('GlossaryScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.add
      .text(width / 2, 80, 'Glossary', {
        fontSize: '36px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.addBackButton();
    this.addGlossaryText(width, height);
  }

  private addGlossaryText(width: number, height: number) {
    const definition1 = "Combahee River (/kəmˈbiː/ kəm-BEE)\nA short blackwater river in the southern Lowcountry region of South Carolina formed at the confluence of the Salkehatchie and Little Salkehatchie rivers near the Islandton community of Colleton County, South Carolina. It takes its name from the Combahee tribe, a Muskogean-speaking Native American group of the Cusabo group, who originally inhabited the area."

    this.add.text(width / 2, height / 2, definition1, {
      fontSize: '36px',
      color: '#000',
      backgroundColor: '#fff',
      padding: { x: 20, y: 20 },
      wordWrap: { width: width * 0.5 },
      align: 'left',
    }).setOrigin(0.5, 0.5);
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