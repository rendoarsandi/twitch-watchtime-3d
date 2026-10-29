import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HouseBuilder, HOUSE_LAYOUTS } from './HouseBuilder.js';
import { FurnitureManager } from './FurnitureManager.js';
import { CelebrationFX } from './CelebrationFX.js';
import { disposeTree } from './materials.js';

const ATMOSPHERES = {
  day: { background: 0x657e87, sky: 0xeaf5ff, ground: 0x7b8774, sun: 0xfff3dc, fill: 0xb9dcff, sunPower: 3.2, ambient: 2.1, warm: 0.35, exposure: 1.1, position: [18, 28, 14] },
  sunset: { background: 0x2d303b, sky: 0xffead5, ground: 0x536b70, sun: 0xffc081, fill: 0xb6cffa, sunPower: 3.6, ambient: 1.65, warm: 1.5, exposure: 1.05, position: [-15, 18, 22] },
  night: { background: 0x101b2c, sky: 0x9baedb, ground: 0x293448, sun: 0xaac7ff, fill: 0x9c91d4, sunPower: 1.2, ambient: 1.25, warm: 2.3, exposure: 1.05, position: [12, 25, -18] }
};

export class SceneManager {
  constructor(container, onSelectFurniture, options = {}) {
    this.container = container;
    this.onSelectFurniture = onSelectFurniture;
    this.isTransparent = Boolean(options.isTransparent);
    this.scene = new THREE.Scene();
    this.timer = new THREE.Timer();
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionQuery.matches;
    this.onMotionChange = e => { this.reducedMotion = e.matches; this.controls.autoRotate = this.cameraPreset === 'cinematic' && !e.matches; };
    this.currentHouseScale = 1;
    this.currentTier = 1;
    this.cameraPreset = 'isometric';
    this.autoFrame = true;
    this.lightingMode = 'sunset';
    this.backgroundColor = new THREE.Color(ATMOSPHERES.sunset.background);
    this.initRenderer();
    this.initCamera();
    this.initLights();
    this.initEnvironment();
    this.house = new HouseBuilder(this.scene);
    this.furniture = new FurnitureManager(this.scene);
    this.celebration = new CelebrationFX(this.scene);
    this.initInteraction();
    this.initResize();
    this.applyLightingMode('sunset', true);
    this.setCameraPreset('isometric', true);
    this.timer.connect(document);
    this.motionQuery.addEventListener('change', this.onMotionChange);
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.75));
    this.isVisible = this.container.clientWidth > 0 && this.container.clientHeight > 0;
    this.renderer.setSize(Math.max(1, this.container.clientWidth), Math.max(1, this.container.clientHeight));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environmentMap = pmrem.fromScene(room, 0.04, 0.1, 100, { size: window.innerWidth < 768 ? 64 : 128 });
    this.scene.environment = this.environmentMap.texture;
    this.scene.environmentIntensity = 0.35;
    room.dispose();
    pmrem.dispose();
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(38, Math.max(1, this.container.clientWidth) / Math.max(1, this.container.clientHeight), 0.1, 2000);
    this.camera.position.set(18, 16, 21);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 800;
    this.controls.autoRotateSpeed = 0.7;
    this.controls.target.set(0, 2, 0);
    this.onOrbitStart = () => { this.cameraTransition = null; this.autoFrame = false; };
    this.controls.addEventListener('start', this.onOrbitStart);
  }

  initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xffead5, 0x536b70, 1.65);
    this.scene.add(this.hemiLight);
    this.sunLight = new THREE.DirectionalLight(0xffc081, 3.6);
    this.sunLight.castShadow = true;
    const mapSize = window.innerWidth < 768 ? 1024 : 2048;
    this.sunLight.shadow.mapSize.set(mapSize, mapSize);
    this.sunLight.shadow.normalBias = 0.035;
    this.sunLight.shadow.bias = -0.00015;
    this.sunLight.shadow.radius = 3;
    this.scene.add(this.sunLight, this.sunLight.target);
    this.fillLight = new THREE.DirectionalLight(0xb6cffa, 1.4);
    this.fillLight.position.set(12, 9, -14);
    this.scene.add(this.fillLight);
    this.interiorLight = new THREE.PointLight(0xffc387, 26, 20, 2);
    this.interiorLight.position.set(0, 3.5, 0);
    this.scene.add(this.interiorLight);
    this.neonLight = new THREE.PointLight(0x9774ff, 12, 14, 2);
    this.neonLight.position.set(2, 2, -1);
    this.scene.add(this.neonLight);
  }

  initEnvironment() {
    this.envGroup = new THREE.Group();
    this.scene.add(this.envGroup);
    const stone = new THREE.MeshStandardMaterial({ color: 0x46595c, roughness: 0.85 });
    const rim = new THREE.MeshStandardMaterial({ color: 0xb3b9ab, roughness: 0.8 });
    const grass = new THREE.MeshStandardMaterial({ color: 0x657b53, roughness: 1 });
    const trunk = new THREE.MeshStandardMaterial({ color: 0x78624c, roughness: 1 });
    const foliage = [0x638061, 0x859765, 0x526f5b].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    const box = (w, h, d, x, y, z, mat) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z); mesh.receiveShadow = true; this.envGroup.add(mesh); return mesh;
    };
    box(21, 0.8, 19, 0, -0.7, 0, stone);
    box(21.3, 0.12, 19.3, 0, -0.25, 0, rim);
    box(20.7, 0.22, 18.7, 0, -0.1, 0, grass);
    // A low plinth, gravel beds and individual entry pavers ground the architecture.
    for (let i = 0; i < 6; i++) box(1.65, 0.07, 0.58, 0, 0.04, 5.8 + i * 0.62, rim);
    for (const x of [-8.4, 8.4]) {
      box(2.4, 0.06, 14.8, x, 0.035, -0.2, stone);
      for (let i = 0; i < 3; i++) {
        const z = -6.1 + i * 5.6;
        const tree = new THREE.Group();
        tree.position.set(x, 0, z);
        const bark = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 1.6, 7), trunk);
        bark.position.y = 0.8; bark.castShadow = true; tree.add(bark);
        for (let layer = 0; layer < 3; layer++) {
          const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 - layer * 0.17, 1), foliage[(i + layer) % 3]);
          leaf.position.set(layer % 2 ? 0.18 : -0.12, 1.7 + layer * 0.55, 0);
          leaf.scale.y = 1.2; leaf.castShadow = true; tree.add(leaf);
        }
        this.envGroup.add(tree);
      }
    }
    // Repeated planting uses one draw call instead of dozens of individual meshes.
    const shrubs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.24, 0), foliage[1], 36);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 36; i++) {
      const side = i < 18 ? -1 : 1;
      dummy.position.set(side * (7.8 + (i % 3) * 0.45), 0.2, -7.1 + (i % 18) * 0.8);
      dummy.scale.set(1, 0.8 + (i % 3) * 0.15, 1); dummy.updateMatrix(); shrubs.setMatrixAt(i, dummy.matrix);
    }
    shrubs.castShadow = true; this.envGroup.add(shrubs);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe2b1, emissive: 0xffbd72, emissiveIntensity: 1 });
    for (const x of [-1.5, 1.5]) for (const z of [6.4, 8.3]) {
      box(0.16, 0.6, 0.16, x, 0.3, z, stone);
      box(0.19, 0.1, 0.19, x, 0.59, z, lampMat);
    }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.15 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -1.13; ground.receiveShadow = true;
    this.envGroup.add(ground);
  }

  setTransparent(enabled) { this.isTransparent = Boolean(enabled); this.applyLightingMode(this.lightingMode, true); }

  applyLightingMode(mode, immediate = false) {
    if (!ATMOSPHERES[mode]) return;
    this.lightingMode = mode;
    this.lightTarget = ATMOSPHERES[mode];
    this.lightColors = Object.fromEntries(['background', 'sky', 'ground', 'sun', 'fill'].map(key => [key, new THREE.Color(this.lightTarget[key])]));
    this.envGroup.visible = !this.isTransparent;
    this.scene.background = this.isTransparent ? null : this.backgroundColor;
    this.renderer.setClearColor(0x000000, 0);
    this.updateLighting(immediate ? 1 : 0);
  }

  updateLighting(amount) {
    const t = this.lightTarget;
    this.backgroundColor.lerp(this.lightColors.background, amount);
    this.hemiLight.color.lerp(this.lightColors.sky, amount);
    this.hemiLight.groundColor.lerp(this.lightColors.ground, amount);
    this.hemiLight.intensity = THREE.MathUtils.lerp(this.hemiLight.intensity, t.ambient, amount);
    this.sunLight.color.lerp(this.lightColors.sun, amount);
    this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, t.sunPower, amount);
    this.fillLight.color.lerp(this.lightColors.fill, amount);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, t.exposure, amount);
    this.interiorLight.intensity = THREE.MathUtils.lerp(this.interiorLight.intensity, t.warm * 28, amount);
    if (this.house) this.house.materials.warm.emissiveIntensity = THREE.MathUtils.lerp(this.house.materials.warm.emissiveIntensity, 0.4 + t.warm * 0.5, amount);
    const s = Math.max(1, this.currentHouseScale);
    const layout = HOUSE_LAYOUTS[this.currentTier];
    const extent = Math.max(layout.width, layout.depth) * s;
    this.sunLight.position.set(...t.position).multiplyScalar(extent / 12);
    this.sunLight.target.position.set(0, layout.height * s * 0.22, 0);
    const shadow = this.sunLight.shadow.camera;
    shadow.left = shadow.bottom = -extent * 0.85;
    shadow.right = shadow.top = extent * 0.85;
    shadow.far = extent * 7; shadow.updateProjectionMatrix();
    this.interiorLight.position.set(0, 3 * s, 0);
    this.interiorLight.distance = extent * 1.2;
    this.neonLight.position.set(2 * s, 2 * s, -s);
    this.neonLight.distance = extent;
  }

  framePosition(preset) {
    const layout = HOUSE_LAYOUTS[this.currentTier];
    const s = this.currentHouseScale;
    const width = (layout.width + (this.currentTier === 4 ? 5.5 : 3.5)) * s;
    const height = (layout.height + 1) * s;
    const target = new THREE.Vector3(this.currentTier === 4 ? 1.2 * s : 0, height * 0.32, 0.5 * s);
    const fov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const distance = Math.max(width / (2 * Math.tan(fov) * this.camera.aspect), (height * 0.68 + layout.depth * s * 0.45) / (2 * Math.tan(fov))) * 1.2;
    const direction = new THREE.Vector3(1.05, 0.95, 1.35).normalize();
    if (preset === 'dollhouse') direction.set(0.12, 0.65, 1.35).normalize();
    if (preset === 'topdown') { direction.set(0, 1, 0.001); target.y = 0; }
    if (preset === 'studio') {
      target.set(0, 1.55 * s, -0.7 * s);
      return { position: new THREE.Vector3(layout.width * 0.22 * s, 3.4 * s, layout.depth * 0.5 * s), target };
    }
    return { position: target.clone().addScaledVector(direction, distance), target };
  }

  setCameraPreset(preset, immediate = false) {
    this.cameraPreset = preset;
    this.controls.autoRotate = preset === 'cinematic' && !this.reducedMotion;
    this.autoFrame = true;
    const frame = this.framePosition(preset);
    this.cameraTransition = frame;
    if (immediate || this.reducedMotion) {
      this.camera.position.copy(frame.position); this.controls.target.copy(frame.target);
      this.cameraTransition = null; this.controls.update();
    }
  }

  setViewMode(mode) { this.house.setViewMode(mode); this.updateOccluders(); }

  updateOccluders() {
    this.occluders = [];
    this.house.tierGroups.get(this.currentTier)?.traverseVisible(object => {
      if (object.isMesh && (!object.material.transparent || object.material.opacity > 0.4)) this.occluders.push(object);
    });
  }

  selectFurniture(id, notify = false) {
    const item = this.furniture.getItemById(id);
    this.selectedItem = item;
    if (!this.selectionBox) {
      this.selectionBounds = new THREE.Box3();
      this.selectionBox = new THREE.Box3Helper(this.selectionBounds, 0xc0df85);
      this.selectionBox.material.depthTest = false;
      this.selectionBox.renderOrder = 10;
      this.scene.add(this.selectionBox);
    }
    this.selectionBox.visible = Boolean(item);
    if (notify) this.onSelectFurniture?.(item ? { id: item.id, name: item.name, category: item.category } : null);
  }

  focusSelected() {
    if (!this.selectedItem) return;
    const bounds = new THREE.Box3().setFromObject(this.selectedItem.group);
    const target = bounds.getCenter(new THREE.Vector3());
    const radius = bounds.getSize(new THREE.Vector3()).length() * 0.8;
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    this.cameraTransition = { target, position: target.clone().addScaledVector(direction, Math.max(3, radius / Math.min(1, this.camera.aspect))) };
    this.controls.autoRotate = false;
    this.autoFrame = false;
  }

  initInteraction() {
    const canvas = this.renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Interactive 3D home. Drag to orbit, scroll to zoom. Arrow keys rotate, plus and minus zoom, R resets the camera, F focuses selected furniture.');
    this.raycaster = new THREE.Raycaster();
    const pick = event => {
      const rect = canvas.getBoundingClientRect();
      this.raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), this.camera);
      return this.raycaster.intersectObjects([...this.furniture.getInteractiveObjects(), ...(this.occluders || [])], false)[0]?.object.userData.furnitureId;
    };
    this.onPointerDown = e => { this.pointerStart = { x: e.clientX, y: e.clientY }; };
    this.onPointerUp = e => {
      if (!this.pointerStart || Math.hypot(e.clientX - this.pointerStart.x, e.clientY - this.pointerStart.y) > 6 || e.button !== 0) return;
      this.selectFurniture(pick(e), true);
      this.pointerStart = null;
    };
    this.onPointerMove = e => { if (!e.buttons) canvas.style.cursor = pick(e) ? 'pointer' : 'grab'; };
    this.onKeyDown = e => {
      const key = e.key.toLowerCase();
      if (!['arrowleft', 'arrowright', 'arrowup', 'arrowdown', '+', '=', '-', 'r', 'f', 'escape'].includes(key)) return;
      e.preventDefault();
      if (key === 'r') return this.setCameraPreset('isometric');
      if (key === 'f') return this.focusSelected();
      if (key === 'escape') return this.selectFurniture(null, true);
      this.autoFrame = false; this.cameraTransition = null;
      const offset = this.camera.position.clone().sub(this.controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if (key === 'arrowleft') spherical.theta -= 0.12;
      if (key === 'arrowright') spherical.theta += 0.12;
      if (key === 'arrowup') spherical.phi = Math.max(0.08, spherical.phi - 0.1);
      if (key === 'arrowdown') spherical.phi = Math.min(this.controls.maxPolarAngle, spherical.phi + 0.1);
      if (key === '+' || key === '=') spherical.radius = Math.max(2, spherical.radius * 0.88);
      if (key === '-') spherical.radius = Math.min(800, spherical.radius * 1.12);
      this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      this.controls.update();
    };
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('keydown', this.onKeyDown);
  }

  initResize() {
    this.resizeObserver = new ResizeObserver(() => {
      const { clientWidth: width, clientHeight: height } = this.container;
      this.isVisible = width > 0 && height > 0;
      if (!this.isVisible) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      if (this.autoFrame) this.setCameraPreset(this.cameraPreset, this.reducedMotion);
    });
    this.resizeObserver.observe(this.container);
  }

  updateChatterProgress(chatter, milestone = false) {
    if (!chatter) return;
    const changed = this.chatterId !== chatter.username || this.currentTier !== chatter.tier?.id;
    const previousScale = this.currentHouseScale;
    this.chatterId = chatter.username;
    this.currentTier = chatter.tier?.id || 1;
    this.currentHouseScale = chatter.houseScale || chatter.tier?.baseScale || 1;
    this.house.setTier(this.currentTier, this.currentHouseScale);
    this.updateOccluders();
    this.furniture.setScales(chatter.furnitureScales, milestone && !this.reducedMotion);
    if (changed || (this.autoFrame && Math.abs(previousScale - this.currentHouseScale) > 0.01)) this.setCameraPreset(this.cameraPreset);
    if (milestone && !this.reducedMotion) this.celebration.explode({ x: 0, y: 4 * this.currentHouseScale, z: 0 }, 110);
  }

  animate(timestamp) {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.timer.update(timestamp);
    const delta = Math.min(this.timer.getDelta(), 0.05);
    if (document.hidden || !this.isVisible) return;
    const ease = this.reducedMotion ? 1 : 1 - Math.exp(-5 * delta);
    if (this.cameraTransition) {
      this.camera.position.lerp(this.cameraTransition.position, ease);
      this.controls.target.lerp(this.cameraTransition.target, ease);
      if (this.camera.position.distanceTo(this.cameraTransition.position) < 0.015) this.cameraTransition = null;
    }
    this.controls.update(delta);
    this.house.update(delta, this.reducedMotion);
    this.furniture.update(delta, this.house.currentScale, HOUSE_LAYOUTS[this.currentTier], this.reducedMotion);
    const lotScale = HOUSE_LAYOUTS[this.currentTier].width / 10 * this.house.currentScale;
    this.envGroup.scale.setScalar(lotScale);
    this.updateLighting(ease);
    this.celebration.update(delta);
    if (this.selectedItem) this.selectionBounds.setFromObject(this.selectedItem.group).expandByScalar(0.06);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId);
    this.resizeObserver?.disconnect();
    this.timer.dispose();
    this.motionQuery.removeEventListener('change', this.onMotionChange);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('keydown', this.onKeyDown);
    this.controls.removeEventListener('start', this.onOrbitStart);
    this.controls.dispose();
    // Materials hidden by X-ray still belong to the scene and must be released.
    this.house.setViewMode('exterior');
    disposeTree(this.scene);
    for (const material of Object.values(this.house.materials)) material.dispose();
    this.environmentMap.dispose();
    this.sunLight.shadow.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }
}
