import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL)
    this.load.image('backgroundMenu', 'assets/background/beautiful_creek_night.png');
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
  }

  create() {
    const FONT_FAMILY = 'Cardo';
    const { width, height } = this.scale;

    this.cameras.main.fadeIn(500, 0, 0, 0);
    

    const music = this.sound.get('introMusic') as Phaser.Sound.BaseSound | null;

    this.add.image(0, 0, 'backgroundMenu')
      .setOrigin(0, 0)
      .setDisplaySize(width, height);

    // 👇 Everything that uses the font goes inside active()
    WebFont.load({
      google: {
          families: [FONT_FAMILY]
      },
      active: () => { 
        this.add.text(width / 2, height * 0.2, 'Main Menu', {
          fontFamily: FONT_FAMILY, 
          fontSize: '48px',
          letterSpacing: 2,
          color: '#ffffff',
          backgroundColor: 'navyblue',
        }).setOrigin(0.5);

        const options = [
          { label: 'How To Play', scene: 'HelpScene' },
          { label: 'Camp', scene: 'CampScene' },
          { label: 'Scout Practice', scene: 'ScoutPracticeScene' },
          { label: 'Glossary', scene: 'GlossaryScene' },
          { label: 'Quit Game', scene: 'ExitScene' },
        ];

        const startY = height * 0.35;
        const gap = 60;

        options.forEach((opt, index) => {
          const text = this.add
            .text(width / 2, startY + index * gap, opt.label, {
              fontSize: '48px',
              color: '#fff',
              backgroundColor: 'navyblue',
              fontFamily: FONT_FAMILY,
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

          text.on('pointerover', () => text.setStyle({ color: 'yellow', fontSize: '52px', fontFamily: FONT_FAMILY }));
          text.on('pointerout', () => text.setStyle({ color: '#fff', fontSize: '48px', fontFamily: FONT_FAMILY }));

          text.on('pointerup', () => {
            this.handleMenuClick(opt.scene);
          });
        });
      },
    });
  }

  private handleMenuClick(targetScene: string) {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => this.scene.start(targetScene)
    );
  }
}