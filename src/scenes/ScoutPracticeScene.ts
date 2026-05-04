// src/scenes/ScoutPracticeScene.ts
import * as Phaser from 'phaser';

type TrapType = 'explosive' | 'trap';

export interface ScoutPracticeSceneConfig {
  backgroundKey: string;   // river at night
  trapKeys: string[];      // list of sprite keys to randomly use for traps/explosives
  notebookKey: string;     // sprite for the score icon
  numTraps?: number;       // optional, we’ll also use time-based spawning
}

interface TrapData {
  type: TrapType;
  points: number;
}

export class ScoutPracticeScene extends Phaser.Scene {
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private notebookIcon!: Phaser.GameObjects.Sprite;
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

  // NEW: background motion tween + flags
  private riverMotionTween?: Phaser.Tweens.Tween;
  private isMotionEnabled = true;
  private isSoundEnabled = true;

  constructor() {
    super('ScoutPracticeScene');
  }

  preload() {
    // Fallback images (optional)
    if (!this.textures.exists('fallbackBackground')) {
      this.load.image('fallbackBackground', 'src/assets/art/river_night_bg.png');
    }

    if (!this.textures.exists('fallbackTrap')) {
      this.load.image('fallbackTrap', 'src/assets/fallback/trap.png');
    }
    if (!this.textures.exists('fallbackNotebook')) {
      this.load.image('fallbackNotebook', 'src/assets/fallback/notebook.png');
    }

    // REAL background image (make sure this path is correct)
    this.load.image('river_night_bg', 'src/assets/art/river_night_bg.png');

    // AUDIO – just load; do not add/play here
    this.load.audio('boatWaterLoop', 'src/assets/audio/rowboat.mp3');
    this.load.audio('sfxPencil', 'src/assets/audio/pencil.mp3');
  }

  create(data: ScoutPracticeSceneConfig) {
    // Safely stop intro music if present
    const intro = this.sound.get('introMusic');
    intro?.stop();

    this.configData = {
      backgroundKey: data.backgroundKey || 'fallbackBackground',
      trapKeys: data.trapKeys?.length ? data.trapKeys : ['fallbackTrap'],
      notebookKey: data.notebookKey || 'fallbackNotebook',
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

    // Gentle background motion (vertical bob)
    this.riverMotionTween = this.tweens.add({
      targets: this.riverBg,
      y: this.riverBg.y + 10,  // move down a bit
      duration: 6000,          // 6 seconds
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    // -----------------------------------------------------------------------
    // Bottom boat edge / UI (as if you see edge of boat at bottom)
    // -----------------------------------------------------------------------
    const boat = this.add
      .sprite(width / 2, height, this.configData.boatKey)
      .setOrigin(0.5, 1) // bottom center
      .setScrollFactor(0);

    // little bobbing motion for boat
    this.tweens.add({
      targets: boat,
      y: height - 10,
      duration: 1500,
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
        if (this.trapsSpawned >= this.maxTraps) return;
        this.spawnTrap();
        this.trapsSpawned++;
      }
    });

    // Score UI
    this.createScoreUI();

    // Simple overlay text (you can remove later)
    this.add
      .text(width / 2, 40, 'Scout Practice: River Patrol', {
        fontSize: '28px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.add.text(
      50,
      80,
      'Identify and click on the Confederate torpedos and traps as you pass them in your boat. This info is vital for the mission.\n' +
        'They appear ahead, move closer, then pass by.',
      {
        fontSize: '18px',
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
    const yStart = height * 0.2;
    const yEnd = height * 0.9;

    const textureKey = Phaser.Utils.Array.GetRandom(this.configData.trapKeys);
    const sprite = this.add.sprite(x, yStart, textureKey).setInteractive({
      useHandCursor: true
    });

    const startScale = 0.9;
    const endScale = 1.4;
    sprite.setScale(startScale);

    const isExplosive = Math.random() < 0.7;
    const trapData: TrapData = {
      type: isExplosive ? 'explosive' : 'trap',
      points: isExplosive ? 10 : 5
    };
    sprite.setData('trapData', trapData);

    sprite.on('pointerup', () => this.onTrapClicked(sprite));

    this.trapGroup.add(sprite);

    const travelDuration = Phaser.Math.Between(4500, 5500);

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
  // Score UI
  // -------------------------------------------------------------------------

  private createScoreUI() {
    this.score = 0;

    this.notebookIcon = this.add
      .sprite(20, this.scale.height - 20, this.configData.notebookKey)
      .setOrigin(0, 1)
      .setScale(0.7)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(
        this.notebookIcon.x + this.notebookIcon.displayWidth + 10,
        this.notebookIcon.y - this.notebookIcon.displayHeight / 2,
        'x 0\n[0.000, 0.000]',
        {
          fontSize: '18px',
          color: '#ffffff'
        }
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0);
  }

  private addScore(points: number, worldX: number, worldY: number) {
    this.score += points;

    const coordX = (worldX / this.scale.width).toFixed(3);
    const coordY = (worldY / this.scale.height).toFixed(3);
    this.scoreText.setText(`x ${this.score}\n[${coordX}, ${coordY}]`);

    const floatText = this.add
      .text(worldX, worldY - 20, `+${points}`, {
        fontSize: '20px',
        color: '#ffff66',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: floatText,
      y: worldY - 60,
      alpha: 0,
      duration: 600,
      ease: 'Sine.out',
      onComplete: () => floatText.destroy()
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

      // Toggle only boat loop + future sounds
      if (this.boatLoopSound) {
        this.boatLoopSound.setMute(!this.isSoundEnabled);
      }
      // Any other SFX check isSoundEnabled before playing (already done for pencil)

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