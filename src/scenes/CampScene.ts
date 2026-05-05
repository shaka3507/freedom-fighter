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
    // Camp background
    this.load.image('camp_bg', 'src/assets/background/camp_bg.png');

    // Document / photo images (adjust paths/names as needed)
    this.load.image('img_tubman_invoice', 'src/assets/docs/tubman_invoice.png');
    this.load.image('img_josie_king_taylor', 'src/assets/docs/josie_king_taylor.png');
    this.load.image('img_confed_evac_flyer', 'src/assets/docs/confederate_evac_flyer.png');
    this.load.image('img_self_liberated_list', 'src/assets/docs/self_liberated_list.png');
    this.load.image('img_river_map', 'src/assets/docs/combahee_plantation_map.png');
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
          'This document is an invoice connected to Harriet Tubman’s work with the Union Army. ' +
          'It offers a glimpse into how her labor, leadership, and intelligence work were recorded—' +
          'and how often the value of that work was underestimated or left out of the official story.'
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
          'Many women helped out the official war effort, including fighting, teaching and leading medical efforts. Susie King Taylor, pictured here, was a nurse who served during the Civil War era. ' +
          'Black women like Taylor cared for wounded soldiers and formerly enslaved people.' +
          ' Susie King Taylor was also passionate about education and taught Black soldiers how to read and write between battles. She was also known to be a "great shot".'
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
          'This captured Confederate flier orders the evacuation of enslaved laborers ahead of incoming Union forces. ' +
          'It shows how deeply the Confederate war effort depended on enslaved people, and how worried they were ' +
          'that freedom seekers would join the Union lines once the army drew near.'
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
          'During the war effort, an estimated 500,000 enslaved laborers freed themselves (self emancipation).' +
          "Many joined the war effort - by the war's end, about 186,000 Black people served in the Union army." +
          'Black soldiers not only took arms against the Confederacy, they served as scouts, spies, nurses and tradespeople.'
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
          'With the help of many Black spies, maps like this were created identifying the plantations along waterways in low country, South Carolina.'
      }
    ];

    this.createHotspots();

    // -----------------------------------------------------------------------
    // Title / instructions (overlay text)
    // -----------------------------------------------------------------------
    this.add
      .text(
        width * 0.6, 20,
        'Explore, learn and examine your Union basecamp.',
        {
          fontSize: '24px',
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