// src/scenes/ScoutPracticeScene.ts
import * as Phaser from 'phaser';

type TrapType = 'explosive' | 'trap';

export interface ScoutPracticeSceneConfig {
  backgroundKey: string;   // river at night
  trapKeys: string[];      // list of sprite keys to randomly use for traps/explosives
  numTraps?: number;       // optional, we’ll also use time-based spawning
}

interface TrapData {
  type: TrapType;
  points: number;
}

export class ScoutPracticeScene extends Phaser.Scene {
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private configData!: ScoutPracticeSceneConfig;

  private riverBg!: Phaser.GameObjects.Image;
  private trapGroup!: Phaser.GameObjects.Group;
  private trapsSpawned = 0;
  private maxTraps = 999; // or use configData.numTraps

  private confirmOverlay?: Phaser.GameObjects.Rectangle;
  private confirmPanel?: Phaser.GameObjects.Rectangle;
  private confirmText?: Phaser.GameObjects.Text;
  private confirmLeaveBtn?: Phaser.GameObjects.Text;
  private confirmCancelBtn?: Phaser.GameObjects.Text;
  private isConfirmOpen = false;

  private boatLoopSound?: Phaser.Sound.BaseSound;

  // background motion tween + flags
  private riverMotionTween?: Phaser.Tweens.Tween;
  private isMotionEnabled = true;
  private isSoundEnabled = true;

  // practice over
  private practiceOverlay?: Phaser.GameObjects.Rectangle;
  private practicePanel?: Phaser.GameObjects.Rectangle;
  private practiceText?: Phaser.GameObjects.Text;
  private practiceMoreBtn?: Phaser.GameObjects.Text;
  private practiceCampBtn?: Phaser.GameObjects.Text;
  private isPracticeDialogOpen = false;

  private didYouKnowFacts: string[] = [
    'Harriet Tubman served as a scout and spy for the Union Army during the Civil War.',
    'On June 2, 1863, Harriet Tubman helped lead the Combahee River Raid, freeing more than 700 enslaved people.'
    // add more as needed…
  ];

  constructor() {
    super('ScoutPracticeScene');
  }

  preload() {
    // Fallback background (optional)
    if (!this.textures.exists('fallbackBackground')) {
      this.load.image('fallbackBackground', 'src/assets/background/river_night_bg.png');
    }

    // Real background image
    this.load.image('river_night_bg', 'src/assets/background/river_night_bg.png');

    // Traps
    this.load.image('torpedo_barrel_01', 'src/assets/art/torpedo_barrel_01.png');
    this.load.image('torpedo_logframe_01', 'src/assets/art/torpedo_log_barrel_01.png');

    // AUDIO – just load; do not add/play here
    this.load.audio('boatWaterLoop', 'src/assets/audio/rowboat.mp3');
    this.load.audio('sfxPencil', 'src/assets/audio/pencil.mp3');
  }

