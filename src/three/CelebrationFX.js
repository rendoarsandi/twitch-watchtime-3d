import * as THREE from 'three';

export class CelebrationFX {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 600;

    // Shared geometry and materials
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    const sizes = new Float32Array(this.maxParticles);

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Particle canvas texture
    const texture = this.createParticleTexture();

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geom, mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    this.particleData = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particleData.push({
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        r: 1,
        g: 1,
        b: 1,
        life: 0,
        maxLife: 1,
        size: 0.2
      });
    }
  }

  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 220, 100, 0.8)');
    grad.addColorStop(0.7, 'rgba(145, 70, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  explode(origin = { x: 0, y: 5, z: 0 }, count = 120) {
    const palette = [
      new THREE.Color('#9146FF'), // Twitch Purple
      new THREE.Color('#00FF7F'), // Electric Green
      new THREE.Color('#FFD700'), // Gold
      new THREE.Color('#00F5FF'), // Cyan
      new THREE.Color('#FF1493')  // Pink
    ];

    let spawned = 0;
    for (const p of this.particleData) {
      if (!p.active) {
        p.active = true;
        p.x = origin.x + (Math.random() - 0.5) * 0.8;
        p.y = origin.y + (Math.random() - 0.5) * 0.5;
        p.z = origin.z + (Math.random() - 0.5) * 0.8;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.5; // blast upwards
        const speed = 4 + Math.random() * 8;

        p.vx = Math.sin(phi) * Math.cos(theta) * speed;
        p.vy = Math.cos(phi) * speed + 2;
        p.vz = Math.sin(phi) * Math.sin(theta) * speed;

        const color = palette[Math.floor(Math.random() * palette.length)];
        p.r = color.r;
        p.g = color.g;
        p.b = color.b;

        p.life = 0;
        p.maxLife = 1.2 + Math.random() * 1.5;
        p.size = 0.25 + Math.random() * 0.35;

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  update(delta) {
    const posAttr = this.points.geometry.attributes.position;
    const colAttr = this.points.geometry.attributes.color;
    const sizeAttr = this.points.geometry.attributes.size;

    const gravity = -9.8;
    const drag = 0.96;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particleData[i];
      if (p.active) {
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.active = false;
          posAttr.setXYZ(i, 0, -1000, 0);
          continue;
        }

        p.vx *= drag;
        p.vy = (p.vy + gravity * delta) * drag;
        p.vz *= drag;

        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;

        const progress = p.life / p.maxLife;
        const alpha = Math.sin(progress * Math.PI);

        posAttr.setXYZ(i, p.x, p.y, p.z);
        colAttr.setXYZ(i, p.r * alpha, p.g * alpha, p.b * alpha);
        sizeAttr.setX(i, p.size * alpha);
      } else {
        posAttr.setXYZ(i, 0, -1000, 0);
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}
