// src/scenes/CampScene.ts
import * as Phaser from 'phaser';

type CampHotspotId =
  | 'invoice'
  | 'medical'
  | 'evac_flyer'
  | 'liberated_list'
  | 'river_map';

type HotspotType = 'document'; // you can add 'flavor' later if needed

interface CampHotspotConfig {
  id: CampHotspotId;
  type: HotspotType;
  x: number;
  y: number;
  width: number;
  height: number;

  title: string;

  // Label shown above hotspot so users know where to click
  label?: string;

  // For document/image hotspots
  docImageKey?: string;
  docDescription?: string;

  // Optional memento to encourage exploration
  hasMemento?: boolean;
  mementoName?: string;
  mementoDescription?: string;
}

export class CampScene extends Phaser.Scene {
  constructor() {
    super('CampScene');
  }

  // Background + hotspots
  private hotspotConfigs: CampHotspotConfig[] = [];

  // Document modal fields
  private docOverlay?: Phaser.GameObjects.Rectangle;
  private docPanel?: Phaser.GameObjects.Rectangle;
  private docImage?: Phaser.GameObjects.Image;
  private docText?: Phaser.GameObjects.Text;
  private docCloseText?: Phaser.GameObjects.Text;
  private mementoText?: Phaser.GameObjects.Text;
  private isDocOpen = false;

  // Intro overlay
  private introOverlay?: Phaser.GameObjects.Rectangle;
  private introPanel?: Phaser.GameObjects.Rectangle;
  private introText?: Phaser.GameObjects.Text;
  private introButton?: Phaser.GameObjects.Text;