  create(data: ScoutPracticeSceneConfig) {
    // Safely stop intro music if present
    const intro = this.sound.get('introMusic');
    intro?.stop();

    this.configData = {
      backgroundKey: 'fallbackBackground', // or 'river_night_bg' if you prefer
      trapKeys: data.trapKeys?.length
        ? data.trapKeys
        : ['torpedo_barrel_01', 'torpedo_logframe_01'],
      numTraps: data.numTraps ?? 100
    };
    this.maxTraps = this.configData.numTraps!;

    const { width, height } = this.scale;

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // -----------------------------------------------------------------------
    // Background: static image that covers the entire game area
    // -----------------------------------------------------------------------
    this.riverBg = this.add
      .image(width / 2, height / 2, this.configData.backgroundKey)
      .setScrollFactor(0);

    // Scale it like CSS "background-size: cover"
    const bgWidth = this.riverBg.width;
    const bgHeight = this.riverBg.height;

    const scaleX = width / bgWidth;
    const scaleY = height / bgHeight;
    const scale = Math.max(scaleX, scaleY);

    this.riverBg.setScale(scale);

    // Slight downward drift to simulate moving forward
    this.riverMotionTween = this.tweens.add({
      targets: this.riverBg,
      y: this.riverBg.y + 40,  // moves river "down" under the boat
      duration: 12000,         // 12 seconds for a slow slide
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    // -----------------------------------------------------------------------
    // AUDIO: start boat/water loop, but only if it exists in cache
    // -----------------------------------------------------------------------
    if (this.cache.audio.exists('boatWaterLoop')) {
      this.boatLoopSound = this.sound.add('boatWaterLoop', {
        loop: true,
        volume: 1
      });
      if (this.isSoundEnabled) {
        this.boatLoopSound.play();
      }
    } else {
      console.warn('boatWaterLoop audio not found in cache; check assets/audio/rowboat.mp3 path.');
    }

    // -----------------------------------------------------------------------
    // Traps group + timed spawning
    // -----------------------------------------------------------------------
    this.trapGroup = this.add.group();

    this.time.addEvent({
      delay: 900,        // ms between spawns
      loop: true,
      callback: () => {
        if (this.trapsSpawned >= this.maxTraps) {
          if (!this.isPracticeDialogOpen) {
            this.openPracticeDialog();
          }
          return;
        }
        this.spawnTrap();
        this.trapsSpawned++;
      }
    });

    // Score UI (top, prominent)
    this.createScoreUI();

    // Instructions
    this.add.text(
      50,
      80,
      'Identify and click on the Confederate torpedos and traps as you pass them in your boat. This info is vital for the mission.\n' +
        'They appear ahead, move closer, then pass by.',
      {
        fontSize: '20px',
        backgroundColor: 'navyblue',
        color: '#ffffff',
        wordWrap: { width: width - 100 }
      }
    );

    this.addBackButton();
    this.addToggles();
  }

  // -------------------------------------------------------------------------
  //  POV-style trap spawning: from “horizon” downward, scaling up
  // -------------------------------------------------------------------------

  private spawnTrap() {
    const { width, height } = this.scale;

    const x = Phaser.Math.Between(width * 0.2, width * 0.8);
    const yStart = height * 0.3;  // further "ahead"
    const yEnd = height * 0.95;   // closer to "boat"

    const textureKey = Phaser.Utils.Array.GetRandom(this.configData.trapKeys);
    const sprite = this.add.sprite(x, yStart, textureKey).setInteractive({
      useHandCursor: true
    });

    const startScale = 0.2;
    const endScale = 0.5;
    sprite.setScale(startScale);

    const isExplosive = Math.random() < 0.7;
    const trapData: TrapData = {
      type: isExplosive ? 'explosive' : 'trap',
      points: isExplosive ? 10 : 5
    };
    sprite.setData('trapData', trapData);

    sprite.on('pointerup', () => this.onTrapClicked(sprite));
    this.trapGroup.add(sprite);

    const travelDuration = Phaser.Math.Between(3800, 4800);

    this.tweens.add({
      targets: sprite,
      y: yEnd,
      scale: endScale,
      duration: travelDuration,
      ease: 'Linear',
      onComplete: () => {
        if (sprite.active) sprite.destroy();
      }
    });
  }

  private onTrapClicked(sprite: Phaser.GameObjects.Sprite) {
    const trapData = sprite.getData('trapData') as TrapData | undefined;
    if (!trapData) return;

    if (this.cache.audio.exists('sfxPencil') && this.isSoundEnabled) {
      this.sound.play('sfxPencil', { volume: 0.9 });
    }

    this.addScore(trapData.points, sprite.x, sprite.y);

    this.tweens.add({
      targets: sprite,
      alpha: 0,
      scale: sprite.scale * 0.4,
      duration: 200,
      ease: 'Back.in',
      onComplete: () => sprite.destroy()
    });
  }

  // -------------------------------------------------------------------------
  // Score UI (top-center, no notebook, no coordinates)
  // -------------------------------------------------------------------------

  private createScoreUI() {
    this.score = 0;

    const { width } = this.scale;

    this.scoreText = this.add
      .text(
        width / 2,
        20,
        'Score: 0',
        {
          fontSize: '32px',
          color: '#ffff66',
          stroke: '#000000',
          strokeThickness: 4
        }
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0);
  }

  // -------------------------------------------------------------------------
  // Practice dialog
  // -------------------------------------------------------------------------

  private openPracticeDialog() {
    this.isPracticeDialogOpen = true;

    const { width, height } = this.scale;

    // Dark overlay
    this.practiceOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.6
    ).setScrollFactor(0);
    this.practiceOverlay.setDepth(900);

    // Panel
    const panelWidth = 680;
    const panelHeight = 260;

    this.practicePanel = this.add.rectangle(
      width / 2,
      height / 2,
      panelWidth,
      panelHeight,
      0x222222,
      0.95
    ).setStrokeStyle(4, 0xffffff);
    this.practicePanel.setDepth(901).setScrollFactor(0);

    // Text
    const message =
      'You have finished this round of scouting practice.\n\n' +
      'Would you like to keep practicing, or return to camp?';

    this.practiceText = this.add.text(
      width / 2,
      height / 2 - 50,
      message,
      {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelWidth - 40 }
      }
    ).setOrigin(0.5).setDepth(902).setScrollFactor(0);

    // Practice more button
    this.practiceMoreBtn = this.add.text(
      width / 2 - 140,
      height / 2 + 50,
      'Practice More',
      {
        fontSize: '22px',
        color: '#66ff66',
        backgroundColor: '#000000'
      }
    )
      .setPadding(12, 8, 12, 8)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(902)
      .setScrollFactor(0);

    this.practiceMoreBtn.on('pointerup', () => {
      this.closePracticeDialog();
      this.resetPractice();
    });

    // Back to Camp button
    this.practiceCampBtn = this.add.text(
      width / 2 + 140,
      height / 2 + 50,
      'Back to Camp',
      {
        fontSize: '22px',
        color: '#ffcc66',
        backgroundColor: '#000000'
      }
    )
      .setPadding(12, 8, 12, 8)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(902)
      .setScrollFactor(0);

    this.practiceCampBtn.on('pointerup', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('CampScene')
      );
    });
  }

  private closePracticeDialog() {
    this.isPracticeDialogOpen = false;

    this.practiceOverlay?.destroy();
    this.practicePanel?.destroy();
    this.practiceText?.destroy();
    this.practiceMoreBtn?.off('pointerup');
    this.practiceCampBtn?.off('pointerup');
    this.practiceMoreBtn?.destroy();
    this.practiceCampBtn?.destroy();
  }

  // Reset practice so player can continue
  private resetPractice() {
    this.trapGroup.clear(true, true);

    this.trapsSpawned = 0;
    this.maxTraps = this.configData.numTraps ?? 100;
    this.score = 0;
    this.scoreText.setText('Score: 0');
  }

  // -------------------------------------------------------------------------
  // Score handling with "Log recorded"
  // -------------------------------------------------------------------------

  private addScore(points: number, worldX: number, worldY: number) {
    this.score += points;

    // Update score only
    this.scoreText.setText(`Score: ${this.score}`);

    // Points popup
    const floatPoints = this.add
      .text(worldX, worldY - 20, `+${points}`, {
        fontSize: '20px',
        color: '#ffff66',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: floatPoints,
      y: worldY - 60,
      alpha: 0,
      duration: 600,
      ease: 'Sine.out',
      onComplete: () => floatPoints.destroy()
    });

    // "Log recorded" message
    const logText = this.add
      .text(worldX, worldY + 10, 'Trap recorded', {
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: logText,
      y: worldY - 10,
      alpha: 0,
      duration: 700,
      ease: 'Sine.out',
      onComplete: () => logText.destroy()
    });
  }

  // -------------------------------------------------------------------------
  // No per-frame background movement; tween handles motion
  // -------------------------------------------------------------------------

  update(time: number, delta: number) {
    // No manual background scrolling for now.
  }

  // -------------------------------------------------------------------------
  // Back button + confirm dialog
  // -------------------------------------------------------------------------

  private addBackButton() {
    const back = this.add
      .text(20, 20, '< Back to Menu', {
        fontSize: '20px',
        color: '#ffff00'
      })
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    back.on('pointerup', () => {
      if (!this.isConfirmOpen) {
        this.openConfirmDialog();
      }
    });
  }

  private openConfirmDialog() {
    this.isConfirmOpen = true;

    const { width, height } = this.scale;

    this.confirmOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.6
    ).setScrollFactor(0);
    this.confirmOverlay.setDepth(1000);

    const panelWidth = 600;
    const panelHeight = 260;

    this.confirmPanel = this.add.rectangle(
      width / 2,
      height / 2,
      panelWidth,
      panelHeight,
      0x222222,
      0.95
    ).setStrokeStyle(4, 0xffffff);
    this.confirmPanel.setDepth(1001).setScrollFactor(0);

    const message =
      'Are you sure you want to leave?\n' +
      'Progress will not be saved.';

    this.confirmText = this.add.text(
      width / 2,
      height / 2 - 50,
      message,
      {
        fontSize: '26px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelWidth - 40 }
      }
    ).setOrigin(0.5).setDepth(1002).setScrollFactor(0);

    this.confirmLeaveBtn = this.add.text(
      width / 2 - 120,
      height / 2 + 50,
      'Leave',
      {
        fontSize: '24px',
        color: '#ff6666',
        backgroundColor: '#000000'
      }
    )
      .setPadding(12, 8, 12, 8)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(1002)
      .setScrollFactor(0);

    this.confirmLeaveBtn.on('pointerup', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.boatLoopSound?.stop();
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('MenuScene')
      );
    });

    this.confirmCancelBtn = this.add.text(
      width / 2 + 120,
      height / 2 + 50,
      'Cancel',
      {
        fontSize: '24px',
        color: '#66ff66',
        backgroundColor: '#000000'
      }
    )
      .setPadding(12, 8, 12, 8)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(1002)
      .setScrollFactor(0);

    this.confirmCancelBtn.on('pointerup', () => {
      this.closeConfirmDialog();
    });
  }

  private closeConfirmDialog() {
    this.isConfirmOpen = false;

    this.confirmOverlay?.destroy();
    this.confirmPanel?.destroy();
    this.confirmText?.destroy();
    this.confirmLeaveBtn?.off('pointerup');
    this.confirmCancelBtn?.off('pointerup');
    this.confirmLeaveBtn?.destroy();
    this.confirmCancelBtn?.destroy();
  }

  // -------------------------------------------------------------------------
  // Sound & Motion toggles (top-right)
  // -------------------------------------------------------------------------

  private addToggles() {
    const { width } = this.scale;

    // Sound toggle
    const soundText = this.add.text(
      width - 20,
      20,
      'Sound: On',
      {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000'
      }
    )
      .setOrigin(1, 0) // top-right
      .setPadding(8, 4, 8, 4)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    soundText.on('pointerup', () => {
      this.isSoundEnabled = !this.isSoundEnabled;

      if (this.boatLoopSound) {
        this.boatLoopSound.setMute(!this.isSoundEnabled);
      }

      soundText.setText(this.isSoundEnabled ? 'Sound: On' : 'Sound: Off');
    });

    // Motion toggle (background motion only)
    const motionText = this.add.text(
      width - 20,
      50,
      'Motion: On',
      {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000'
      }
    )
      .setOrigin(1, 0)
      .setPadding(8, 4, 8, 4)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    motionText.on('pointerup', () => {
      this.isMotionEnabled = !this.isMotionEnabled;

      if (this.riverMotionTween) {
        if (this.isMotionEnabled) {
          this.riverMotionTween.resume();
        } else {
          this.riverMotionTween.pause();
        }
      }

      motionText.setText(this.isMotionEnabled ? 'Motion: On' : 'Motion: Off');
    });
  }
}