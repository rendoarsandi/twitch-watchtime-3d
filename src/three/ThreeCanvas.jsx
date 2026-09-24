import React, { useEffect, useRef } from 'react';
import { SceneManager } from './SceneManager.js';

export function ThreeCanvas({
  selectedChatter,
  viewMode,
  lightingMode,
  cameraPreset,
  onSelectFurniture,
  lastMilestone,
  isTransparent = false
}) {
  const mountRef = useRef(null);
  const sceneManagerRef = useRef(null);

  // Initialize 3D scene on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const sm = new SceneManager(
      mountRef.current,
      (furnitureItem) => {
        if (onSelectFurniture) {
          onSelectFurniture(furnitureItem);
        }
      },
      { isTransparent }
    );
    sceneManagerRef.current = sm;

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Update transparency mode
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setTransparent(isTransparent);
    }
  }, [isTransparent]);

  // Update chatter watch time, house scale & furniture scales
  useEffect(() => {
    if (sceneManagerRef.current && selectedChatter) {
      sceneManagerRef.current.updateChatterProgress(selectedChatter, false);
    }
  }, [
    selectedChatter?.watchSeconds,
    selectedChatter?.houseScale,
    selectedChatter?.tier?.id,
    selectedChatter?.furnitureScales
  ]);

  // Handle milestone explosions & furniture bounce
  useEffect(() => {
    if (sceneManagerRef.current && lastMilestone) {
      sceneManagerRef.current.updateChatterProgress(selectedChatter, true);
    }
  }, [lastMilestone]);

  // Update view mode (cutaway vs exterior vs xray)
  useEffect(() => {
    if (sceneManagerRef.current && viewMode) {
      sceneManagerRef.current.setViewMode(viewMode);
    }
  }, [viewMode]);

  // Update lighting mode (day vs sunset vs night)
  useEffect(() => {
    if (sceneManagerRef.current && lightingMode) {
      sceneManagerRef.current.applyLightingMode(lightingMode);
    }
  }, [lightingMode]);

  // Update camera preset
  useEffect(() => {
    if (sceneManagerRef.current && cameraPreset) {
      sceneManagerRef.current.setCameraPreset(cameraPreset);
    }
  }, [cameraPreset]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        outline: 'none'
      }}
    />
  );
}
