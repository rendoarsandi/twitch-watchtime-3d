import * as THREE from 'three';

export class HouseBuilder {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'house_container';
    this.scene.add(this.group);

    this.currentTier = 1;
    this.targetScale = 1.0;
    this.currentScale = 1.0;
    this.viewMode = 'cutaway'; // 'cutaway' | 'exterior' | 'xray'

    this.materials = this.createMaterials();
    this.tierGroups = new Map(); // tierId -> THREE.Group

    this.initTiers();
    this.setTier(1, 1.0);
  }

  createMaterials() {
    return {
      // Wood & Earth
      woodPlanks: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8, metalness: 0.05 }),
      darkWood: new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.7, metalness: 0.1 }),
      cedarSiding: new THREE.MeshStandardMaterial({ color: 0xab6f48, roughness: 0.6, metalness: 0.05 }),
      brickFoundation: new THREE.MeshStandardMaterial({ color: 0x7a3a2a, roughness: 0.85, metalness: 0.0 }),
      concreteSlab: new THREE.MeshStandardMaterial({ color: 0xdcdde1, roughness: 0.5, metalness: 0.1 }),
      
      // Modern & Villa
      slateGraphite: new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.4, metalness: 0.3 }),
      crispWhite: new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.25, metalness: 0.05 }),
      terraceDeck: new THREE.MeshStandardMaterial({ color: 0x9c7a5b, roughness: 0.6, metalness: 0.05 }),
      poolWater: new THREE.MeshStandardMaterial({
        color: 0x00d2d3,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.75
      }),

      // Marble & Gold (Titan Citadel)
      marbleWhite: new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.15, metalness: 0.1 }),
      goldTrim: new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.9, emissive: 0x332200 }),
      neonAmethyst: new THREE.MeshStandardMaterial({ color: 0x9146ff, emissive: 0x9146ff, emissiveIntensity: 2.5, roughness: 0.1 }),
      skyBeacon: new THREE.MeshBasicMaterial({
        color: 0xa970ff,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      }),

      // Roofing
      roofTin: new THREE.MeshStandardMaterial({ color: 0x718093, roughness: 0.4, metalness: 0.6 }),
      roofShingles: new THREE.MeshStandardMaterial({ color: 0x353b48, roughness: 0.75, metalness: 0.2 }),
      solarPanels: new THREE.MeshStandardMaterial({ color: 0x192a56, roughness: 0.2, metalness: 0.8 }),

      // Glass & Cutaway
      glassClear: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.8
      }),
      xrayMat: new THREE.MeshStandardMaterial({
        color: 0x718093,
        transparent: true,
        opacity: 0.25,
        roughness: 0.3,
        metalness: 0.5,
        wireframe: false
      })
    };
  }

  initTiers() {
    this.tierGroups.set(1, this.buildTier1Shack());
    this.tierGroups.set(2, this.buildTier2Cottage());
    this.tierGroups.set(3, this.buildTier3TwoStory());
    this.tierGroups.set(4, this.buildTier4Villa());
    this.tierGroups.set(5, this.buildTier5Citadel());

    for (const [id, grp] of this.tierGroups) {
      grp.visible = false;
      this.group.add(grp);
    }
  }

  // Tier 1: Starter Pod / Rustic Cabin (0 - 15m)
  buildTier1Shack() {
    const root = new THREE.Group();
    root.name = 'tier_1_shack';

    // Wooden plank floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.2, 5.2), this.materials.woodPlanks);
    floor.position.y = 0.1;
    floor.receiveShadow = true;
    root.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.2, 0.2), this.materials.woodPlanks);
    backWall.position.set(0, 1.7, -2.5);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    root.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 5.2), this.materials.woodPlanks);
    leftWall.position.set(-3.0, 1.7, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    root.add(leftWall);

    // Right wall with window opening
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 5.2), this.materials.woodPlanks);
    rightWall.position.set(3.0, 1.7, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    root.add(rightWall);

    // Front Wall (removable for cutaway)
    const frontWallGrp = new THREE.Group();
    frontWallGrp.name = 'front_wall';
    const fwLeft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.2), this.materials.woodPlanks);
    fwLeft.position.set(-2.0, 1.7, 2.5);
    frontWallGrp.add(fwLeft);

    const fwRight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.2), this.materials.woodPlanks);
    fwRight.position.set(2.0, 1.7, 2.5);
    frontWallGrp.add(fwRight);

    // Door beam
    const doorTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.2), this.materials.woodPlanks);
    doorTop.position.set(0, 2.9, 2.5);
    frontWallGrp.add(doorTop);
    root.add(frontWallGrp);

    // Roof (removable for cutaway)
    const roofGrp = new THREE.Group();
    roofGrp.name = 'roof';
    const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(5.2, 1.6, 4), this.materials.roofTin);
    roofMesh.position.set(0, 4.0, 0);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.castShadow = true;
    roofGrp.add(roofMesh);
    root.add(roofGrp);

    // Porch Steps
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.8), this.materials.darkWood);
    step.position.set(0, 0.08, 3.0);
    root.add(step);

    return root;
  }

  // Tier 2: Cozy Suburban Cottage (15m - 1h)
  buildTier2Cottage() {
    const root = new THREE.Group();
    root.name = 'tier_2_cottage';

    // Brick Foundation
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.4, 7.2), this.materials.brickFoundation);
    foundation.position.y = 0.2;
    foundation.receiveShadow = true;
    root.add(foundation);

    // Main Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.1, 7.0), this.materials.cedarSiding);
    floor.position.y = 0.45;
    root.add(floor);

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.8, 0.25), this.materials.cedarSiding);
    backWall.position.set(0, 2.3, -3.4);
    backWall.castShadow = true;
    root.add(backWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.8, 7.0), this.materials.cedarSiding);
    leftWall.position.set(-3.9, 2.3, 0);
    leftWall.castShadow = true;
    root.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.8, 7.0), this.materials.cedarSiding);
    rightWall.position.set(3.9, 2.3, 0);
    rightWall.castShadow = true;
    root.add(rightWall);

    // Front Wall group
    const frontWallGrp = new THREE.Group();
    frontWallGrp.name = 'front_wall';
    const fw = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.8, 0.25), this.materials.cedarSiding);
    fw.position.set(0, 2.3, 3.4);
    frontWallGrp.add(fw);
    root.add(frontWallGrp);

    // Roof & Chimney
    const roofGrp = new THREE.Group();
    roofGrp.name = 'roof';
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.6, 2.5, 4), this.materials.roofShingles);
    roof.position.set(0, 5.2, 0);
    roof.rotation.y = Math.PI / 4;
    roofGrp.add(roof);

    // Stone Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.8, 0.7), this.materials.brickFoundation);
    chimney.position.set(2.4, 4.6, -1.8);
    chimney.castShadow = true;
    roofGrp.add(chimney);
    root.add(roofGrp);

    // Front Covered Porch
    const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 1.8), this.materials.darkWood);
    porchFloor.position.set(0, 0.3, 4.3);
    root.add(porchFloor);

    // Porch posts
    const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
    const postL = new THREE.Mesh(postGeom, this.materials.crispWhite);
    postL.position.set(-1.8, 1.6, 5.0);
    root.add(postL);

    const postR = new THREE.Mesh(postGeom, this.materials.crispWhite);
    postR.position.set(1.8, 1.6, 5.0);
    root.add(postR);

    return root;
  }

  // Tier 3: Two-Story Modern Residence (1h - 5h)
  buildTier3TwoStory() {
    const root = new THREE.Group();
    root.name = 'tier_3_twostory';

    // Concrete Base Slab
    const slab = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.4, 9.2), this.materials.concreteSlab);
    slab.position.y = 0.2;
    root.add(slab);

    // Floor 1 Walls
    const backWall1 = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.2, 0.3), this.materials.slateGraphite);
    backWall1.position.set(0, 2.0, -4.4);
    root.add(backWall1);

    const leftWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 9.0), this.materials.cedarSiding);
    leftWall1.position.set(-5.0, 2.0, 0);
    root.add(leftWall1);

    const rightWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 9.0), this.materials.cedarSiding);
    rightWall1.position.set(5.0, 2.0, 0);
    root.add(rightWall1);

    // Mid-level Floor divider
    const floor2 = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.3, 9.2), this.materials.concreteSlab);
    floor2.name = 'mid_floor';
    floor2.position.set(0, 3.7, 0);
    root.add(floor2);

    // Floor 2 Walls
    const backWall2 = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.2, 0.3), this.materials.crispWhite);
    backWall2.position.set(0, 5.4, -4.4);
    root.add(backWall2);

    const leftWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 6.5), this.materials.crispWhite);
    leftWall2.position.set(-5.0, 5.4, -1.2);
    root.add(leftWall2);

    // Upper Balcony Deck & Glass Railing
    const balconyDeck = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.15, 2.4), this.materials.terraceDeck);
    balconyDeck.position.set(0, 3.9, 3.2);
    root.add(balconyDeck);

    const railing = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.9, 0.08), this.materials.glassClear);
    railing.position.set(0, 4.4, 4.3);
    root.add(railing);

    // Front Wall group
    const frontWallGrp = new THREE.Group();
    frontWallGrp.name = 'front_wall';
    const fw1 = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.2, 0.3), this.materials.slateGraphite);
    fw1.position.set(0, 2.0, 4.4);
    frontWallGrp.add(fw1);

    const fw2 = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.2, 0.3), this.materials.crispWhite);
    fw2.position.set(0, 5.4, 2.0);
    frontWallGrp.add(fw2);
    root.add(frontWallGrp);

    // Modern Flat Roof with Solar Panels
    const roofGrp = new THREE.Group();
    roofGrp.name = 'roof';
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.4, 9.5), this.materials.slateGraphite);
    roofSlab.position.set(0, 7.2, 0);
    roofGrp.add(roofSlab);

    const solar = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.08, 6.0), this.materials.solarPanels);
    solar.position.set(0, 7.45, 0);
    roofGrp.add(solar);
    root.add(roofGrp);

    return root;
  }

  // Tier 4: Modern Glass Villa (5h - 20h)
  buildTier4Villa() {
    const root = new THREE.Group();
    root.name = 'tier_4_villa';

    // Massive Marble/Concrete Foundation & Patio Deck
    const patio = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.5, 12.5), this.materials.terraceDeck);
    patio.position.y = 0.25;
    root.add(patio);

    // Turquoise Infinity Pool
    const pool = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 3.6), this.materials.poolWater);
    pool.position.set(-4.2, 0.4, 3.8);
    root.add(pool);

    const poolRim = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 4.0), this.materials.crispWhite);
    poolRim.position.set(-4.2, 0.2, 3.8);
    root.add(poolRim);

    // Cantilevered Architectural Wings (Crisp White + Slate)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(14.0, 4.5, 0.35), this.materials.slateGraphite);
    backWall.position.set(0, 2.5, -5.8);
    root.add(backWall);

    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.5, 9.0), this.materials.crispWhite);
    leftWing.position.set(-6.8, 2.5, -1.2);
    root.add(leftWing);

    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.5, 9.0), this.materials.crispWhite);
    rightWing.position.set(6.8, 2.5, -1.2);
    root.add(rightWing);

    // Upper Overhanging Villa Box
    const cantilever = new THREE.Mesh(new THREE.BoxGeometry(8.5, 3.2, 9.0), this.materials.slateGraphite);
    cantilever.position.set(2.6, 6.2, 0.5);
    root.add(cantilever);

    // Front Wall & Panoramic Glass Panels
    const frontWallGrp = new THREE.Group();
    frontWallGrp.name = 'front_wall';
    const glassFacade = new THREE.Mesh(new THREE.BoxGeometry(13.5, 4.2, 0.1), this.materials.glassClear);
    glassFacade.position.set(0, 2.4, 4.8);
    frontWallGrp.add(glassFacade);
    root.add(frontWallGrp);

    // Rooftop Lounge & Pergola
    const roofGrp = new THREE.Group();
    roofGrp.name = 'roof';
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.4, 11.5), this.materials.crispWhite);
    roofSlab.position.set(0, 8.0, 0);
    roofGrp.add(roofSlab);

    // Pergola Beams
    for (let b = -4; b <= 4; b += 1.5) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 6.0), this.materials.darkWood);
      beam.position.set(b, 8.8, 0);
      roofGrp.add(beam);
    }
    root.add(roofGrp);

    return root;
  }

  // Tier 5: Titan Sky Citadel (20h+)
  buildTier5Citadel() {
    const root = new THREE.Group();
    root.name = 'tier_5_citadel';

    // Monumental Multi-tiered Marble Platform
    const baseP1 = new THREE.Mesh(new THREE.CylinderGeometry(11.0, 11.8, 0.6, 32), this.materials.marbleWhite);
    baseP1.position.y = 0.3;
    root.add(baseP1);

    const baseP2 = new THREE.Mesh(new THREE.CylinderGeometry(9.8, 10.5, 0.5, 32), this.materials.goldTrim);
    baseP2.position.y = 0.8;
    root.add(baseP2);

    // Colossal Fluted Marble Columns
    const colGeom = new THREE.CylinderGeometry(0.4, 0.45, 8.5, 16);
    const colCount = 10;
    const colRadius = 8.5;
    for (let i = 0; i < colCount; i++) {
      const angle = (i / colCount) * Math.PI * 2;
      const col = new THREE.Mesh(colGeom, this.materials.marbleWhite);
      col.position.set(Math.cos(angle) * colRadius, 5.0, Math.sin(angle) * colRadius);

      // Gold capital
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.35, 16), this.materials.goldTrim);
      cap.position.set(Math.cos(angle) * colRadius, 9.2, Math.sin(angle) * colRadius);
      root.add(col);
      root.add(cap);
    }

    // Glowing Neon Amethyst Trim Lines
    const ringGeom = new THREE.TorusGeometry(8.5, 0.12, 12, 48);
    const neonRing = new THREE.Mesh(ringGeom, this.materials.neonAmethyst);
    neonRing.position.y = 1.05;
    neonRing.rotation.x = Math.PI / 2;
    root.add(neonRing);

    // Floating Geometric Celestial Halo
    const haloGeom = new THREE.TorusGeometry(7.2, 0.18, 16, 64);
    const halo = new THREE.Mesh(haloGeom, this.materials.goldTrim);
    halo.name = 'floating_halo';
    halo.position.y = 12.5;
    halo.rotation.x = Math.PI / 2;
    root.add(halo);

    // Vertical Celestial Energy Sky Beacon (shooting into space!)
    const beaconGeom = new THREE.CylinderGeometry(1.2, 1.8, 45, 24, 1, true);
    const beacon = new THREE.Mesh(beaconGeom, this.materials.skyBeacon);
    beacon.position.y = 25.0;
    root.add(beacon);

    // Roof & Citadel Temple Dome
    const roofGrp = new THREE.Group();
    roofGrp.name = 'roof';
    const domeGeom = new THREE.SphereGeometry(6.5, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const dome = new THREE.Mesh(domeGeom, this.materials.goldTrim);
    dome.position.y = 9.4;
    roofGrp.add(dome);
    root.add(roofGrp);

    return root;
  }

  setTier(tierId, scaleFactor = 1.0) {
    this.currentTier = tierId;
    this.targetScale = scaleFactor;

    for (const [id, grp] of this.tierGroups) {
      grp.visible = (id === tierId);
    }

    this.applyViewMode(this.viewMode);
  }

  setViewMode(mode) {
    this.viewMode = mode; // 'cutaway' | 'exterior' | 'xray'
    this.applyViewMode(mode);
  }

  applyViewMode(mode) {
    for (const [id, grp] of this.tierGroups) {
      grp.traverse((child) => {
        if (child.name === 'roof' || child.name === 'front_wall' || child.name === 'mid_floor') {
          if (mode === 'cutaway') {
            child.visible = false;
          } else if (mode === 'exterior') {
            child.visible = true;
            child.traverse((c) => {
              if (c.isMesh) {
                c.material.transparent = false;
                c.material.opacity = 1.0;
              }
            });
          } else if (mode === 'xray') {
            child.visible = true;
            child.traverse((c) => {
              if (c.isMesh) {
                c.material = this.materials.xrayMat;
              }
            });
          }
        }
      });
    }
  }

  update(delta) {
    // Smooth architectural scale interpolation
    this.currentScale += (this.targetScale - this.currentScale) * Math.min(1.0, delta * 4.0);
    this.group.scale.set(this.currentScale, this.currentScale, this.currentScale);

    // Rotate celestial halo in Titan Citadel
    const citadel = this.tierGroups.get(5);
    if (citadel && citadel.visible) {
      const halo = citadel.getObjectByName('floating_halo');
      if (halo) {
        halo.rotation.z += delta * 0.4;
      }
    }
  }
}
