import React, { useEffect, useRef, useState } from 'react';
import { Box, RotateCcw } from 'lucide-react';

export function ThreeCanvas({ selectedChatter, viewMode, lightingMode, cameraPreset,
  onSelectFurniture, selectedFurnitureId, cameraAction, lastMilestone, isTransparent = false }) {
  const mountRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const selectRef = useRef(onSelectFurniture);
  selectRef.current = onSelectFurniture;
  const [status, setStatus] = useState('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let manager;
    let disposed = false;
    setStatus('loading');
    const mount = mountRef.current;
    const onLost = event => { event.preventDefault(); setStatus('lost'); };
    const onRestored = () => { if (!disposed) setStatus('ready'); };
    const initialize = async () => {
      try {
        const { SceneManager } = await import('./SceneManager.js');
        if (disposed) return;
        manager = new SceneManager(mount, item => selectRef.current?.(item), { isTransparent });
        sceneManagerRef.current = manager;
        manager.renderer.domElement.addEventListener('webglcontextlost', onLost);
        manager.renderer.domElement.addEventListener('webglcontextrestored', onRestored);
        setStatus('ready');
      } catch (error) {
        console.warn('3D view could not start:', error.message);
        if (!disposed) setStatus('error');
      }
    };
    initialize();
    return () => {
      disposed = true;
      if (manager) {
        manager.renderer.domElement.removeEventListener('webglcontextlost', onLost);
        manager.renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
        manager.dispose();
      }
      sceneManagerRef.current = null;
    };
  }, [retry]);

  useEffect(() => { sceneManagerRef.current?.setTransparent(isTransparent); }, [isTransparent, status]);
  useEffect(() => { sceneManagerRef.current?.updateChatterProgress(selectedChatter); }, [selectedChatter, status]);
  useEffect(() => {
    const owner = lastMilestone?.data?.chatter?.username || lastMilestone?.data?.username;
    if (lastMilestone && owner === selectedChatter?.username) sceneManagerRef.current?.updateChatterProgress(selectedChatter, true);
  }, [lastMilestone]);
  useEffect(() => { sceneManagerRef.current?.setViewMode(viewMode || 'cutaway'); }, [viewMode, status]);
  useEffect(() => { sceneManagerRef.current?.applyLightingMode(lightingMode || 'sunset'); }, [lightingMode, status]);
  useEffect(() => { sceneManagerRef.current?.setCameraPreset(cameraPreset || 'isometric'); }, [cameraPreset, status]);
  useEffect(() => { sceneManagerRef.current?.selectFurniture(selectedFurnitureId); }, [selectedFurnitureId, status]);
  useEffect(() => {
    if (cameraAction?.type === 'focus') sceneManagerRef.current?.focusSelected();
    if (cameraAction?.type === 'reset') sceneManagerRef.current?.setCameraPreset(cameraPreset || 'isometric');
  }, [cameraAction]);

  return (
    <div className={`three-view ${isTransparent ? 'transparent' : ''}`}>
      <div ref={mountRef} className="canvas-mount" />
      {status !== 'ready' && (
        <div className="scene-fallback" role="status">
          <Box size={30} strokeWidth={1.4} />
          <strong>{status === 'loading' ? 'Building your home…' : status === 'lost' ? 'Restoring the 3D view…' : 'The 3D view couldn’t start'}</strong>
          {status === 'error' && <><p>Enable hardware acceleration in your browser, then try again. Your watch time is still available.</p>
            <button className="btn-secondary" onClick={() => setRetry(n => n + 1)}><RotateCcw size={14} /> Retry 3D view</button></>}
        </div>
      )}
    </div>
  );
}
