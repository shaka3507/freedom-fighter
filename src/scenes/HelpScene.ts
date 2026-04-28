import * as Phaser from 'phaser';

export class HelpScene extends Phaser.Scene {
  constructor() {
    super('HelpScene');
  }

  preload() {
    this.load.image('backgroundHelp', 'src/assets/background/help_scene_background.png');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.add.image(0, 0, 'backgroundHelp')
      .setOrigin(0, 0)
      .setDisplaySize(width, height);

    this.addBackButton();
    this.addStopMusicButton();
    this.addBackstoryText(width, height); // 👈 Pass dimensions
  }

  private addBackstoryText(width: number, height: number) {
    const EXPLAINER_TEXT = "Welcome to late May 1863. You're a scout for the Federal Army (Union), and was born into slavery. You have the honor of working with 'Moses', a.k.a. Harriet Tubman. The mission is dangerous - you and other freed men are going to complete a raid on several plantations in the Carolinas low country. Not only will this be an extreme blow to the Confederates, hundreds of Freedom Seekers will finally be free. You're mission is to scout out traps set by the confederate, and collect momentos to bring back to New York. Enter camp or scout practice to help complete your mission.";
    const DIRECTIONS_TEXT = "1) Visit camp to collect mementos and artifacts to bring back home to Weeksville, New York. \n\n2) Practice scouting by identifying traps and explosives hidden by the Confederate Army."
    this.add.text(width / 2, height / 2, EXPLAINER_TEXT, {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 20 },
      wordWrap: { width: width * 0.6 },
      align: 'left',
    }).setOrigin(0.5, 0.5);

    this.add.text(width / 2, height / 2, DIRECTIONS_TEXT, {
      fontSize: '36px',
      color: '#000',
      backgroundColor: '#fff',
      padding: { x: 20, y: 20 },
      wordWrap: { width: width * 0.7 },
      align: 'left',
    }).setOrigin(0.5, -1);
  }
  

  private addBackButton() {
    const back = this.add
      .text(20, 20, '< Back to Menu', {
        fontSize: '24px',
        backgroundColor: 'black',
        color: '#ffff00',
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

  private addStopMusicButton() {
    const stopMusic = this.add
      .text(1700, 20, 'Mute Music', {
        fontSize: '24px',
        backgroundColor: 'black',
        color: 'red',
      })
      .setInteractive({ useHandCursor: true });

    stopMusic.on('pointerup', () => {
      this.sound.get('introMusic').stop();
    });
  }
}