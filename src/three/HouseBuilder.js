import * as THREE from 'three';
import { surfaceTexture } from './materials.js';

export const HOUSE_LAYOUTS = {
  1: { width: 10, depth: 8.4, height: 4.6, floor: 0.42 },
  2: { width: 11.5, depth: 9.6, height: 5.5, floor: 0.52 },
  3: { width: 13, depth: 10.6, height: 7.8, floor: 0.52 },
  4: { width: 15, depth: 12, height: 8.5, floor: 0.52 },
  5: { width: 18, depth: 15, height: 15, floor: 0.85 }
};

export class HouseBuilder {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'house_container';
    scene.add(this.group);
    this.currentTier = 1;
    this.currentScale = this.targetScale = 1;
    this.viewMode = 'cutaway';
    this.elapsed = 0;
    this.materials = this.createMaterials();
    this.tierGroups = new Map();
    this.buildTier(1);
  }

  createMaterials() {
    const wood = surfaceTexture('wood', '#bc9169', '#876347');
    wood.repeat.set(2, 2);
    const siding = surfaceTexture('wood', '#957053', '#6d513e');
    siding.repeat.set(2, 1);
    const stone = surfaceTexture('tile', '#c9c7b9', '#acaa9e');
    stone.repeat.set(2, 2);
    const shingles = surfaceTexture('roof', '#394b51', '#27373c');
    shingles.repeat.set(3, 2);
    return {
      wood: new THREE.MeshStandardMaterial({ map: wood, roughness: 0.78 }),
      cedar: new THREE.MeshStandardMaterial({ map: siding, roughness: 0.85 }),
      stone: new THREE.MeshStandardMaterial({ map: stone, roughness: 0.85 }),
      cream: new THREE.MeshStandardMaterial({ color: 0xe7e2d3, roughness: 0.8 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x293a3c, roughness: 0.6 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x53615b, metalness: 0.35, roughness: 0.5 }),
      roof: new THREE.MeshStandardMaterial({ map: shingles, roughness: 0.65 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x9dc6c3, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide }),
      warm: new THREE.MeshStandardMaterial({ color: 0xffd7a0, emissive: 0xffb65e, emissiveIntensity: 1.4, roughness: 0.4 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xcbb578, metalness: 0.75, roughness: 0.26 }),
      neon: new THREE.MeshStandardMaterial({ color: 0xb9a3ff, emissive: 0x9671ff, emissiveIntensity: 1.8 }),
      water: new THREE.MeshStandardMaterial({ color: 0x4aafbb, metalness: 0.3, roughness: 0.16, transparent: true, opacity: 0.86 }),
      leaf: new THREE.MeshStandardMaterial({ color: 0x71894d, roughness: 0.9 }),
      xray: new THREE.MeshStandardMaterial({ color: 0x99d2e3, emissive: 0x15323e, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }),
      beam: new THREE.MeshBasicMaterial({ color: 0xa99aff, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    };
  }

  box(parent, size, position, material = 'cream', cut = false) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), this.materials[material]);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.originalMaterial = mesh.material;
    mesh.userData.cutaway = cut;
    parent.add(mesh);
    return mesh;
  }

  window(parent, x, y, z, width, height, side = false, cut = false) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    if (side) group.rotation.y = Math.PI / 2;
    parent.add(group);
    this.box(group, [width + 0.16, 0.12, 0.28], [0, -height / 2, 0], 'cream', cut);
    this.box(group, [width + 0.16, 0.1, 0.2], [0, height / 2, 0], 'dark', cut);
    for (const sign of [-1, 1]) this.box(group, [0.09, height, 0.18], [sign * width / 2, 0, 0], 'dark', cut);
    this.box(group, [width, height, 0.025], [0, 0, 0], 'glass', cut).castShadow = false;
    this.box(group, [0.05, height, 0.08], [0, 0, 0.025], 'dark', cut);
  }

  // A wall with actual openings: windows remain transparent from every camera angle.
  wall(parent, width, height, x, z, material, side = false, cut = false, base = 0.5) {
    const group = new THREE.Group();
    group.position.set(x, base, z);
    if (side) group.rotation.y = Math.PI / 2;
    parent.add(group);
    const sill = 1.05;
    const windowHeight = height - 1.65;
    this.box(group, [width, sill, 0.2], [0, sill / 2, 0], material, cut);
    this.box(group, [width, 0.6, 0.2], [0, height - 0.3, 0], material, cut);
    const openings = Math.max(2, Math.floor(width / 3.4));
    const bay = width / openings;
    for (let i = 0; i <= openings; i++) {
      this.box(group, [0.3, windowHeight, 0.22], [-width / 2 + bay * i, sill + windowHeight / 2, 0], material, cut);
      if (i < openings) this.window(group, -width / 2 + bay * (i + 0.5), sill + windowHeight / 2, 0, bay - 0.35, windowHeight, false, cut);
    }
    this.box(group, [width, 0.1, 0.26], [0, 0.15, 0], 'dark', cut);
  }

  plant(parent, x, y, z, scale = 1) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.5, 8), this.materials.cream);
    pot.position.set(x, y + 0.25 * scale, z);
    pot.scale.setScalar(scale);
    pot.castShadow = true;
    parent.add(pot);
    const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.44, 1), this.materials.leaf);
    shrub.position.set(x, y + 0.8 * scale, z);
    shrub.scale.set(scale, scale * 1.2, scale);
    shrub.castShadow = true;
    parent.add(shrub);
  }

  pitchedRoof(root, width, depth, base, rise) {
    const roof = new THREE.Group();
    root.add(roof);
    const half = width / 2 + 0.5;
    const slope = Math.atan2(rise, half);
    for (const sign of [-1, 1]) {
      const panel = this.box(roof, [Math.hypot(half, rise), 0.16, depth + 1], [sign * half / 2, base + rise / 2, 0], 'roof', true);
      panel.rotation.z = -sign * slope;
      const fascia = this.box(roof, [Math.hypot(half, rise), 0.23, 0.12], [sign * half / 2, base + rise / 2, depth / 2 + 0.5], 'cream', true);
      fascia.rotation.z = -sign * slope;
    }
    for (const sign of [-1, 1]) {
      const shape = new THREE.Shape();
      shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0); shape.lineTo(0, rise); shape.closePath();
      const gable = new THREE.Mesh(new THREE.ShapeGeometry(shape), this.materials.cedar);
      gable.material = this.materials.cedar.clone();
      gable.material.side = THREE.DoubleSide;
      gable.position.set(0, base, sign * depth / 2);
      gable.castShadow = true; gable.userData.cutaway = true;
      roof.add(gable);
    }
    this.box(roof, [0.15, 0.12, depth + 1.1], [0, base + rise, 0], 'dark', true);
    this.box(roof, [0.65, 1.7, 0.7], [-width * 0.3, base + 0.9, -depth * 0.22], 'stone', true);
    this.box(roof, [0.85, 0.18, 0.85], [-width * 0.3, base + 1.8, -depth * 0.22], 'dark', true);
  }

  buildTier(tier) {
    if (this.tierGroups.has(tier)) return;
    const root = new THREE.Group();
    root.name = `house_tier_${tier}`;
    const { width: w, depth: d, floor: f } = HOUSE_LAYOUTS[tier];
    this.group.add(root);
    this.tierGroups.set(tier, root);
    if (tier === 5) this.buildCitadel(root, w, d, f);
    else {
      const rustic = tier < 3;
      const h = tier === 1 ? 3.2 : tier === 2 ? 3.6 : 3.5;
      this.box(root, [w + 0.45, f, d + 0.45], [0, f / 2, 0], 'stone');
      this.box(root, [w, 0.08, d], [0, f, 0], 'wood');
      this.wall(root, w, h, 0, -d / 2, rustic ? 'cedar' : 'dark', false, false, f);
      this.wall(root, d, h, -w / 2, 0, rustic ? 'cedar' : 'cream', true, false, f);
      this.wall(root, d, h, w / 2, 0, rustic ? 'cedar' : 'cream', true, true, f);
      this.frontFacade(root, w, d, h, f, rustic);
      // Exposed roofline and warm cove strip make the cut plane legible.
      this.box(root, [w, 0.15, 0.28], [0, f + h, -d / 2], 'dark');
      this.box(root, [w - 0.5, 0.035, 0.06], [0, f + h - 0.15, -d / 2 + 0.14], 'warm');
      this.box(root, [0.28, 0.15, d], [-w / 2, f + h, 0], 'dark');
      // Timber deck, steps and porch lighting.
      this.box(root, [w + 1.1, 0.22, 1.8], [0, f - 0.12, d / 2 + 0.9], 'wood');
      for (let i = 0; i < 3; i++) this.box(root, [2.6 + i * 0.3, 0.12, 0.45], [0, f - 0.1 - i * 0.13, d / 2 + 1.9 + i * 0.4], 'stone');
      this.plant(root, -w / 2 + 0.65, f, d / 2 + 0.8);
      this.plant(root, w / 2 - 0.65, f, d / 2 + 0.8);
      if (rustic) {
        this.pitchedRoof(root, w, d, f + h, tier === 1 ? 1.2 : 1.8);
        for (const x of [-w / 2, w / 2]) this.box(root, [0.18, h, 0.18], [x, f + h / 2, -d / 2 + 0.04], 'dark');
      } else this.buildUpperFloor(root, w, d, f, tier);
      if (tier === 4) this.buildPool(root, w, d, f);
    }
    root.traverse(child => {
      if (child.isMesh && !child.userData.originalMaterial) child.userData.originalMaterial = child.material;
    });
    this.applyViewMode(this.viewMode);
  }

  frontFacade(root, w, d, h, f, rustic) {
    const material = rustic ? 'cedar' : 'cream';
    for (const sign of [-1, 1]) {
      const wing = new THREE.Group();
      wing.position.x = sign * (w / 4 + 0.55);
      root.add(wing);
      this.wall(wing, w / 2 - 1.1, h, 0, d / 2, material, false, true, f);
    }
    this.box(root, [2.2, h - 2.65, 0.2], [0, f + 2.65 + (h - 2.65) / 2, d / 2], material, true);
    this.box(root, [1.9, 2.6, 0.1], [0, f + 1.3, d / 2], 'dark', true);
    this.box(root, [1.5, 1.8, 0.03], [0, f + 1.55, d / 2 + 0.07], 'glass', true);
    this.box(root, [0.04, 0.45, 0.08], [0.65, f + 1.15, d / 2 + 0.12], 'gold', true);
    for (const sign of [-1, 1]) {
      this.box(root, [0.18, 0.48, 0.22], [sign * 1.4, f + 2.25, d / 2 + 0.16], 'dark', true);
      this.box(root, [0.14, 0.32, 0.23], [sign * 1.4, f + 2.25, d / 2 + 0.18], 'warm', true);
    }
  }

  buildUpperFloor(root, w, d, f, tier) {
    const y = f + 3.75;
    const upperDepth = d * 0.44;
    const z = -d * 0.28;
    const upperWidth = tier === 4 ? w * 0.72 : w;
    const x = tier === 4 ? w * 0.14 : 0;
    this.box(root, [upperWidth + 0.4, 0.24, upperDepth], [x, y, z], 'cream', true);
    this.wall(root, upperWidth, 2.8, x, -d / 2, 'cream', false, false, y);
    this.wall(root, upperDepth, 2.8, x - upperWidth / 2, z, 'dark', true, false, y);
    this.wall(root, upperDepth, 2.8, x + upperWidth / 2, z, 'dark', true, true, y);
    this.wall(root, upperWidth, 2.8, x, z + upperDepth / 2, 'dark', false, true, y);
    const balconyZ = z + upperDepth / 2 + 0.8;
    this.box(root, [upperWidth, 0.16, 1.6], [x, y - 0.03, balconyZ], 'wood', true);
    this.box(root, [upperWidth, 0.8, 0.04], [x, y + 0.45, balconyZ + 0.75], 'glass', true);
    this.box(root, [upperWidth, 0.06, 0.06], [x, y + 0.87, balconyZ + 0.75], 'dark', true);
    for (let i = 0; i < 5; i++) this.box(root, [0.05, 0.9, 0.05], [x - upperWidth / 2 + upperWidth * i / 4, y + 0.42, balconyZ + 0.75], 'dark', true);
    this.box(root, [upperWidth + 0.8, 0.3, upperDepth + 1.1], [x, y + 2.95, z + 0.1], 'cream', true);
    this.box(root, [upperWidth - 0.8, 0.06, upperDepth - 0.7], [x, y + 3.13, z], 'dark', true);
    // Solar array: shared frame with inset cells.
    for (let i = 0; i < 6; i++) this.box(root, [(upperWidth - 1.3) / 6, 0.04, upperDepth - 1], [x - (upperWidth - 1) / 2 + (i + 0.5) * (upperWidth - 1) / 6, y + 3.18, z], 'glass', true);
    if (tier === 4) {
      for (const x of [-w * 0.53, -w * 0.27]) {
        this.box(root, [0.14, 0.18, d * 0.65], [x, y + 2.5, 0], 'wood', true);
        for (const z of [-d * 0.3, d * 0.3]) this.box(root, [0.14, y + 2.5 - f, 0.14], [x, (y + 2.5 + f) / 2, z], 'dark', true);
      }
      for (let i = 0; i < 7; i++) this.box(root, [w * 0.28, 0.12, 0.14], [-w * 0.4, y + 2.65, -d * 0.28 + i * d * 0.09], 'wood', true);
    }
  }

  buildPool(root, w, d, f) {
    const x = w / 2 + 2.25;
    this.box(root, [4.3, 0.35, d + 1.8], [x, f - 0.2, 0.7], 'stone');
    this.box(root, [3.4, 0.12, 7.2], [x, f, 1], 'dark');
    const water = this.box(root, [3.1, 0.035, 6.9], [x, f + 0.08, 1], 'water');
    water.castShadow = false;
    water.name = 'pool_water';
    for (let i = 0; i < 5; i++) this.box(root, [3.05, 0.008, 0.025], [x, f + 0.11, -1.5 + i * 1.25], 'glass');
    this.box(root, [1.2, 0.16, 2], [x, f + 0.1, -4.2], 'wood');
    this.plant(root, x, f, d / 2 + 0.8, 1.2);
  }

  buildCitadel(root, w, d, f) {
    for (const [radius, y, height, material] of [[11, 0.2, 0.4, 'dark'], [10.5, 0.55, 0.3, 'gold'], [10, f - 0.08, 0.25, 'stone']]) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.2, height, 64), this.materials[material]);
      disc.position.y = y; disc.castShadow = disc.receiveShadow = true; root.add(disc);
    }
    this.box(root, [w, 0.1, d], [0, f, 0], 'wood');
    this.wall(root, w * 0.9, 6, 0, -d / 2, 'cream', false, false, f);
    this.wall(root, d, 6, -w / 2, 0, 'dark', true, false, f);
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 8, 12), this.materials.cream);
      column.position.set(Math.cos(angle) * 9.2, f + 4, Math.sin(angle) * 9.2);
      column.castShadow = true;
      column.userData.cutaway = Math.sin(angle) > 0.1 || Math.cos(angle) > 0.8;
      root.add(column);
      for (const y of [f + 0.2, f + 7.8]) {
        const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.25, 12), this.materials.gold);
        capital.position.set(column.position.x, y, column.position.z);
        capital.userData.cutaway = column.userData.cutaway;
        root.add(capital);
      }
    }
    const ring = (radius, tube, y, material, cut) => {
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 64), this.materials[material]);
      mesh.rotation.x = Math.PI / 2; mesh.position.y = y; mesh.userData.cutaway = cut; root.add(mesh); return mesh;
    };
    ring(9.4, 0.07, f + 0.1, 'neon', false);
    ring(9.35, 0.24, f + 8.2, 'gold', true);
    const halo = ring(6.7, 0.08, f + 11, 'gold', false);
    halo.name = 'floating_halo';
    const dome = new THREE.Mesh(new THREE.SphereGeometry(6.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.materials.glass);
    dome.position.y = f + 8.2; dome.userData.cutaway = true; root.add(dome);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), this.materials.neon);
    core.position.set(0, f + 11, 0); root.add(core);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.7, 5, 24, 1, true), this.materials.beam);
    beacon.position.y = f + 13; root.add(beacon);
    for (const x of [-8, 8]) this.plant(root, x, f, 5, 1.8);
  }

  setTier(tierId, scaleFactor = 1) {
    const tier = HOUSE_LAYOUTS[tierId] ? tierId : 1;
    this.buildTier(tier);
    this.currentTier = tier;
    this.targetScale = Math.max(0.5, Number(scaleFactor) || 1);
    for (const [id, group] of this.tierGroups) group.visible = id === tier;
  }

  setViewMode(mode) { this.viewMode = mode; this.applyViewMode(mode); }

  applyViewMode(mode) {
    for (const group of this.tierGroups.values()) group.traverse(child => {
      if (!child.isMesh) return;
      const original = child.userData.originalMaterial;
      child.visible = !(mode === 'cutaway' && child.userData.cutaway);
      // Never mutate shared materials; every mode is reversible.
      child.material = mode === 'xray' && child.userData.cutaway ? this.materials.xray : original;
    });
  }

  update(delta, reducedMotion = false) {
    this.elapsed += delta;
    this.currentScale = reducedMotion ? this.targetScale : THREE.MathUtils.damp(this.currentScale, this.targetScale, 5, delta);
    this.group.scale.setScalar(this.currentScale);
    const halo = this.tierGroups.get(5)?.getObjectByName('floating_halo');
    if (halo && !reducedMotion) halo.rotation.z = Math.sin(this.elapsed * 0.35) * 0.12;
  }
}
