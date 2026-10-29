import * as THREE from 'three';

// Small, deterministic textures keep the scene self-contained and crisp at every tier.
export function surfaceTexture(kind, color, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  let seed = 17;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  if (kind === 'wood') {
    for (let plank = 0; plank < 8; plank++) {
      ctx.fillStyle = `rgba(255,230,195,${random() * 0.09})`;
      ctx.fillRect(0, plank * 32, 256, 31);
      ctx.fillStyle = accent;
      ctx.fillRect(0, plank * 32, 256, 1);
      for (let grain = 0; grain < 14; grain++) {
        ctx.fillStyle = `rgba(45,24,12,${random() * 0.1})`;
        ctx.fillRect(random() * 256, plank * 32 + random() * 31, 25 + random() * 100, 0.5);
      }
    }
  } else if (kind === 'tile') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
    }
  } else if (kind === 'roof') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let y = 0; y <= 256; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
      for (let x = (y % 64 === 0 ? 0 : 32); x <= 256; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 32); ctx.stroke();
      }
    }
  }
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = `rgba(${i % 2 ? '255,255,255' : '0,0,0'},${random() * 0.045})`;
    ctx.fillRect(random() * 256, random() * 256, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function disposeTree(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value);
      }
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
}
