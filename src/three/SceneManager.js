import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HouseBuilder } from './HouseBuilder.js';
import { FurnitureManager } from './FurnitureManager.js';
import { CelebrationFX } from './CelebrationFX.js';

export class SceneManager {
  constructor(canvasContainer, onSelectFurniture, options = {}) {
    this.container = canvasContainer;
    this.onSelectFurniture = onSelectFurniture;
    this.isTransparent = Boolean(options.isTransparent);
    this.currentHouseScale = 1.0;

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.isCinematic = false;
    this.lightingMode = 'sunset'; // 'day' | 'sunset' | 'night'

    this.initRenderer();
    this.initCamera();
    this.initControls();
    this.initLights();
    this.initEnvironment();

    this.house = new HouseBuilder(this.scene);
    this.furniture = new FurnitureManager(this.scene);
    this.celebration = new CelebrationFX(this.scene);

    this.initRaycaster();
    this.initResize();

    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);
  }

  initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
    this.camera.position.set(16, 14, 18);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going below ground
    this.controls.minDistance = 3;
    this.controls.maxDistance = 60;
    this.controls.target.set(0, 2.5, 0);
  }

  initLights() {
    this.lightsGroup = new THREE.Group();
    this.scene.add(this.lightsGroup);

    // Hemisphere light for soft ambient fill
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    this.lightsGroup.add(this.hemiLight);

    // Main Directional Sun Light with shadows
    this.sunLight = new THREE.DirectionalLight(0xfff3e0, 2.0);
    this.sunLight.position.set(22, 35, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 80;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.sunLight.shadow.bias = -0.0005;
    this.lightsGroup.add(this.sunLight);

    // Interior Warm Fill Light
    this.interiorLight = new THREE.PointLight(0xffaa55, 1.5, 25, 1.2);
    this.interiorLight.position.set(0, 4, 0);
    this.lightsGroup.add(this.interiorLight);

    // Neon Accent Light (Twitch Purple)
    this.neonLight = new THREE.PointLight(0x9146ff, 1.8, 20, 1.5);
    this.neonLight.position.set(3, 2, -1);
    this.lightsGroup.add(this.neonLight);

    this.applyLightingMode(this.lightingMode);
  }

  setTransparent(enabled) {
    this.isTransparent = Boolean(enabled);
    this.applyLightingMode(this.lightingMode);
  }

  applyLightingMode(mode) {
    this.lightingMode = mode;
    if (this.isTransparent) {
      this.renderer.setClearColor(0x000000, 0);
      this.scene.background = null;
      this.scene.fog = null;
      if (this.envGroup) this.envGroup.visible = false;
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.intensity = 1.0;
      this.sunLight.color.setHex(0xffffff);
      this.sunLight.intensity = 2.4;
      this.sunLight.position.set(20, 35, 20);
      this.interiorLight.intensity = 1.5;
      this.neonLight.intensity = 1.8;
      return;
    }

    if (this.envGroup) this.envGroup.visible = true;

    if (mode === 'day') {
      this.scene.background = new THREE.Color(0xdff0fc);
      this.scene.fog = new THREE.FogExp2(0xdff0fc, 0.012);
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x556677);
      this.hemiLight.intensity = 0.9;
      this.sunLight.color.setHex(0xffffff);
      this.sunLight.intensity = 2.2;
      this.sunLight.position.set(20, 35, 20);
      this.interiorLight.intensity = 0.6;
      this.neonLight.intensity = 0.8;
    } else if (mode === 'sunset') {
      this.scene.background = new THREE.Color(0x1a0f28);
      this.scene.fog = new THREE.FogExp2(0x1a0f28, 0.015);
      this.hemiLight.color.setHex(0xffaa77);
      this.hemiLight.groundColor.setHex(0x221133);
      this.hemiLight.intensity = 0.7;
      this.sunLight.color.setHex(0xff7733);
      this.sunLight.intensity = 2.4;
      this.sunLight.position.set(30, 15, 15);
      this.interiorLight.intensity = 1.8;
      this.neonLight.intensity = 2.0;
    } else if (mode === 'night') {
      this.scene.background = new THREE.Color(0x0a0612);
      this.scene.fog = new THREE.FogExp2(0x0a0612, 0.018);
      this.hemiLight.color.setHex(0x332266);
      this.hemiLight.groundColor.setHex(0x05020a);
      this.hemiLight.intensity = 0.4;
      this.sunLight.color.setHex(0x4466aa);
      this.sunLight.intensity = 0.5;
      this.sunLight.position.set(-15, 25, -15);
      this.interiorLight.intensity = 2.6;
      this.neonLight.intensity = 3.2;
    }
  }

  initEnvironment() {
    this.envGroup = new THREE.Group();
    this.scene.add(this.envGroup);

    // Large floating cyber-architectural grass island / plaza
    const plazaGeom = new THREE.CylinderGeometry(24, 25, 1.2, 48);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x1f242e,
      roughness: 0.8,
      metalness: 0.2
    });
    const plaza = new THREE.Mesh(plazaGeom, plazaMat);
    plaza.position.y = -0.6;
    plaza.receiveShadow = true;
    this.envGroup.add(plaza);

    // Grass lawn / inner island
    const lawnGeom = new THREE.CylinderGeometry(22, 22, 0.15, 48);
    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x183020,
      roughness: 0.9,
      metalness: 0.05
    });
    const lawn = new THREE.Mesh(lawnGeom, lawnMat);
    lawn.position.y = 0.05;
    lawn.receiveShadow = true;
    this.envGroup.add(lawn);

    // Stone pathway in front
    const pathGeom = new THREE.BoxGeometry(3.2, 0.08, 14);
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x3d4450, roughness: 0.7 });
    const path = new THREE.Mesh(pathGeom, pathMat);
    path.position.set(0, 0.15, 10);
    this.envGroup.add(path);

    // Decorative perimeter trees & lampposts
    const treeCount = 8;
    const radius = 18;
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      // Skip path entrance
      if (Math.abs(angle - Math.PI / 2) < 0.4) continue;

      const tree = this.createTree();
      tree.position.set(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius);
      this.envGroup.add(tree);
    }
  }

  createTree() {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.28, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.9 })
    );
    trunk.position.y = 1.2;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.7 });
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 8), foliageMat);
    cone1.position.y = 2.8;
    cone1.castShadow = true;
    tree.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 8), foliageMat);
    cone2.position.y = 3.8;
    cone2.castShadow = true;
    tree.add(cone2);

    return tree;
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    const onPointerDown = (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const interactives = this.furniture.getInteractiveObjects();
      const intersects = this.raycaster.intersectObjects(interactives);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const furnitureId = hit.object.userData.furnitureId;
        if (furnitureId && this.onSelectFurniture) {
          const item = this.furniture.getItemById(furnitureId);
          this.onSelectFurniture(item);
        }
      }
    };

    this.renderer.domElement.addEventListener('pointerdown', onPointerDown);
  }

  initResize() {
    this.onResize = () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.onResize);
  }

  setCameraPreset(preset) {
    if (preset === 'isometric') {
      this.isCinematic = false;
      this.camera.position.set(16, 14, 18);
      this.controls.target.set(0, 2.5, 0);
    } else if (preset === 'dollhouse') {
      this.isCinematic = false;
      this.camera.position.set(0, 6.5, 17);
      this.controls.target.set(0, 2.2, 0);
    } else if (preset === 'topdown') {
      this.isCinematic = false;
      this.camera.position.set(0, 28, 0.1);
      this.controls.target.set(0, 0, 0);
    } else if (preset === 'studio') {
      this.isCinematic = false;
      this.camera.position.set(6, 4.5, 4);
      this.controls.target.set(1.5, 1.5, 0);
    } else if (preset === 'cinematic') {
      this.isCinematic = true;
    }
    this.controls.update();
  }

  setViewMode(mode) {
    this.house.setViewMode(mode);
  }

  triggerCelebration(origin) {
    const pos = origin || { x: 0, y: 8, z: 0 };
    this.celebration.explode(pos, 140);
  }

  updateChatterProgress(chatter, isMilestone = false) {
    if (!chatter) return;

    // Update house tier and continuous scaling
    const tierId = chatter.tier?.id || 1;
    const houseScale = chatter.houseScale || chatter.tier?.baseScale || 1.0;
    this.currentHouseScale = houseScale;
    this.house.setTier(tierId, houseScale);

    // Update furniture scales
    this.furniture.setScales(chatter.furnitureScales, isMilestone);

    if (isMilestone) {
      this.triggerCelebration({ x: 0, y: 6 + tierId * 1.5, z: 0 });
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.isCinematic) {
      const angle = delta * 0.25;
      this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      this.controls.target.set(0, 2.5, 0);
    }

    this.controls.update();
    this.house.update(delta);
    this.furniture.update(delta, this.currentHouseScale || 1.0);
    this.celebration.update(delta);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.celebration.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
