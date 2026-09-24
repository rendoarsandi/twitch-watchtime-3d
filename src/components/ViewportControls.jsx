import React from 'react';
import { Camera, Sun, Moon, Sunset, Eye, Box, Compass } from 'lucide-react';

export function ViewportControls({
  cameraPreset,
  onChangeCamera,
  viewMode,
  onChangeViewMode,
  lightingMode,
  onChangeLightingMode
}) {
  const cameraPresets = [
    { id: 'isometric', label: 'Iso 3D' },
    { id: 'dollhouse', label: 'Dollhouse' },
    { id: 'topdown', label: 'Top-Down' },
    { id: 'studio', label: 'Interior' },
    { id: 'cinematic', label: 'Auto Orbit' }
  ];

  const viewModes = [
    { id: 'cutaway', label: 'Cutaway', icon: '✂️' },
    { id: 'exterior', label: 'Exterior', icon: '🏠' },
    { id: 'xray', label: 'X-Ray', icon: '💎' }
  ];

  const lightingModes = [
    { id: 'day', label: 'Day', icon: <Sun size={13} /> },
    { id: 'sunset', label: 'Sunset', icon: <Sunset size={13} /> },
    { id: 'night', label: 'Cyber Night', icon: <Moon size={13} /> }
  ];

  return (
    <div className="viewport-controls-cluster">
      {/* Camera Angle Selector */}
      <div className="control-group">
        <div className="control-header">
          <Camera size={12} />
          <span>CAMERA</span>
        </div>
        <div className="btn-segmented">
          {cameraPresets.map((cam) => (
            <button
              key={cam.id}
              onClick={() => onChangeCamera(cam.id)}
              className={`seg-btn ${cameraPreset === cam.id ? 'active' : ''}`}
            >
              {cam.label}
            </button>
          ))}
        </div>
      </div>

      {/* House Architecture View Mode */}
      <div className="control-group">
        <div className="control-header">
          <Eye size={12} />
          <span>HOUSE VIEW</span>
        </div>
        <div className="btn-segmented">
          {viewModes.map((v) => (
            <button
              key={v.id}
              onClick={() => onChangeViewMode(v.id)}
              className={`seg-btn ${viewMode === v.id ? 'active' : ''}`}
            >
              <span>{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lighting / Environment Atmosphere */}
      <div className="control-group">
        <div className="control-header">
          <Sun size={12} />
          <span>LIGHTING</span>
        </div>
        <div className="btn-segmented">
          {lightingModes.map((light) => (
            <button
              key={light.id}
              onClick={() => onChangeLightingMode(light.id)}
              className={`seg-btn ${lightingMode === light.id ? 'active' : ''}`}
            >
              {light.icon}
              <span>{light.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
