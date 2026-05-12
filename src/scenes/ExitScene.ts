import * as Phaser from 'phaser';

export class ExitScene extends Phaser.Scene {
  constructor() {
    super('ExitScene');
  }

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL)
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.addText(width, height); // 👈 Pass dimensions
  }

  private addText(width: number, height: number) {
    const EXIT_TEXT = "I have heard their groans and sighs, and seen their tears, and I would give every drop of blood in my veins to free them.";

    const FONT_FAMILY = 'Cardo'
    WebFont.load({
      google: {
        families: [FONT_FAMILY]
      },
      active: () => {
        this.add.text(width / 2, height / 2, EXIT_TEXT + '\n\n' + '- Harriet Tubman', {
          fontSize: '28px',
          color: '#ffffff',
          backgroundColor: '#000000',
          fontFamily: FONT_FAMILY,
          padding: { x: 20, y: 20 },
          wordWrap: { width: width * 0.6 },
          align: 'left',
        }).setOrigin(0.5, 0.5);
      }
    })
  }
}