import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const softBox = (w, h, d) => new RoundedBoxGeometry(w, h, d, 2, Math.min(0.055, w * 0.16, h * 0.16, d * 0.16));

export class FurnitureManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'furniture_container';
    this.scene.add(this.group);

    this.interactiveObjects = [];
    this.items = new Map(); // id -> { group, mesh, baseScale, targetScale, currentScale, basePos, config }
    this.materials = this.createMaterials();
    this.screenTexture = this.createScreenTexture();

    this.initFurniturePieces();
  }

  createMaterials() {
    return {
      // Wood & base
      darkWood: new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.7, metalness: 0.1 }),
      lightWood: new THREE.MeshStandardMaterial({ color: 0xc8a27a, roughness: 0.6, metalness: 0.05 }),
      walnut: new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.5, metalness: 0.1 }),
      
      // Fabric & Couch
      fabricPurple: new THREE.MeshStandardMaterial({ color: 0x772ce8, roughness: 0.85, metalness: 0.1 }),
      fabricDark: new THREE.MeshStandardMaterial({ color: 0x232127, roughness: 0.9, metalness: 0.05 }),
      fabricTeal: new THREE.MeshStandardMaterial({ color: 0x00d8d6, roughness: 0.8, metalness: 0.1 }),
      cushionSoft: new THREE.MeshStandardMaterial({ color: 0x9146ff, roughness: 0.8, metalness: 0.15 }),
      pillowGold: new THREE.MeshStandardMaterial({ color: 0xffb800, roughness: 0.6, metalness: 0.2 }),
      
      // Metal & Chrome
      metalBlack: new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.35, metalness: 0.65 }),
      metalChrome: new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.15, metalness: 0.72 }),
      goldTrophy: new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.9, emissive: 0x332200 }),
      amethystTrophy: new THREE.MeshStandardMaterial({ color: 0xbf55ec, roughness: 0.1, metalness: 0.65, emissive: 0x3d0c5a }),
      
      // Screens & Tech
      screenBezel: new THREE.MeshStandardMaterial({ color: 0x0f0f14, roughness: 0.4, metalness: 0.8 }),
      ledGlow: new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00d2d3, emissiveIntensity: 1.2, roughness: 0.2 }),
      rgbGlow: new THREE.MeshStandardMaterial({ color: 0xff007f, emissive: 0x9146ff, emissiveIntensity: 1.5, roughness: 0.1 }),
      
      // Ceramic & Glass
      glassSmoked: new THREE.MeshPhysicalMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.9,
        transmission: 0.6
      }),
      ceramicWhite: new THREE.MeshStandardMaterial({ color: 0xf0f3f4, roughness: 0.3, metalness: 0.1 }),
      leafGreen: new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.7, metalness: 0.05 }),
      soilBrown: new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.95, metalness: 0.0 })
    };
  }

  createScreenTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 288;
    const ctx = canvas.getContext('2d');

    // Draw stream HUD screen
    ctx.fillStyle = '#0e0e10';
    ctx.fillRect(0, 0, 512, 288);

    // Glowing game backdrop
    const grad = ctx.createLinearGradient(0, 0, 512, 288);
    grad.addColorStop(0, '#180e29');
    grad.addColorStop(0.5, '#4a154b');
    grad.addColorStop(1, '#005f73');
    ctx.fillStyle = grad;
    ctx.fillRect(16, 16, 480, 256);

    // Twitch Glitch Logo in center
    ctx.fillStyle = '#9146ff';
    ctx.fillRect(220, 100, 72, 72);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(235, 120, 12, 25);
    ctx.fillRect(265, 120, 12, 25);

    // Stream text
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('LIVE • WATCH TIME 3D', 140, 215);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#00ff7f';
    ctx.fillText('● 1080p60 • ARCHITECT STAGE', 145, 240);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  initFurniturePieces() {
    // 1. The Twitch Couch (Living Room center)
    this.createCouch();

    // 2. The Battlestation / Gaming PC setup
    this.createBattlestation();

    // 3. The Television / Home Theater
    this.createTV();

    // 4. The Bed / Royal Suite
    this.createBed();

    // 5. The Streamer Refrigerator / Bar
    this.createRefrigerator();

    // 6. The Bookshelf & Twitch Trophies
    this.createBookshelf();

    // 7. The Ceiling Chandelier / Stellar Lamp
    this.createChandelier();

    // 8. The Potted Flora / Mega-Bonsai
    this.createPlant();
  }

  registerItem(id, name, group, basePos, category) {
    group.position.set(basePos.x, basePos.y, basePos.z);
    this.group.add(group);
    group.traverse(child => {
      if (child.isMesh) {
        child.userData.furnitureId = id;
        child.castShadow = true;
        child.receiveShadow = true;
        this.interactiveObjects.push(child);
      }
    });
    const bounds = new THREE.Box3().setFromObject(group);
    const dimensions = bounds.getSize(new THREE.Vector3());

    this.items.set(id, {
      id,
      name,
      category,
      dimensions,
      group,
      basePos: { ...basePos },
      baseScale: 1.0,
      currentScale: 1.0,
      targetScale: 1.0,
      bounceVel: 0,
      bounceOffset: 0
    });
  }

  createCouch() {
    const couch = new THREE.Group();
    couch.name = 'furniture_couch';

    // Main base frame
    const baseGeom = softBox(2.8, 0.35, 1.2);
    const baseMesh = new THREE.Mesh(baseGeom, this.materials.fabricDark);
    baseMesh.position.y = 0.25;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    couch.add(baseMesh);

    // Seat cushions (plush purple)
    const seatGeom = softBox(1.25, 0.32, 1.05);
    const seatLeft = new THREE.Mesh(seatGeom, this.materials.fabricPurple);
    seatLeft.position.set(-0.65, 0.45, 0.05);
    seatLeft.castShadow = true;
    couch.add(seatLeft);

    const seatRight = new THREE.Mesh(seatGeom, this.materials.fabricPurple);
    seatRight.position.set(0.65, 0.45, 0.05);
    seatRight.castShadow = true;
    couch.add(seatRight);

    // Backrest
    const backGeom = softBox(2.8, 0.85, 0.35);
    const backMesh = new THREE.Mesh(backGeom, this.materials.fabricPurple);
    backMesh.position.set(0, 0.85, -0.42);
    backMesh.rotation.x = 0.05;
    backMesh.castShadow = true;
    couch.add(backMesh);

    // Left armrest
    const armGeom = softBox(0.35, 0.65, 1.2);
    const armLeft = new THREE.Mesh(armGeom, this.materials.fabricDark);
    armLeft.position.set(-1.42, 0.55, 0);
    armLeft.castShadow = true;
    couch.add(armLeft);

    // Right armrest
    const armRight = new THREE.Mesh(armGeom, this.materials.fabricDark);
    armRight.position.set(1.42, 0.55, 0);
    armRight.castShadow = true;
    couch.add(armRight);

    // Throw pillows
    const pillowGeom = softBox(0.38, 0.38, 0.15);
    const pillowL = new THREE.Mesh(pillowGeom, this.materials.pillowGold);
    pillowL.position.set(-1.1, 0.65, -0.2);
    pillowL.rotation.y = 0.3;
    pillowL.rotation.z = -0.2;
    couch.add(pillowL);

    const pillowR = new THREE.Mesh(pillowGeom, this.materials.fabricTeal);
    pillowR.position.set(1.1, 0.65, -0.2);
    pillowR.rotation.y = -0.3;
    pillowR.rotation.z = 0.2;
    couch.add(pillowR);

    // Legs (Chrome metal pegs)
    const legGeom = new THREE.CylinderGeometry(0.04, 0.03, 0.2, 8);
    const legPositions = [
      [-1.3, 0.1, 0.45],
      [1.3, 0.1, 0.45],
      [-1.3, 0.1, -0.45],
      [1.3, 0.1, -0.45]
    ];
    for (const pos of legPositions) {
      const leg = new THREE.Mesh(legGeom, this.materials.metalChrome);
      leg.position.set(pos[0], pos[1], pos[2]);
      couch.add(leg);
    }

    // Coffee table in front of couch
    const tableTopGeom = softBox(1.6, 0.08, 0.8);
    const tableTop = new THREE.Mesh(tableTopGeom, this.materials.walnut);
    tableTop.position.set(0, 0.42, 1.25);
    tableTop.castShadow = true;
    couch.add(tableTop);

    const tableLegGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
    const tLegs = [
      [-0.7, 0.2, 0.95],
      [0.7, 0.2, 0.95],
      [-0.7, 0.2, 1.55],
      [0.7, 0.2, 1.55]
    ];
    for (const pos of tLegs) {
      const tl = new THREE.Mesh(tableLegGeom, this.materials.metalBlack);
      tl.position.set(pos[0], pos[1], pos[2]);
      couch.add(tl);
    }

    this.registerItem('couch', 'Twitch Sectional Sofa', couch, { x: 0, y: 0, z: -0.6 }, 'Living Room');
  }

  createBattlestation() {
    const battle = new THREE.Group();
    battle.name = 'furniture_battlestation';

    // Large corner desk surface
    const deskTopGeom = softBox(2.4, 0.09, 1.1);
    const deskTop = new THREE.Mesh(deskTopGeom, this.materials.darkWood);
    deskTop.position.set(0, 0.85, 0);
    deskTop.castShadow = true;
    battle.add(deskTop);

    // Sturdy metal legs
    const legGeom = softBox(0.08, 0.85, 0.9);
    const legL = new THREE.Mesh(legGeom, this.materials.metalBlack);
    legL.position.set(-1.1, 0.425, 0);
    battle.add(legL);

    const legR = new THREE.Mesh(legGeom, this.materials.metalBlack);
    legR.position.set(1.1, 0.425, 0);
    battle.add(legR);

    // Dual/Triple curved screens
    // Center Monitor
    const screenMat = new THREE.MeshBasicMaterial({ map: this.screenTexture });
    const screenFrameGeom = softBox(1.0, 0.58, 0.04);
    const frameCenter = new THREE.Mesh(screenFrameGeom, this.materials.screenBezel);
    frameCenter.position.set(0, 1.35, -0.25);
    battle.add(frameCenter);

    const screenCenter = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.54), screenMat);
    screenCenter.position.set(0, 1.35, -0.228);
    battle.add(screenCenter);

    // Left Monitor angled inward
    const frameLeft = new THREE.Mesh(screenFrameGeom, this.materials.screenBezel);
    frameLeft.position.set(-0.95, 1.35, -0.12);
    frameLeft.rotation.y = 0.35;
    battle.add(frameLeft);

    const screenLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.54), screenMat);
    screenLeft.position.set(-0.95, 1.35, -0.1);
    screenLeft.rotation.y = 0.35;
    battle.add(screenLeft);

    // Right Monitor angled inward
    const frameRight = new THREE.Mesh(screenFrameGeom, this.materials.screenBezel);
    frameRight.position.set(0.95, 1.35, -0.12);
    frameRight.rotation.y = -0.35;
    battle.add(frameRight);

    const screenRight = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.54), screenMat);
    screenRight.position.set(0.95, 1.35, -0.1);
    screenRight.rotation.y = -0.35;
    battle.add(screenRight);

    // Monitor stand arms
    const standGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
    const stand = new THREE.Mesh(standGeom, this.materials.metalChrome);
    stand.position.set(0, 1.05, -0.25);
    battle.add(stand);

    // RGB Gaming PC Tower with tempered glass
    const pcCaseGeom = softBox(0.35, 0.65, 0.6);
    const pcCase = new THREE.Mesh(pcCaseGeom, this.materials.metalBlack);
    pcCase.position.set(1.35, 1.18, -0.1);
    battle.add(pcCase);

    const rgbGlowGeom = softBox(0.02, 0.5, 0.45);
    const rgbGlow = new THREE.Mesh(rgbGlowGeom, this.materials.rgbGlow);
    rgbGlow.position.set(1.17, 1.18, -0.1);
    battle.add(rgbGlow);

    // Mechanical Keyboard with RGB
    const kbGeom = softBox(0.65, 0.03, 0.22);
    const kb = new THREE.Mesh(kbGeom, this.materials.metalBlack);
    kb.position.set(0, 0.91, 0.15);
    battle.add(kb);

    const kbRgb = new THREE.Mesh(softBox(0.62, 0.01, 0.2), this.materials.ledGlow);
    kbRgb.position.set(0, 0.925, 0.15);
    battle.add(kbRgb);

    // Ergonomic Gaming Chair
    const chair = new THREE.Group();
    chair.position.set(0, 0, 0.7);

    const seat = new THREE.Mesh(softBox(0.65, 0.12, 0.6), this.materials.fabricDark);
    seat.position.y = 0.55;
    chair.add(seat);

    const seatBack = new THREE.Mesh(softBox(0.6, 0.85, 0.1), this.materials.fabricPurple);
    seatBack.position.set(0, 1.0, 0.25);
    seatBack.rotation.x = -0.08;
    chair.add(seatBack);

    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.5, 6), this.materials.metalBlack);
    chairBase.position.y = 0.25;
    chair.add(chairBase);

    battle.add(chair);

    this.registerItem('battlestation', 'RGB Streamer Battlestation', battle, { x: 2.1, y: 0, z: -0.9 }, 'Studio');
  }

  createTV() {
    const tv = new THREE.Group();
    tv.name = 'furniture_tv';

    // TV Media Console Stand
    const standGeom = softBox(3.2, 0.5, 0.7);
    const stand = new THREE.Mesh(standGeom, this.materials.walnut);
    stand.position.set(0, 0.25, 0);
    stand.castShadow = true;
    tv.add(stand);

    // Soundbar
    const soundbarGeom = softBox(1.8, 0.1, 0.15);
    const soundbar = new THREE.Mesh(soundbarGeom, this.materials.metalBlack);
    soundbar.position.set(0, 0.55, 0.15);
    tv.add(soundbar);

    // Gargantuan Flat TV screen
    const screenFrameGeom = softBox(2.8, 1.6, 0.08);
    const frame = new THREE.Mesh(screenFrameGeom, this.materials.screenBezel);
    frame.position.set(0, 1.5, 0);
    frame.castShadow = true;
    tv.add(frame);

    const screenMat = new THREE.MeshBasicMaterial({ map: this.screenTexture });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 1.52), screenMat);
    screen.position.set(0, 1.5, 0.045);
    tv.add(screen);

    // Back ambient bias lighting
    const biasGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.7), this.materials.ledGlow);
    biasGlow.position.set(0, 1.5, -0.05);
    biasGlow.rotation.y = Math.PI;
    tv.add(biasGlow);

    this.registerItem('tv', 'IMAX Home Cinema OLED', tv, { x: 0, y: 0, z: 2.0 }, 'Living Room');
  }

  createBed() {
    const bed = new THREE.Group();
    bed.name = 'furniture_bed';

    // Solid wooden bed platform
    const platformGeom = softBox(2.4, 0.35, 2.6);
    const platform = new THREE.Mesh(platformGeom, this.materials.darkWood);
    platform.position.set(0, 0.2, 0);
    bed.add(platform);

    // Thick luxury mattress
    const mattressGeom = softBox(2.2, 0.35, 2.4);
    const mattress = new THREE.Mesh(mattressGeom, this.materials.ceramicWhite);
    mattress.position.set(0, 0.5, 0);
    bed.add(mattress);

    // Duvet / Blanket (Twitch purple folded)
    const blanketGeom = softBox(2.22, 0.15, 1.7);
    const blanket = new THREE.Mesh(blanketGeom, this.materials.fabricPurple);
    blanket.position.set(0, 0.65, 0.35);
    bed.add(blanket);

    // Headboard
    const headboardGeom = softBox(2.5, 1.4, 0.2);
    const headboard = new THREE.Mesh(headboardGeom, this.materials.fabricDark);
    headboard.position.set(0, 0.9, -1.25);
    bed.add(headboard);

    // Plump pillows
    const pillowGeom = softBox(0.75, 0.2, 0.5);
    const p1 = new THREE.Mesh(pillowGeom, this.materials.ceramicWhite);
    p1.position.set(-0.55, 0.75, -0.85);
    p1.rotation.x = 0.2;
    bed.add(p1);

    const p2 = new THREE.Mesh(pillowGeom, this.materials.pillowGold);
    p2.position.set(0.55, 0.75, -0.85);
    p2.rotation.x = 0.2;
    bed.add(p2);

    // Canopy Pillars
    const pillarGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
    const pillarPositions = [
      [-1.15, 1.25, -1.25],
      [1.15, 1.25, -1.25],
      [-1.15, 1.25, 1.25],
      [1.15, 1.25, 1.25]
    ];
    for (const p of pillarPositions) {
      const pillar = new THREE.Mesh(pillarGeom, this.materials.metalBlack);
      pillar.position.set(p[0], p[1], p[2]);
      bed.add(pillar);
    }

    // Overhead canopy frame
    const canopyBeamX = softBox(2.4, 0.05, 0.05);
    const topFront = new THREE.Mesh(canopyBeamX, this.materials.metalBlack);
    topFront.position.set(0, 2.5, 1.25);
    bed.add(topFront);

    const topBack = new THREE.Mesh(canopyBeamX, this.materials.metalBlack);
    topBack.position.set(0, 2.5, -1.25);
    bed.add(topBack);

    this.registerItem('bed', 'Imperial Royal Canopy Bed', bed, { x: -2.0, y: 0, z: -0.9 }, 'Bedroom');
  }

  createRefrigerator() {
    const fridge = new THREE.Group();
    fridge.name = 'furniture_fridge';

    // Main Fridge Body (Brushed stainless steel)
    const bodyGeom = softBox(1.3, 2.3, 1.1);
    const body = new THREE.Mesh(bodyGeom, this.materials.metalChrome);
    body.position.set(0, 1.15, 0);
    fridge.add(body);

    // Double French Doors division seam
    const seamGeom = softBox(0.02, 1.4, 0.02);
    const seam = new THREE.Mesh(seamGeom, this.materials.metalBlack);
    seam.position.set(0, 1.5, 0.56);
    fridge.add(seam);

    // Chrome door handles
    const handleGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8);
    const handleL = new THREE.Mesh(handleGeom, this.materials.metalBlack);
    handleL.position.set(-0.1, 1.5, 0.6);
    fridge.add(handleL);

    const handleR = new THREE.Mesh(handleGeom, this.materials.metalBlack);
    handleR.position.set(0.1, 1.5, 0.6);
    fridge.add(handleR);

    // Water/Ice Dispenser Panel with cyan display
    const dispenserGeom = softBox(0.3, 0.45, 0.04);
    const dispenser = new THREE.Mesh(dispenserGeom, this.materials.screenBezel);
    dispenser.position.set(-0.35, 1.6, 0.55);
    fridge.add(dispenser);

    const glowDot = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.06), this.materials.ledGlow);
    glowDot.position.set(-0.35, 1.7, 0.575);
    fridge.add(glowDot);

    this.registerItem('fridge', 'Smart French-Door Refrigerator', fridge, { x: -2.2, y: 0, z: 1.2 }, 'Kitchen');
  }

  createBookshelf() {
    const shelf = new THREE.Group();
    shelf.name = 'furniture_bookshelf';

    // Outer frame
    const outerGeom = softBox(1.6, 2.6, 0.5);
    const frame = new THREE.Mesh(outerGeom, this.materials.darkWood);
    frame.position.set(0, 1.3, 0);
    frame.scale.set(1, 1, 0.12);
    frame.position.z = -0.22;
    shelf.add(frame);
    for (const x of [-0.75, 0.75]) {
      const side = new THREE.Mesh(softBox(0.1, 2.6, 0.5), this.materials.darkWood);
      side.position.set(x, 1.3, 0); shelf.add(side);
    }
    for (let y = 0; y <= 2.6; y += 0.65) {
      const board = new THREE.Mesh(softBox(1.6, 0.06, 0.5), this.materials.walnut);
      board.position.set(0, y, 0); shelf.add(board);
    }

    // Shelves cutout feel / inner cubbies
    const shelfCount = 4;
    for (let i = 0; i < shelfCount; i++) {
      const y = 0.5 + i * 0.55;

      // Colorful Books
      const bookColors = [0xe74c3c, 0x3498db, 0x9b59b6, 0x1abc9c, 0xf39c12];
      for (let b = 0; b < 4; b++) {
        const bookMat = new THREE.MeshStandardMaterial({
          color: bookColors[(i + b) % bookColors.length],
          roughness: 0.5
        });
        const book = new THREE.Mesh(softBox(0.06, 0.32, 0.3), bookMat);
        book.position.set(-0.5 + b * 0.08, y + 0.16, 0.02);
        shelf.add(book);
      }
    }

    // Golden Twitch Partner Trophy in center shelf!
    const trophyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.1, 8), this.materials.metalBlack);
    trophyBase.position.set(0.35, 1.65, 0.05);
    shelf.add(trophyBase);

    const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8), this.materials.goldTrophy);
    trophyStem.position.set(0.35, 1.8, 0.05);
    shelf.add(trophyStem);

    const trophyGlitch = new THREE.Mesh(softBox(0.2, 0.2, 0.06), this.materials.goldTrophy);
    trophyGlitch.position.set(0.35, 2.0, 0.05);
    shelf.add(trophyGlitch);

    // Top shelf Amethyst VIP Crystal
    const crystalGeom = new THREE.OctahedronGeometry(0.18, 0);
    const crystal = new THREE.Mesh(crystalGeom, this.materials.amethystTrophy);
    crystal.position.set(-0.25, 2.2, 0.05);
    shelf.add(crystal);

    this.registerItem('bookshelf', 'Partner Trophy Archive', shelf, { x: 2.2, y: 0, z: 1.2 }, 'Gallery');
  }

  createChandelier() {
    const lamp = new THREE.Group();
    lamp.name = 'furniture_lamp';

    // Suspension cord
    const cordGeom = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
    const cord = new THREE.Mesh(cordGeom, this.materials.metalBlack);
    cord.position.set(0, 3.6, 0);
    lamp.add(cord);

    // Stellar Gyroscopic Orbit Rings
    const ringMat = this.materials.metalChrome;
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 24), ringMat);
    ring1.name = 'lamp_ring_1';
    ring1.position.y = 2.9;
    ring1.rotation.x = Math.PI / 3;
    lamp.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.03, 8, 24), this.materials.goldTrophy);
    ring2.name = 'lamp_ring_2';
    ring2.position.y = 2.9;
    ring2.rotation.y = Math.PI / 4;
    lamp.add(ring2);

    // Luminous Star-Core
    const coreGeom = new THREE.SphereGeometry(0.22, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x9146ff,
      emissiveIntensity: 2.0,
      roughness: 0.1
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.position.y = 2.9;
    lamp.add(core);

    // Point Light source originating from lamp
    const light = new THREE.PointLight(0xa970ff, 2.0, 10, 1.5);
    light.position.y = 2.9;
    light.castShadow = false;
    lamp.add(light);

    this.registerItem('lamp', 'Stellar Gyro-Chandelier', lamp, { x: 0, y: 0, z: 0 }, 'Ceiling');
  }

  createPlant() {
    const plant = new THREE.Group();
    plant.name = 'furniture_plant';

    // Ceramic white pot
    const potGeom = new THREE.CylinderGeometry(0.4, 0.3, 0.7, 12);
    const pot = new THREE.Mesh(potGeom, this.materials.ceramicWhite);
    pot.position.y = 0.35;
    pot.castShadow = true;
    plant.add(pot);

    // Soil
    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.38, 12), this.materials.soilBrown);
    soil.position.y = 0.69;
    soil.rotation.x = -Math.PI / 2;
    plant.add(soil);

    // Sculpted Bonsai / Ficus Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 8);
    const trunk = new THREE.Mesh(trunkGeom, this.materials.darkWood);
    trunk.position.set(0.05, 1.2, 0);
    trunk.rotation.z = -0.15;
    plant.add(trunk);

    // Foliage Clusters (Lush Green Spheres)
    const foliageGeom = new THREE.DodecahedronGeometry(0.55, 1);
    const clusters = [
      [0.1, 1.8, 0, 0.55],
      [-0.3, 1.6, 0.2, 0.45],
      [0.4, 1.5, -0.2, 0.45],
      [0, 2.1, 0.1, 0.4]
    ];
    for (const c of clusters) {
      const cluster = new THREE.Mesh(foliageGeom, this.materials.leafGreen);
      cluster.position.set(c[0], c[1], c[2]);
      cluster.scale.set(c[3], c[3], c[3]);
      cluster.castShadow = true;
      plant.add(cluster);
    }

    this.registerItem('plant', 'Zen Mega-Bonsai', plant, { x: -1.0, y: 0, z: -1.8 }, 'Living Room');
  }

  // Update target scales according to calculated furniture factors
  setScales(scales = {}, bounce = false) {
    scales ||= {};
    for (const [id, item] of this.items) {
      if (scales[id] !== undefined) {
        item.targetScale = scales[id];
      } else if (scales.overall !== undefined) {
        item.targetScale = scales.overall;
      }

      if (bounce) {
        item.bounceVel = 0.22;
      }
    }
  }

  getInteractiveObjects() { return this.interactiveObjects; }

  getItemById(id) { return this.items.get(id) || null; }

  update(delta, houseScale = 1, layout = { width: 10, depth: 8.4, floor: 0.42 }, reducedMotion = false) {
    const { width, depth, floor } = layout;
    // Room-sized zones preserve the growth fantasy without furniture intersecting.
    // Raw watch-time multipliers remain available in the inspector.
    const slots = {
      couch: [0, 0.16, 0.29, 0.35, Math.PI],
      tv: [0, -0.39, 0.27, 0.15, 0],
      bed: [-0.3, -0.02, 0.25, 0.35, 0],
      battlestation: [0.31, -0.24, 0.27, 0.34, 0],
      fridge: [-0.37, 0.32, 0.16, 0.2, 0],
      bookshelf: [-0.35, -0.39, 0.17, 0.12, 0],
      plant: [0.37, 0.32, 0.15, 0.2, 0],
      lamp: [0, 0.02, 0.18, 0.18, 0]
    };
    for (const [id, item] of this.items) {
      if (!reducedMotion && (Math.abs(item.bounceVel) > 0.001 || Math.abs(item.bounceOffset) > 0.001)) {
        item.bounceVel += (-item.bounceOffset * 45 - item.bounceVel * 8) * delta;
        item.bounceOffset += item.bounceVel * delta;
      } else { item.bounceOffset = 0; item.bounceVel = 0; }
      item.currentScale = reducedMotion ? item.targetScale : THREE.MathUtils.damp(item.currentScale, item.targetScale, 6, delta);
      const [x, z, roomW, roomD, rotation] = slots[id];
      const maxScale = Math.min(width * roomW / item.dimensions.x, depth * roomD / item.dimensions.z, (id === 'lamp' ? 3.5 : 3) / item.dimensions.y);
      const growth = 0.7 * Math.pow(Math.max(1, item.currentScale), 0.35);
      const visualScale = Math.min(maxScale, growth) * houseScale;
      item.group.scale.setScalar(visualScale * (1 + item.bounceOffset));
      item.group.rotation.y = rotation;
      item.group.position.set(x * width * houseScale, (floor + 0.06) * houseScale, z * depth * houseScale);
      if (id === 'lamp') item.group.position.y += Math.max(0, 3.9 * houseScale - item.dimensions.y * visualScale);
    }
    if (!reducedMotion) {
      const lamp = this.items.get('lamp');
      const ring1 = lamp.group.getObjectByName('lamp_ring_1');
      const ring2 = lamp.group.getObjectByName('lamp_ring_2');
      if (ring1) ring1.rotation.z += delta * 0.4;
      if (ring2) ring2.rotation.y += delta * 0.55;
    }
  }
}
