// src/scenes/CampScene.ts
import * as Phaser from 'phaser';

type CampHotspotId =
  | 'invoice'
  | 'medical'
  | 'evac_flyer'
  | 'liberated_list'
  | 'river_map'

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
  private isDocOpen = false;

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL)
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
    // Define hotspots (positions are approximate; tweak after you see them)
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
          'Context: This document is an invoice connected to Harriet Tubman’s work with the Union Army during the Civil War. It is one of the rare official records that mention her labor and leadership.\n\n' +
          'Notice: Look closely at the handwriting, the amounts, and how Tubman’s work is described. What kinds of tasks are listed, and what seems to be missing?\n\n' +
          'Think: What does this record suggest about how the Army recognized (or failed to recognize) Tubman’s intelligence work and leadership? Whose work usually gets written down—and whose doesn’t?\n\n' +
          'Connect: Tubman led scouting, planning, and guiding missions like the Combahee River raid. How might the limited way this invoice describes her work shape how people remember her role in the war?\n\n' +
          'Key idea: Even when Black women’s leadership was essential, official records often underestimated or erased the full value of their work.'
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
          'Context: This image shows Susie King Taylor, a Black nurse, teacher, and later author who served during the Civil War. Women like Taylor played key roles in caring for soldiers and self-liberated people.\n\n' +
          'Notice: Look at how she is dressed and posed. What details suggest her skills, status, or confidence? Imagine the kinds of injuries and illnesses she would have treated in camp.\n\n' +
          'Think: Taylor taught Black soldiers to read and write between battles and was known to be a skilled markswoman. How does this challenge narrow ideas about what women, and especially Black women, did in wartime?\n\n' +
          'Connect: During missions like the Combahee River raid, wounded soldiers and newly freed families needed care, information, and education. How might people like Taylor have helped them survive and build new lives?\n\n' +
          'Key idea: Black women were not only helpers but skilled nurses, educators, and defenders whose expertise supported both the war effort and the lives of self-liberated people.'
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
          'Context: This captured Confederate flier orders enslaved laborers to be moved away before Union forces arrive. Confederate leaders feared what might happen if enslaved people reached Union lines.\n\n' +
          'Notice: Read the language used in the notice. How are enslaved people described? What seems urgent or threatening to the Confederates?\n\n' +
          'Think: Why would the Confederacy spend time and energy trying to move enslaved workers away from Union troops? What does that tell you about how much their war effort depended on enslaved labor?\n\n' +
          'Connect: During the Combahee River raid, hundreds of enslaved people used the arrival of Union gunboats and guides like Harriet Tubman as a chance to escape. How does this notice reveal Confederate fears about those kinds of escapes?\n\n' +
          'Key idea: Confederate leaders knew enslaved people could change the course of the war by fleeing to Union lines and using their knowledge and labor against slavery.'
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
          'Context: This kind of list recorded some of the many enslaved people who freed themselves by reaching Union lines during the Civil War. Historians estimate that around 500,000 enslaved people self-emancipated during the conflict.\n\n' +
          'Notice: Look at how people are listed. Do you see names, ages, family groups, or notes about where they came from? What might be missing from a list like this?\n\n' +
          'Think: By the end of the war, about 186,000 Black people served in the Union Army, and many others supported the war effort in other ways. What risks did they take to escape and then fight or work for the Union?\n\n' +
          'Connect: The Combahee River raid helped more than 700 enslaved people seize a moment to escape by boarding Union gunboats. How might lists like this one help us remember their choices and experiences today?\n\n' +
          'Key idea: Enslaved people were not just freed by others—they actively freed themselves and transformed the war through their own decisions and courage.'
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
          'Context: Maps like this identified plantations, river channels, and dangerous spots along the Combahee River in South Carolina’s low country. Much of this information came from Black scouts and local people who knew the land.\n\n' +
          'Notice: Find the river, the plantations, and any markings that might show depths, landings, or obstacles. Where might gunboats travel safely, and where would it be risky?\n\n' +
          'Think: Why would Union officers and Harriet Tubman rely on Black guides and spies to make a map like this? What could happen if they had the wrong information?\n\n' +
          'Connect: During the Combahee River raid, Tubman used her knowledge, along with information from local people, to guide Union boats to specific plantations and help people escape. How does this map show the importance of local Black knowledge in planning the raid?\n\n' +
          'Key idea: The success of the Combahee River raid depended on detailed knowledge of the land and waterways, much of it provided by Black scouts, pilots, and community members.'
      }
    ];

    this.createHotspots();

    // -----------------------------------------------------------------------
    // Title / instructions (overlay text)
    // -----------------------------------------------------------------------
    this.add
      .text(
        width * 0.6, 20,
        'Explore the Union basecamp. Click the ✴ icons to examine evidence.\n' +
        'As you explore, look for clues about:\n' +
        '- How Black women and men shaped the Combahee River raid\n' +
        '- How enslaved people took the lead in seeking freedom',
        {
          fontSize: '20px',
          backgroundColor: 'navyblue',
          color: '#ffffff',
          wordWrap: { width: width - 80 }
        }
      )
      .setScrollFactor(0);

    this.addBackButton();
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

      // Optional: debug rectangle – uncomment to see hit areas
      // const debugRect = this.add.rectangle(cfg.x, cfg.y, cfg.width, cfg.height, 0xffffff, 0.12);
      // debugRect.setStrokeStyle(1, 0xffff00);

      // Small icon circle + ? to mark hotspot
      const iconCircle = this.add.circle(
        cfg.x,
        cfg.y - cfg.height * 0.4, // slightly above the zone
        14,
        0x000000,
        0.6
      );
      iconCircle.setStrokeStyle(2, 0xffffaa);
      iconCircle.setDepth(10);

      const iconText = this.add.text(
        iconCircle.x,
        iconCircle.y,
        '✴',
        {
          fontSize: '24px',
          color: '#ffffaa'
        }
      )
        .setOrigin(0.5)
        .setDepth(11);

      // Optional label under the icon
      if (cfg.label) {
        this.add.text(
          iconCircle.x,
          iconCircle.y + 28,
          cfg.label,
          {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }
        )
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
  // Document modal (full image + description)
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

    // Close hint
    this.docCloseText = this.add
      .text(
        width / 2,
        height / 2 + panelHeight * 0.34,
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