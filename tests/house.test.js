import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { HouseBuilder } from '../src/three/HouseBuilder.js';
import { disposeTree } from '../src/three/materials.js';

test('switching X-ray and cutaway back to exterior preserves the appearance of every home tier', () => {
  // Only texture painting needs a browser. All geometry and materials are real Three.js objects.
  const originalDocument = globalThis.document;
  const context = { fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} };
  globalThis.document = { createElement: () => ({ getContext: () => context }) };
  const scene = new THREE.Scene();
  try {
    const house = new HouseBuilder(scene);
    for (const tier of [1, 2, 3, 4, 5]) {
      house.setTier(tier);
      house.setViewMode('exterior');
      const appearance = [];
      scene.traverse(object => {
        if (object.isMesh) appearance.push({ object, material: object.material, opacity: object.material.opacity, transparent: object.material.transparent, visible: object.visible });
      });
      house.setViewMode('xray');
      house.setViewMode('cutaway');
      house.setViewMode('exterior');
      for (const { object, material, opacity, transparent, visible } of appearance) {
        assert.equal(object.material, material, `Tier ${tier}: original surface material must be restored`);
        assert.equal(object.material.opacity, opacity, `Tier ${tier}: glass opacity must survive view changes`);
        assert.equal(object.material.transparent, transparent, `Tier ${tier}: glass transparency must survive view changes`);
        assert.equal(object.visible, visible, `Tier ${tier}: exterior geometry must become visible again`);
      }
    }
  } finally {
    disposeTree(scene);
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