  // Memento state
  private mementoCollected = false;
  private mementoNotice?: Phaser.GameObjects.Text;

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL);
    // Camp background
    this.load.image('camp_bg', 'assets/background/camp_bg.png');

    // Document / photo images (adjust paths/names as needed)
    this.load.image('img_tubman_invoice', 'assets/docs/tubman_invoice.png');
    this.load.image('img_josie_king_taylor', 'assets/docs/josie_king_taylor.png');
    this.load.image('img_confed_evac_flyer', 'assets/docs/confederate_evac_flyer.png');
    this.load.image('img_self_liberated_list', 'assets/docs/self_liberated_list.png');
    this.load.image('img_river_map', 'assets/docs/combahee_plantation_map.png');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // -----------------------------------------------------------------------
    // Background: static image that covers the entire game area
    // -----------------------------------------------------------------------
    const bg = this.add
      .image(width / 2, height / 2, 'camp_bg')
      .setScrollFactor(0);

    // Scale like CSS background-size: cover
    const bgW = bg.width;
    const bgH = bg.height;
    const scaleX = width / bgW;
    const scaleY = height / bgH;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    // -----------------------------------------------------------------------
    // Define hotspots (now with single summary text)
    // -----------------------------------------------------------------------
    this.hotspotConfigs = [
      {
        id: 'invoice',
        type: 'document',
        x: width * 0.2,
        y: height * 0.65,
        width: 160,
        height: 140,
        title: 'Invoice from Harriet Tubman',
        label: "Tubman's Tent",
        docImageKey: 'img_tubman_invoice',
        docDescription:
          'This invoice is one of the few official records that mentions Harriet Tubman’s work with the Union Army. It lists tasks and payments in narrow terms, but leaves out much of her intelligence work, leadership, and the danger she faced. Documents like this remind us that even when Black women’s contributions were essential to missions such as the Combahee River raid, the way their labor was recorded often underestimated or erased the full value of what they did.'
      },
      {
        id: 'medical',
        type: 'document',
        x: width * 0.3,
        y: height * 0.6,
        width: 180,
        height: 130,
        title: 'Medical Supplies and Nurse',
        label: 'Medical tent',
        docImageKey: 'img_josie_king_taylor',
        docDescription:
          'This image of Susie King Taylor, a Black nurse, teacher, and later author, shows one of the many ways Black women contributed to the Civil War. Women like Taylor treated wounds and illness, taught Black soldiers to read and write, and sometimes even learned to use weapons. Their work in camps and near the front lines supported both the Union war effort and the lives of self-liberated people, challenging narrow ideas about what women—and especially Black women—did in wartime.'
      },
      {
        id: 'evac_flyer',
        type: 'document',
        x: width * 0.55,
        y: height * 0.65,
        width: 190,
        height: 150,
        title: 'Confederate Evacuation Notice',
        label: 'Enemy Items',
        docImageKey: 'img_confed_evac_flyer',
        docDescription:
          'This captured Confederate notice orders enslaved laborers to be moved away before Union forces arrive. The language reveals how Confederates treated enslaved people as property while urgently trying to keep them from reaching Union lines. The effort spent on moving enslaved workers shows how deeply the Confederate war machine depended on their labor—and how much leaders feared that escapes to Union forces, like those during the Combahee River raid, could weaken their cause.'
      },
      {
        id: 'liberated_list',
        type: 'document',
        x: width * 0.6,
        y: height * 0.8,
        width: width,
        height: 300,
        title: 'List of Self-Liberated People',
        label: 'Self Emancipation Efforts Documents',
        docImageKey: 'img_self_liberated_list',
        docDescription:
          'Lists like this recorded some of the many enslaved people who freed themselves by reaching Union lines during the Civil War. They sometimes note names, ages, family groups, or places of origin, but they rarely capture the full stories of risk, planning, and courage behind each journey. Historians estimate that hundreds of thousands of enslaved people self-emancipated, and many later served in the Union Army or supported its work. The Combahee River raid alone helped more than 700 people escape, reminding us that enslaved people were active agents in claiming their own freedom.'
      },
      {
        id: 'river_map',
        type: 'document',
        x: width * 0.18,
        y: height * 0.8,
        width: width,
        height: 300,
        title: 'Map of Combahee River',
        label: 'Map for Navigation',
        docImageKey: 'img_river_map',
        docDescription:
          'This map of the Combahee River and nearby plantations helped Union officers plan how to move gunboats safely through shallow channels and past dangerous obstacles. Much of the detailed knowledge needed to make a map like this came from Black scouts, pilots, and local community members who knew the land and waterways firsthand. During the Combahee River raid, Harriet Tubman drew on information from these guides to lead boats to specific plantations and coordinate escape routes, showing how local Black knowledge was central to the mission’s success.',
        hasMemento: true,
        mementoName: 'River Pilot’s Token',
        mementoDescription:
          'You pick up a small carved token used by a Black river pilot to remember the twists of the Combahee. It represents the detailed local knowledge that made the raid possible.'
      }
    ];

    this.createHotspots();

    // -----------------------------------------------------------------------
    // Simple on-screen reminder / guiding question
    // -----------------------------------------------------------------------
    this.add
      .text(
        width * 0.5,
        20,
        'Guiding question: How did Black women and men use their skills\nand knowledge to turn a Union camp into a base for freedom?',
        {
          fontSize: '20px',
          backgroundColor: '#000044',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: width - 80 }
        }
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0);

    // Memento status text (updates when collected)
    this.mementoNotice = this.add
      .text(
        width - 20,
        height - 20,
        'Memento: not yet found',
        {
          fontSize: '18px',
          color: '#ffffaa',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }
      )
      .setOrigin(1, 1)
      .setScrollFactor(0);

    this.addBackButton();

    // Show intro overlay last so it sits on top
    this.showIntroOverlay();
  }

  // -------------------------------------------------------------------------
  // Intro overlay with grounding text + guiding question
  // -------------------------------------------------------------------------

  private showIntroOverlay() {
    const { width, height } = this.scale;

    this.introOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.8
    );
    this.introOverlay.setDepth(3000);

    const panelWidth = width * 0.8;
    const panelHeight = height * 0.6;

    this.introPanel = this.add
      .rectangle(
        width / 2,
        height / 2,
        panelWidth,
        panelHeight,
        0x111111,
        0.95
      )
      .setStrokeStyle(3, 0xffffff);
    this.introPanel.setDepth(3001);

    const introTextContent =
      'Union Camp on the Combahee River, 1863.\n\n' +
      'Gunboats rest at the river’s edge. Tents crowd the shoreline. ' +
      'Some people here are soldiers, some are nurses and teachers, and many are newly self-liberated families ' +
      'trying to decide what comes next.\n\n' +
      'You are moving quietly through the camp, looking for clues about how the Combahee River raid was planned, ' +
      'how it unfolded, and how it changed the lives of the people who escaped.\n\n' +
      'Guiding question:\n' +
      'How did Black women and men use their knowledge, skills, and courage to turn this camp and river into a path to freedom?\n\n' +
      'Explore the ✴ icons around the camp. One object hides a small memento from the raid—see if you can find it.';

    this.introText = this.add
      .text(
        width / 2,
        height / 2 - panelHeight * 0.2,
        introTextContent,
        {
          fontSize: '22px',
          color: '#ffffff',
          align: 'left',
          wordWrap: { width: panelWidth - 80 }
        }
      )
      .setOrigin(0.5, 0.5)
      .setDepth(3002);

    this.introButton = this.add
      .text(
        width / 2,
        height / 2 + panelHeight * 0.25,
        'Enter the camp',
        {
          fontSize: '24px',
          color: '#ffff99',
          backgroundColor: '#333333',
          padding: { left: 16, right: 16, top: 8, bottom: 8 }
        }
      )
      .setOrigin(0.5)
      .setDepth(3002)
      .setInteractive({ useHandCursor: true });

    const closeIntro = () => {
      this.introOverlay?.destroy();
      this.introPanel?.destroy();
      this.introText?.destroy();
      this.introButton?.off('pointerup');
      this.introButton?.destroy();
    };

    this.introButton.on('pointerup', closeIntro);
    this.introOverlay.setInteractive({ useHandCursor: true });
    this.introOverlay.on('pointerup', closeIntro);
  }

  // -------------------------------------------------------------------------
  // Hotspots
  // -------------------------------------------------------------------------

  private createHotspots() {
    this.hotspotConfigs.forEach(cfg => {
      const zone = this.add
        .zone(cfg.x, cfg.y, cfg.width, cfg.height)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      // Small icon circle + ✴ to mark hotspot
      const iconCircle = this.add.circle(
        cfg.x,
        cfg.y - cfg.height * 0.4, // slightly above the zone
        14,
        0x000000,
        0.6
      );
      iconCircle.setStrokeStyle(2, 0xffffaa);
      iconCircle.setDepth(10);

      const iconText = this.add
        .text(iconCircle.x, iconCircle.y, '✴', {
          fontSize: '24px',
          color: '#ffffaa'
        })
        .setOrigin(0.5)
        .setDepth(11);

      // Optional label under the icon
      if (cfg.label) {
        this.add
          .text(iconCircle.x, iconCircle.y + 28, cfg.label, {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          })
          .setOrigin(0.5)
          .setDepth(11);
      }

      // Hover effect: change circle fill
      zone.on('pointerover', () => {
        if (!this.isDocOpen) {
          iconCircle.setFillStyle(0xffffaa, 0.4);
        }
      });

      zone.on('pointerout', () => {
        iconCircle.setFillStyle(0x000000, 0.6);
      });

      zone.on('pointerup', () => {
        if (this.isDocOpen) return;
        if (cfg.type === 'document') {
          this.openDocumentModal(cfg);
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Document modal (full image + description + optional memento)
  // -------------------------------------------------------------------------

  private openDocumentModal(cfg: CampHotspotConfig) {
    if (!cfg.docImageKey) return;

    this.isDocOpen = true;

    const { width, height } = this.scale;

    // Dark overlay
    this.docOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.8
    ).setScrollFactor(0);
    this.docOverlay.setDepth(2000);

    // Panel/frame
    const panelWidth = width * 0.8;
    const panelHeight = height * 0.8;

    this.docPanel = this.add.rectangle(
      width / 2,
      height / 2,
      panelWidth,
      panelHeight,
      0x111111,
      0.95
    ).setStrokeStyle(3, 0xffffff);
    this.docPanel.setDepth(2001).setScrollFactor(0);

    // Document/image (placed in upper half)
    this.docImage = this.add
      .image(width / 2, height / 2 - panelHeight * 0.2, cfg.docImageKey)
      .setScrollFactor(0)
      .setDepth(2002);

    // Fit image inside upper half of panel with margins
    const maxImgWidth = panelWidth * 0.75;
    const maxImgHeight = panelHeight * 0.45; // leave room for text
    const imgW = this.docImage.width;
    const imgH = this.docImage.height;
    const scaleX = maxImgWidth / imgW;
    const scaleY = maxImgHeight / imgH;
    const imgScale = Math.min(scaleX, scaleY, 1);
    this.docImage.setScale(imgScale);

    // Description text lower in the panel
    const description = cfg.docDescription || '';

    this.docText = this.add
      .text(
        width / 2,
        height / 2 + panelHeight * 0.05, // safely below the image
        description,
        {
          fontSize: '24px',
          color: '#ffffff',
          align: 'left',
          wordWrap: { width: panelWidth - 80 }
        }
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(2002);

    let bottomY = height / 2 + panelHeight * 0.34;

    // Optional memento pickup
    if (cfg.hasMemento && !this.mementoCollected) {
      this.mementoText = this.add
        .text(
          width / 2,
          bottomY - 40,
          `Memento found: ${cfg.mementoName}\nClick here to pick it up.`,
          {
            fontSize: '20px',
            color: '#99ffcc',
            align: 'center',
            backgroundColor: '#003322',
            padding: { left: 12, right: 12, top: 6, bottom: 6 }
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2002)
        .setInteractive({ useHandCursor: true });

      this.mementoText.on('pointerup', () => {
        this.mementoCollected = true;
        if (this.mementoNotice && cfg.mementoName) {
          this.mementoNotice.setText(`Memento: ${cfg.mementoName} collected`);
        }
        // Optional: briefly show description in console or another UI
        console.log(cfg.mementoDescription || '');
        this.mementoText?.off('pointerup');
        this.mementoText?.destroy();
      });
    }

    // Close hint
    this.docCloseText = this.add
      .text(
        width / 2,
        bottomY,
        'Click anywhere to close',
        {
          fontSize: '20px',
          color: '#ffff99'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2002)
      .setInteractive({ useHandCursor: true });

    this.docCloseText.on('pointerup', () => {
      this.closeDocumentModal();
    });

    // Also click overlay or panel to close
    this.docOverlay.setInteractive({ useHandCursor: true });
    this.docOverlay.on('pointerup', () => {
      this.closeDocumentModal();
    });
    this.docPanel.setInteractive({ useHandCursor: true });
    this.docPanel.on('pointerup', () => {
      this.closeDocumentModal();
    });
  }

  private closeDocumentModal() {
    this.isDocOpen = false;

    this.docOverlay?.destroy();
    this.docPanel?.destroy();
    this.docImage?.destroy();
    this.docText?.destroy();
    this.docCloseText?.off('pointerup');
    this.docCloseText?.destroy();
    this.mementoText?.off('pointerup');
    this.mementoText?.destroy();
  }

  // -------------------------------------------------------------------------
  // Back button
  // -------------------------------------------------------------------------

  private addBackButton() {
    const back = this.add
      .text(20, 20, '< Back to Menu', {
        fontSize: '24px',
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