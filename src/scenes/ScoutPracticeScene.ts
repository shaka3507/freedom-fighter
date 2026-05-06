// src/scenes/ScoutPracticeScene.ts
import * as Phaser from 'phaser';

type TrapType = 'explosive' | 'trap';

export interface ScoutPracticeSceneConfig {
  backgroundKey: string;
  trapKeys: string[];
  numTraps?: number;
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
  private maxTraps = 999;

  private confirmOverlay?: Phaser.GameObjects.Rectangle;
  private confirmPanel?: Phaser.GameObjects.Rectangle;
  private confirmText?: Phaser.GameObjects.Text;
  private confirmLeaveBtn?: Phaser.GameObjects.Text;
  private confirmCancelBtn?: Phaser.GameObjects.Text;
  private isConfirmOpen = false;

  private boatLoopSound?: Phaser.Sound.BaseSound;

  private riverMotionTween?: Phaser.Tweens.Tween;
  private isMotionEnabled = true;
  private isSoundEnabled = true;

  private practiceOverlay?: Phaser.GameObjects.Rectangle;
  private practicePanel?: Phaser.GameObjects.Rectangle;
  private practiceText?: Phaser.GameObjects.Text;
  private practiceMoreBtn?: Phaser.GameObjects.Text;
  private practiceCampBtn?: Phaser.GameObjects.Text;
  private isPracticeDialogOpen = false;

  // Danger tracking
  private dangerLevel = 0;
  private maxDanger = 5;
  private dangerBar!: Phaser.GameObjects.Rectangle;
  private dangerBarFill!: Phaser.GameObjects.Rectangle;
  private dangerLabel!: Phaser.GameObjects.Text;

  private currentFactBanner?: Phaser.GameObjects.Rectangle;
  private currentFactText?: Phaser.GameObjects.Text;

  private missedFacts: Record<TrapType, string[]> = {
    explosive: [
      'Torpedo passed! Confederate torpedoes sank the USS Cairo in 1862 — the first ship ever sunk by an electronic mine.',
      'Unrecorded torpedo! Harriet Tubman\'s scouts mapped these exact positions to keep the gunboats safe.',
      'Torpedo missed! These were packed with gunpowder and triggered on contact with a hull.',
    ],
    trap: [
      'Trap missed! Enslaved people along the river risked their lives passing this intelligence to Union scouts.',
      'Unrecorded trap! The lead gunboat John Adams depended on scouts like you to navigate safely.',
      'Trap passed! Confederate engineers designed these to stop Union gunboats from reaching the plantations.',
    ]
  };

  private didYouKnowFacts: string[] = [
    'Harriet Tubman served as a scout and spy for the Union Army during the Civil War.',
    'On June 2, 1863, Harriet Tubman helped lead the Combahee River Raid, freeing more than 700 enslaved people.'
  ];

  // -------------------------------------------------------------------------
  // Top HUD
  // -------------------------------------------------------------------------

  private hudBar!: Phaser.GameObjects.Rectangle;
  private menuButton!: Phaser.GameObjects.Text;
  private soundIcon!: Phaser.GameObjects.Text;
  private motionIcon!: Phaser.GameObjects.Text;

  // Slide-out menu panel
  private isMenuOpen = false;
  private menuPanel?: Phaser.GameObjects.Rectangle;
  private menuPanelTitle?: Phaser.GameObjects.Text;
  private menuBackBtn?: Phaser.GameObjects.Text;
  private menuCloseZone?: Phaser.GameObjects.Zone;

  // Mission briefing
  private isBriefingOpen = false;
  private briefingOverlay?: Phaser.GameObjects.Rectangle;
  private briefingPanel?: Phaser.GameObjects.Rectangle;
  private briefingTitle?: Phaser.GameObjects.Text;
  private briefingText?: Phaser.GameObjects.Text;
  private briefingButton?: Phaser.GameObjects.Text;

