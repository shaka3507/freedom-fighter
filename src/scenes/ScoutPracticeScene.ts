// src/scenes/ScoutPracticeScene.ts
import * as Phaser from 'phaser';

type TrapType = 'explosive' | 'trap';

export interface ScoutPracticeSceneConfig {
  backgroundKey: string;   // river at night
  boatKey: string;         // boat sprite
  trapKeys: string[];      // list of sprite keys to randomly use for traps/explosives
  notebookKey: string;     // sprite for the score icon
  numTraps?: number;       // how many clickable objects to spawn
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

  constructor() {
    super('ScoutPracticeScene');
  }

  // You can also load assets in a shared BootScene instead.
  preload() {
    // These should be replaced by YOUR actual asset keys / files.
    // Keep them here as fallbacks or examples.
    if (!this.textures.exists('fallbackBackground')) {
      this.load.image('fallbackBackground', 'assets/fallback/river_night.png');
    }
    if (!this.textures.exists('fallbackBoat')) {
      this.load.image('fallbackBoat', 'assets/fallback/boat.png');
    }
    if (!this.textures.exists('fallbackTrap')) {
      this.load.image('fallbackTrap', 'assets/fallback/trap.png');
    }
    if (!this.textures.exists('fallbackNotebook')) {
      this.load.image('fallbackNotebook', 'assets/fallback/notebook.png');
    }
  }

  /**
   * data: ScoutPracticeSceneConfig is passed when starting the scene:
   * this.scene.start('ScoutPracticeScene', config)
   */
  create(data: ScoutPracticeSceneConfig) {
    this.configData = {
      backgroundKey: data.backgroundKey || 'fallbackBackground',
      boatKey: data.boatKey || 'fallbackBoat',
      trapKeys: data.trapKeys?.length ? data.trapKeys : ['fallbackTrap'],
      notebookKey: data.notebookKey || 'fallbackNotebook',
      numTraps: data.numTraps ?? 8
    };

    const { width, height } = this.scale;

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // --- Background (river at night) ---
    this.add
      .image(width / 2, height / 2, this.configData.backgroundKey)
      .setDisplaySize(width, height)
      .setScrollFactor(0);

    // --- Boat sprite (player's boat going down river) ---
    const boat = this.add
      .sprite(width * 0.15, height * 0.8, this.configData.boatKey)
      .setOrigin(0.5, 0.5);

    // Simple idle motion on the boat (bob up and down)
    this.tweens.add({
      targets: boat,
      y: boat.y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    // --- Spawn clickable traps/explosives ---
    this.spawnTraps(this.configData.numTraps!);

    // --- Score UI (notebook with coordinates) ---
    this.createScoreUI();

    // --- Scene title / instructions (temporary) ---
    this.add
      .text(width / 2, 40, 'Scout Practice: River Patrol', {
        fontSize: '28px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.add.text(50, 80,
      'Click on suspicious objects on the river.\n' +
      'Each correctly identified explosive or trap gives you a coordinate note.',
      {
        fontSize: '18px',
        color: '#ffffff',
        wordWrap: { width: width - 100 }
      }
    );

    this.addBackButton();
  }

  // ---------------------------------------------------------------------------
  //  Create clickable objects
  // ---------------------------------------------------------------------------

  private spawnTraps(count: number) {
    const { width, height } = this.scale;
    const trapGroup = this.add.group();

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(width * 0.3, width * 0.95);
      const y = Phaser.Math.Between(height * 0.35, height * 0.9);

      const textureKey = Phaser.Utils.Array.GetRandom(this.configData.trapKeys);
      const sprite = this.add.sprite(x, y, textureKey).setInteractive({
        useHandCursor: true
      });

      // Decide type/points (you can tune this logic for your game)
      const isExplosive = Math.random() < 0.7;
      const trapData: TrapData = {
        type: isExplosive ? 'explosive' : 'trap',
        points: isExplosive ? 10 : 5
      };

      sprite.setData('trapData', trapData);

      sprite.on('pointerover', () => {
        this.tweens.add({
          targets: sprite,
          scale: 1.1,
          duration: 100,
          ease: 'Sine.out'
        });
      });

      sprite.on('pointerout', () => {
        this.tweens.add({
          targets: sprite,
          scale: 1,
          duration: 100,
          ease: 'Sine.out'
        });
      });

      sprite.on('pointerup', () => this.onTrapClicked(sprite));

      trapGroup.add(sprite);
    }
  }

  private onTrapClicked(sprite: Phaser.GameObjects.Sprite) {
    const trapData = sprite.getData('trapData') as TrapData | undefined;
    if (!trapData) return;

    // Add score
    this.addScore(trapData.points, sprite.x, sprite.y);

    // Small feedback effect
    this.tweens.add({
      targets: sprite,
      alpha: 0,
      scale: 0.4,
      duration: 200,
      ease: 'Back.in',
      onComplete: () => sprite.destroy()
    });
  }

  // ---------------------------------------------------------------------------
  //  Score UI
  // ---------------------------------------------------------------------------

  private createScoreUI() {
    this.score = 0;

    this.notebookIcon = this.add
      .sprite(20, this.scale.height - 20, this.configData.notebookKey)
      .setOrigin(0, 1)
      .setScale(0.7)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(this.notebookIcon.x + this.notebookIcon.displayWidth + 10,
            this.notebookIcon.y - this.notebookIcon.displayHeight / 2,
      'x 0\n[0.000, 0.000]', {
        fontSize: '18px',
        color: '#ffffff'
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0);
  }

  private addScore(points: number, worldX: number, worldY: number) {
    this.score += points;

    // Generate some fake "coordinates" based on click position
    const coordX = (worldX / this.scale.width).toFixed(3);
    const coordY = (worldY / this.scale.height).toFixed(3);

    this.scoreText.setText(`x ${this.score}\n[${coordX}, ${coordY}]`);

    // Floating text feedback on click
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

  // ---------------------------------------------------------------------------
  //  Back button
  // ---------------------------------------------------------------------------

  private addBackButton() {
    const back = this.add
      .text(20, 20, '< Back to Menu', {
        fontSize: '20px',
        color: '#ffff00'
      })
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    back.on('pointerup', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('MenuScene')
      );
    });
  }
}