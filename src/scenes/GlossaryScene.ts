// src/scenes/GlossaryScene.ts
import * as Phaser from 'phaser';
import WebFont from 'webfontloader';

const FONT = 'Cardo';

interface GlossaryItem {
  term: string;
  pronunciation?: string;
  definition: string;
}

export class GlossaryScene extends Phaser.Scene {
  constructor() {
    super('GlossaryScene');
  }

  private glossaryItems: GlossaryItem[] = [
    {
      term: 'Combahee River',
      pronunciation: '(/kəmˈbiː/; "kəm-BEE")',
      definition:
        'A short blackwater river in the southern Lowcountry region of South Carolina, ' +
        'formed at the confluence of the Salkehatchie and Little Salkehatchie rivers near Islandton in Colleton County. ' +
        'It takes its name from the Combahee tribe, a Muskogean-speaking Native American people of the Cusabo group, ' +
        'who originally inhabited the area.'
    },
    {
      term: 'Combahee River Raid',
      pronunciation: '(/kəmˈbiː/; "kəm-BEE")',
      definition:
        'On June 1st and 2nd, Harriet Tubman and the 2nd South Carolina Infantry raided several plantations along the Combahee River,' +
        'which led to the emancipation of more than 700 enslaved laborers. There were no casualties recorded and several plantations were burnt to the ground.'
    },
    {
      term: 'Enslaved Laborer',
      pronunciation: '',
      definition:
        'Today many historians and folks of African descent prefer the term "enslaved person" or "enslaved laborer" vs "slave".' +
        'Using the terms enslaved and enslaver, are subtle but powerful ways of affirming that slavery was forced upon that person, rather than an inherent condition.'
    },
    {
      term: 'Self Emancipation',
      pronunciation: '',
      definition:
        'The act of defying the power of enslavers, laws or practices related to sustaining slavery.' +
        "Acts could include getting married against an enslaver's wishes, participating in an uprising or running away slavery." +
        "Some historians estimate at least 250 uprisings occurred from 1619 until the passing of the 13th amendment in 1865, which abolished slavery."
    },
  ];

  private contentContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScrollY = 0;

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    WebFont.load({
      google: {
        families: [FONT]
      },
      active: () => {
        // Title
        this.add
          .text(width / 2, 40, 'Glossary', {
            fontSize: '40px',
            color: '#ffffff',
            fontFamily: FONT
          })
          .setOrigin(0.5);

        this.addBackButton();

        // Instructions
        this.add
          .text(
            width / 2,
            80,
            'Learn more about the terms and people referenced during your game play.',
            {
              fontSize: '20px',
              color: '#ffffff',
              align: 'center',
              fontFamily: FONT
            }
          )
          .setOrigin(0.5);

        this.addGlossaryList(width, height);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Build glossary list inside a container (so we can scroll it)
  // ---------------------------------------------------------------------------

  private addGlossaryList(width: number, height: number) {
    this.contentContainer = this.add.container(0, 130);

    const leftMargin = width * 0.1;
    const contentWidth = width * 0.8;
    let currentY = 0;

    const cardPadding = 18;
    const cardSpacing = 16;

    this.glossaryItems.forEach((item) => {
      const card = this.add.rectangle(
        width / 2,
        currentY,
        contentWidth,
        0,
        0x000,
        1
      ).setOrigin(0.5, 0);

      // Term
      const termText = this.add.text(
        leftMargin,
        currentY + cardPadding,
        item.term,
        {
          fontSize: '26px',
          color: 'white',
          fontStyle: 'bold',
          fontFamily: FONT,
          wordWrap: { width: contentWidth - cardPadding * 2 }
        }
      );

      let lineY = termText.y + termText.height + 6;

      // Pronunciation (optional)
      let pronText: Phaser.GameObjects.Text | undefined;
      if (item.pronunciation) {
        pronText = this.add.text(
          leftMargin,
          lineY,
          item.pronunciation,
          {
            fontSize: '22px',
            color: '#aaaaaa',
            fontStyle: 'italic',
            fontFamily: FONT,
            wordWrap: { width: contentWidth - cardPadding * 2 }
          }
        );
        lineY = pronText.y + pronText.height + 10;
      }

      // Definition
      const defText = this.add.text(
        leftMargin,
        lineY,
        item.definition,
        {
          fontSize: '24px',
          color: 'white',
          fontFamily: FONT,
          wordWrap: { width: contentWidth - cardPadding * 2 }
        }
      );

      const cardHeight =
        (defText.y + defText.height + cardPadding) - currentY;

      card.height = cardHeight;

      this.contentContainer.add(card);
      this.contentContainer.add(termText);
      if (pronText) this.contentContainer.add(pronText);
      this.contentContainer.add(defText);

      currentY += cardHeight + cardSpacing;
    });

    const visibleHeight = height - 140;
    const contentHeight = currentY;
    this.maxScrollY = Math.max(0, contentHeight - visibleHeight);
  }

  // ---------------------------------------------------------------------------
  // Simple scroll handling (mouse wheel / drag)
  // ---------------------------------------------------------------------------

  private enableScrollInput() {
    this.input.on('wheel', (_pointer, _gameObjects, _dx, dy) => {
      this.scrollBy(dy * 0.5);
    });

    let isDragging = false;
    let dragStartY = 0;
    let containerStartY = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      dragStartY = pointer.y;
      containerStartY = this.contentContainer.y;
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const deltaY = pointer.y - dragStartY;
      const targetY = containerStartY + deltaY;
      this.setScrollYFromContainerY(targetY);
    });
  }

  private scrollBy(deltaY: number) {
    const { height } = this.scale;

    this.scrollY += deltaY;
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);

    const baseY = 130;
    this.contentContainer.y = baseY - this.scrollY;

    const minY = height - (this.maxScrollY + baseY);
    this.contentContainer.y = Phaser.Math.Clamp(this.contentContainer.y, minY, baseY);
  }

  private setScrollYFromContainerY(containerY: number) {
    const baseY = 130;
    const rawScroll = baseY - containerY;
    this.scrollY = Phaser.Math.Clamp(rawScroll, 0, this.maxScrollY);
    this.contentContainer.y = baseY - this.scrollY;
  }

  // ---------------------------------------------------------------------------
  // Back button
  // ---------------------------------------------------------------------------

  private addBackButton() {
    const back = this.add
      .text(20, 20, '< Back to Menu', {
        fontSize: '28px',
        color: '#ffff00',
        fontFamily: FONT
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
}