  // Trap spawn control (start only after briefing)
  private spawnTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('ScoutPracticeScene');
  }

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL);

    if (!this.textures.exists('fallbackBackground')) {
      this.load.image('fallbackBackground', 'assets/background/river_night_bg.png');
    }

    this.load.image('river_night_bg', 'assets/background/river_night_bg.png');
    this.load.image('torpedo_barrel_01', 'assets/art/torpedo_barrel_01.png');
    this.load.image('torpedo_logframe_01', 'assets/art/torpedo_log_barrel_01.png');

    this.load.audio('boatWaterLoop', 'assets/audio/rowboat.mp3');
    this.load.audio('sfxPencil', 'assets/audio/pencil.mp3');
  }

  create(data: ScoutPracticeSceneConfig) {
    const intro = this.sound.get('introMusic');
    intro?.stop();

    this.configData = {
      backgroundKey: 'fallbackBackground',
      trapKeys: data.trapKeys?.length
        ? data.trapKeys
        : ['torpedo_barrel_01', 'torpedo_logframe_01'],
      numTraps: data.numTraps ?? 100
    };
    this.maxTraps = this.configData.numTraps!;

    const { width, height } = this.scale;

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // -----------------------------------------------------------------------
    // Background
    // -----------------------------------------------------------------------
    this.riverBg = this.add
      .image(width / 2, height / 2, this.configData.backgroundKey)
      .setScrollFactor(0);

    const bgWidth = this.riverBg.width;
    const bgHeight = this.riverBg.height;
    const scaleX = width / bgWidth;
    const scaleY = height / bgHeight;
    const scale = Math.max(scaleX, scaleY);
    this.riverBg.setScale(scale);

    this.riverMotionTween = this.tweens.add({
      targets: this.riverBg,
      y: this.riverBg.y + 40,
      duration: 12000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    // -----------------------------------------------------------------------
    // Audio
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
      console.warn('boatWaterLoop audio not found in cache.');
    }

    // -----------------------------------------------------------------------
    // Traps group (timer will be started after briefing)
    // -----------------------------------------------------------------------
    this.trapGroup = this.add.group();

    // -----------------------------------------------------------------------
    // HUD (single top bar)
    // -----------------------------------------------------------------------
    this.createHUD();

    // -----------------------------------------------------------------------
    // Practice dialogs, confirm dialogs still available
    // (no instructions text here – moved to briefing)
    // -----------------------------------------------------------------------

    // Mission briefing overlay shown before gameplay
    this.showMissionBriefing();
  }

  // -------------------------------------------------------------------------
  // Mission briefing
  // -------------------------------------------------------------------------

  private showMissionBriefing() {
    this.isBriefingOpen = true;

    const { width, height } = this.scale;

    this.briefingOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(700)
      .setScrollFactor(0);

    const panelWidth = 520;
    const panelHeight = 320;


    this.briefingTitle = this.add
      .text(width / 2, height / 2 - panelHeight * 0.7, 'MISSION BRIEFING', {
        fontSize: '28px',
        color: '#ffffcc',
        fontStyle: 'bold',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(702)
      .setScrollFactor(0);

    const message =
      'Confederate torpedoes and traps are floating downriver.\n\n' +
      'Click each one to record it and give it back .\n\n' +
      'to Harriet Tubman and mission leadership \n\n' +
      'This intelligence is vital for the raid.';

    this.briefingText = this.add
      .text(width / 2, height / 2 - 20, message, {
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelWidth - 60 },
        lineSpacing: 4
      })
      .setOrigin(0.5)
      .setDepth(702)
      .setScrollFactor(0);

    this.briefingButton = this.add
      .text(width / 2, height / 2 + panelHeight, 'Begin Scouting \u2192', {
        fontSize: '24px',
        color: '#ffcc66',
        backgroundColor: '#000000'
      })
      .setPadding(14, 8, 14, 8)
      .setOrigin(0.5)
      .setDepth(702)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.briefingButton.on('pointerover', () => {
      this.briefingButton?.setColor('#ffffff');
    });

    this.briefingButton.on('pointerout', () => {
      this.briefingButton?.setColor('#ffcc66');
    });

    this.briefingButton.on('pointerup', () => {
      this.closeMissionBriefing();
      this.startTrapSpawning();
    });
  }

  private closeMissionBriefing() {
    this.isBriefingOpen = false;
    this.briefingOverlay?.destroy();
    this.briefingPanel?.destroy();
    this.briefingTitle?.destroy();
    this.briefingText?.destroy();
    this.briefingButton?.off('pointerup');
    this.briefingButton?.off('pointerover');
    this.briefingButton?.off('pointerout');
    this.briefingButton?.destroy();
  }

  // -------------------------------------------------------------------------
  // Trap spawning
  // -------------------------------------------------------------------------

  private startTrapSpawning() {
    if (this.spawnTimer) {
      return; // already started
    }

    this.spawnTimer = this.time.addEvent({
      delay: 900,
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
  }

  private spawnTrap() {
    const { width, height } = this.scale;

    const x = Phaser.Math.Between(width * 0.2, width * 0.8);
    const yStart = height * 0.3;
    const yEnd = height * 0.95;

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
        if (sprite.active) {
          this.onTrapMissed(sprite);
          sprite.destroy();
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // Trap clicked (success)
  // -------------------------------------------------------------------------

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
  // Trap missed (failure feedback)
  // -------------------------------------------------------------------------

  private onTrapMissed(sprite: Phaser.GameObjects.Sprite) {
    const trapData = sprite.getData('trapData') as TrapData | undefined;
    if (!trapData) return;

    // Increment danger
    this.dangerLevel = Math.min(this.dangerLevel + 1, this.maxDanger);
    this.updateDangerBar();

    // Pick a historically relevant fact for this trap type
    const facts = this.missedFacts[trapData.type];
    const fact = Phaser.Utils.Array.GetRandom(facts);

    // Red flash on the sprite before it leaves
    this.tweens.add({
      targets: sprite,
      alpha: 0,
      tint: 0xff0000,
      duration: 300,
      ease: 'Sine.out'
    });

    // "MISSED" popup at the trap's position
    const missedLabel = this.add
      .text(sprite.x, sprite.y, 'MISSED', {
        fontSize: '22px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.tweens.add({
      targets: missedLabel,
      y: sprite.y - 50,
      alpha: 0,
      duration: 700,
      ease: 'Sine.out',
      onComplete: () => missedLabel.destroy()
    });

    // Historical fact banner at the bottom of the screen
    this.showHistoricalFact(fact);

    // Every 5 misses — Harriet intervenes
    if (this.dangerLevel >= this.maxDanger) {
      this.showMissionAtRiskWarning();
      this.dangerLevel = 0;
      this.updateDangerBar();
    }
  }

  // -------------------------------------------------------------------------
  // Historical fact banner
  // -------------------------------------------------------------------------

  private showHistoricalFact(fact: string) {
    const { width, height } = this.scale;

    // Clear any existing banner before showing a new one
    this.currentFactBanner?.destroy();
    this.currentFactText?.destroy();

    this.currentFactBanner = this.add
      .rectangle(width / 2, height - 50, width - 40, 70, 0x220000, 0.9)
      .setDepth(100)
      .setScrollFactor(0);

    this.currentFactText = this.add
      .text(width / 2, height - 50, fact, {
        fontSize: '17px',
        color: '#ffaaaa',
        align: 'center',
        wordWrap: { width: width - 80 }
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setScrollFactor(0);

    this.tweens.add({
      targets: [this.currentFactBanner, this.currentFactText],
      alpha: 0,
      delay: 3000,
      duration: 500,
      ease: 'Sine.out',
      onComplete: () => {
        this.currentFactBanner?.destroy();
        this.currentFactText?.destroy();
        this.currentFactBanner = undefined;
        this.currentFactText = undefined;
      }
    });
  }

  // -------------------------------------------------------------------------
  // Harriet Tubman intervention at 5 misses
  // -------------------------------------------------------------------------

  private showMissionAtRiskWarning() {
    this.isPracticeDialogOpen = true;

    const { width, height } = this.scale;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setDepth(600)
      .setScrollFactor(0);

    const panelW = 700;
    const panelH = 340;

    const panel = this.add
      .rectangle(width / 2, height / 2, panelW, panelH, 0x1a0a00, 0.97)
      .setStrokeStyle(3, 0xffcc66)
      .setDepth(601)
      .setScrollFactor(0);

    // Harriet's dialogue
    const dialogueLines = [
      '"Too many torpedoes unrecorded, soldier.',
      'We cannot risk those gunboats.',
      '',
      'Go back to camp. Study the maps.',
      'When you\'re ready — come back to the river."',
      '',
      '— Harriet Tubman'
    ];

    this.add
      .text(
        width / 2,
        height / 2 - 80,
        dialogueLines.join('\n'),
        {
          fontSize: '22px',
          color: '#fff5e0',
          align: 'center',
          fontStyle: 'italic',
          lineSpacing: 6,
          wordWrap: { width: panelW - 80 }
        }
      )
      .setOrigin(0.5, 0)
      .setDepth(602)
      .setScrollFactor(0);

    // Return to Camp (primary — gold, prominent)
    const campBtn = this.add
      .text(
        width / 2 - 20,
        height / 2 + panelH * 0.28,
        '→ Return to Camp',
        {
          fontSize: '20px',
          color: '#ffcc66',
          backgroundColor: '#3a1a00',
        }
      )
      .setPadding(14, 8, 14, 8)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(602)
      .setScrollFactor(0);

    campBtn.on('pointerover', () => campBtn.setColor('#ffffff'));
    campBtn.on('pointerout', () => campBtn.setColor('#ffcc66'));
    campBtn.on('pointerup', () => {
      this.boatLoopSound?.stop();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('CampScene')
      );
    });

    // Keep Scouting (secondary — grey, small)
    const keepBtn = this.add
      .text(
        width / 2 + 170,
        height / 2 + panelH * 0.28,
        'Keep Scouting',
        {
          fontSize: '15px',
          color: '#888888',
          backgroundColor: '#111111',
        }
      )
      .setPadding(10, 6, 10, 6)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(602)
      .setScrollFactor(0);

    keepBtn.on('pointerover', () => keepBtn.setColor('#cccccc'));
    keepBtn.on('pointerout', () => keepBtn.setColor('#888888'));
    keepBtn.on('pointerup', () => {
      [overlay, panel, campBtn, keepBtn].forEach(o => o.destroy());
      this.dangerLevel = 0;
      this.updateDangerBar();
      this.isPracticeDialogOpen = false;
    });
  }

  // -------------------------------------------------------------------------
  // Danger bar UI (in HUD)
  // -------------------------------------------------------------------------

  private createDangerUI() {
    const { width } = this.scale;

    const barY = 28; // center of 56px HUD bar
    const barX = width / 2 + 10; // slightly right of center for label

    // Label text inside bar
    this.dangerLabel = this.add
      .text(barX - 259, barY - 10, 'Mission Risk', {
        fontSize: '14px',
        color: '#ffdddd',
        stroke: '#000000',
        strokeThickness: 2
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(120);

    // Bar background
    this.dangerBar = this.add
      .rectangle(barX + 25, barY + 4, 160, 14, 0x333333)
      .setStrokeStyle(1, 0xffffff)
      .setScrollFactor(0)
      .setDepth(120);

    // Bar fill (starts empty)
    this.dangerBarFill = this.add
      .rectangle(
        this.dangerBar.x - this.dangerBar.width / 2,
        this.dangerBar.y,
        0,
        10,
        0x44ff44
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(121);
  }

  private updateDangerBar() {
    if (!this.dangerBarFill) return;

    const fillWidth = (this.dangerLevel / this.maxDanger) * 160;
    this.dangerBarFill.width = fillWidth;

    // Color shifts: green → yellow → red
    const color =
      this.dangerLevel <= 2 ? 0x44ff44 :
        this.dangerLevel <= 4 ? 0xffaa00 :
          0xff3333;

    this.dangerBarFill.setFillStyle(color);

    // Flash when full
    if (this.dangerLevel >= this.maxDanger) {
      this.tweens.add({
        targets: this.dangerBarFill,
        alpha: 0.2,
        yoyo: true,
        repeat: 3,
        duration: 150,
        onComplete: () => this.dangerBarFill.setAlpha(1)
      });
    }
  }

  // -------------------------------------------------------------------------
  // Score UI (in HUD)
  // -------------------------------------------------------------------------

  private createScoreUI() {
    this.score = 0;

    const { width } = this.scale;

    this.scoreText = this.add
      .text(
        width * 0.25,
        16,
        'Score: 0',
        {
          fontSize: '24px',
          color: '#ffff66',
          stroke: '#000000',
          strokeThickness: 4
        }
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(120);
  }

  private addScore(points: number, worldX: number, worldY: number) {
    this.score += points;
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

    // "Trap recorded" message
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
  // Practice complete dialog
  // -------------------------------------------------------------------------

  private openPracticeDialog() {
    this.isPracticeDialogOpen = true;

    const { width, height } = this.scale;

    this.practiceOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.6
    ).setScrollFactor(0);
    this.practiceOverlay.setDepth(900);

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

  private resetPractice() {
    this.trapGroup.clear(true, true);
    this.trapsSpawned = 0;
    this.maxTraps = this.configData.numTraps ?? 100;
    this.score = 0;
    this.scoreText.setText('Score: 0');
    this.dangerLevel = 0;
    this.updateDangerBar();
    // Timer continues to run; new traps will spawn again from 0.
  }

  // -------------------------------------------------------------------------
  // Confirm dialog (Back to Menu from slide-out panel)
  // -------------------------------------------------------------------------

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
  // HUD: top bar + hamburger + icons
  // -------------------------------------------------------------------------

  private createHUD() {
    const { width } = this.scale;

    // 56px bar spanning top
    this.hudBar = this.add
      .rectangle(width / 2, 28, width, 56, 0x000000, 0.7)
      .setDepth(110)
      .setScrollFactor(0);

    // Hamburger menu icon (☰)
    this.menuButton = this.add
      .text(20, 14, '☰', {
        fontSize: '26px',
        color: '#ffffff'
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });

    this.menuButton.on('pointerup', () => {
      if (!this.isMenuOpen && !this.isConfirmOpen) {
        this.openSlideOutMenu();
      }
    });

    // Score in top bar
    this.createScoreUI();

    // Danger bar in top bar
    this.createDangerUI();

    // Sound icon (🔊 / 🔇)
    this.soundIcon = this.add
      .text(width - 70, 16, '🔊', {
        fontSize: '24px',
        color: '#ffffff'
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });

    this.soundIcon.on('pointerup', () => {
      this.isSoundEnabled = !this.isSoundEnabled;

      if (this.boatLoopSound) {
        this.boatLoopSound.setMute(!this.isSoundEnabled);
      }

      this.soundIcon.setText(this.isSoundEnabled ? '🔊' : '🔇');
    });

    // Motion icon (〰️ / ✖)
    this.motionIcon = this.add
      .text(width - 30, 16, '〰️', {
        fontSize: '24px',
        color: '#ffffff'
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });

    this.motionIcon.on('pointerup', () => {
      this.isMotionEnabled = !this.isMotionEnabled;

      if (this.riverMotionTween) {
        if (this.isMotionEnabled) {
          this.riverMotionTween.resume();
        } else {
          this.riverMotionTween.pause();
        }
      }

      this.motionIcon.setText(this.isMotionEnabled ? '〰️' : '✖');
    });
  }

  // -------------------------------------------------------------------------
  // Slide-out menu (hamburger)
  // -------------------------------------------------------------------------

  private openSlideOutMenu() {
    if (this.isMenuOpen) return;
    this.isMenuOpen = true;

    const { width, height } = this.scale;
    const panelWidth = 260;

    // Transparent full-screen zone to close on outside tap
    this.menuCloseZone = this.add
      .zone(width / 2, height / 2, width, height)
      .setInteractive({ useHandCursor: false })
      .setScrollFactor(0)
      .setDepth(790);

    this.menuCloseZone.on('pointerup', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      // If click isn't on the panel itself we close
      if (!this.menuPanel?.getBounds().contains(pointer.worldX, pointer.worldY)) {
        this.closeSlideOutMenu();
      }
    });

    // Panel starts off-screen left
    this.menuPanel = this.add
      .rectangle(-panelWidth / 2, height / 2, panelWidth, height, 0x111111, 0.95)
      .setScrollFactor(0)
      .setDepth(800);

    this.menuPanelTitle = this.add
      .text(-panelWidth / 2, 40, 'Menu', {
        fontSize: '26px',
        color: '#ffffff'
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(801);

    this.menuBackBtn = this.add
      .text(-panelWidth / 2, 110, 'Back to Menu', {
        fontSize: '22px',
        color: '#ffcc66'
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(801)
      .setInteractive({ useHandCursor: true });

    this.menuBackBtn.on('pointerup', () => {
      this.closeSlideOutMenu();
      if (!this.isConfirmOpen) {
        this.openConfirmDialog();
      }
    });

    // Slide in
    this.tweens.add({
      targets: [this.menuPanel, this.menuPanelTitle, this.menuBackBtn],
      x: `+=${panelWidth}`,
      duration: 220,
      ease: 'Sine.out'
    });
  }

  private closeSlideOutMenu() {
    if (!this.isMenuOpen) return;
    this.isMenuOpen = false;

    const panel = this.menuPanel;
    const title = this.menuPanelTitle;
    const backBtn = this.menuBackBtn;

    if (panel && title && backBtn) {
      this.tweens.add({
        targets: [panel, title, backBtn],
        x: `-=${panel.width}`,
        duration: 200,
        ease: 'Sine.in',
        onComplete: () => {
          panel.destroy();
          title.destroy();
          backBtn.destroy();
        }
      });
    }

    this.menuCloseZone?.destroy();
    this.menuCloseZone = undefined;
    this.menuPanel = undefined;
    this.menuPanelTitle = undefined;
    this.menuBackBtn = undefined;
  }

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------

  update(_time: number, _delta: number) {
    // Tween handles background motion
  }
}