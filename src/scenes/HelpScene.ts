// src/scenes/HelpScene.ts
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
    this.addHelpText();
  }

  private addHelpText() {
    const TEXT = "Welcome to late May 1863. You're a scout for the Federal Army (Union), and was born into slavery. You have the honor of working with 'Moses', a.k.a. Harriet Tubman. The mission is dangerous - you and other freed men are going to complete a raid on several plantations in the Carolinas low country. Not only will this be an extreme blow to the Confederates, hundreds of Freedom Seekers will finally be free."
    const helpText = this.add.text(0, 0, TEXT, { fixedWidth: '500px', fontSize: '20px', backgroundColor: 'black', color: 'white'}).setOrigin(0,0)
  }

  private addBackButton() {
    const back = this.add
      .text(20, 20, '< Back to Menu', {
        fontSize: '24px',
        backgroundColor: 'black',
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

  private addStopMusicButton() {
    const stopMusic = this.add.text(1700, 20, 'Mute Music', {
        fontSize: '24px',
        backgroundColor: 'black',
        color: 'red'
    }).setInteractive({ useHandCursor: true})

    stopMusic.on('pointerup', () => {
        this.sound.get('introMusic').stop()
    })
  }
}