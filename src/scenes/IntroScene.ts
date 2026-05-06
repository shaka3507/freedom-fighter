import * as Phaser from 'phaser';

export class IntroScene extends Phaser.Scene {
  private music!: Phaser.Sound.BaseSound;

  constructor() {
    super('IntroScene');
  }

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL)
    this.load.image('backgroundIntro', 'assets/background/intro_scene_background.png');
    this.load.audio('introMusic', 'assets/audio/forest-sound.mp3');
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(0, 0, 'backgroundIntro')
      .setOrigin(0, 0)
      .setDisplaySize(width, height);

    this.music = this.sound.add('introMusic', {
      volume: 0.5,
      loop: true,
    });

    // Blinking prompt
    const clickText = this.add.text(width / 2, height / 2, 'Click to begin', {
      fontSize: '36px',
      color: '#ffffff',
      backgroundColor: 'black'
    }).setOrigin(0.5, -1);

    this.tweens.add({
      targets: clickText,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => {
      clickText.destroy();

      this.music.play();

      this.cameras.main.fadeIn(1000, 0, 0, 0);

      this.time.delayedCall(500, () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once(
          Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
          () => this.scene.start('MenuScene')
        );
      });
    });
  }
}