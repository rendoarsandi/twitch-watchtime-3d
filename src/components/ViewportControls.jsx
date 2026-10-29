import React from 'react';
import { Camera, Sun, Moon, Sunset, ScanLine, House, PanelsTopLeft, RotateCcw, Focus } from 'lucide-react';

export function ViewportControls({ cameraPreset, onChangeCamera, viewMode, onChangeViewMode, lightingMode, onChangeLightingMode, onResetCamera, onFocusFurniture, hasSelection }) {
  return <div className="viewport-toolbar">
    <div className="view-segments" role="group" aria-label="House view">
      {[['cutaway', 'Cutaway', PanelsTopLeft], ['exterior', 'Exterior', House], ['xray', 'X-ray', ScanLine]].map(([id, label, Icon]) => <button key={id} className={`seg-btn ${viewMode === id ? 'active' : ''}`} onClick={() => onChangeViewMode(id)} aria-pressed={viewMode === id} title={label}><Icon size={14} /><span>{label}</span></button>)}
    </div>
    <span className="toolbar-divider" />
    <label className="camera-select"><Camera size={14} /><select aria-label="Camera angle" value={cameraPreset} onChange={e => onChangeCamera(e.target.value)}><option value="isometric">Isometric</option><option value="dollhouse">Dollhouse</option><option value="topdown">Floor plan</option><option value="studio">Interior</option><option value="cinematic">Auto orbit</option></select></label>
    <div className="lighting-segments" role="group" aria-label="Lighting">
      {[['day', 'Daylight', Sun], ['sunset', 'Golden hour', Sunset], ['night', 'Night', Moon]].map(([id, label, Icon]) => <button key={id} className={`icon-action-btn ${lightingMode === id ? 'active' : ''}`} onClick={() => onChangeLightingMode(id)} aria-pressed={lightingMode === id} aria-label={label} title={label}><Icon size={16} /></button>)}
    </div>
    <div className="camera-actions"><button onClick={onFocusFurniture} className="icon-action-btn" disabled={!hasSelection} aria-label="Focus selected furniture" title="Focus selected object (F)"><Focus size={16} /></button><button onClick={onResetCamera} className="icon-action-btn" aria-label="Reset camera" title="Fit home in view (R)"><RotateCcw size={15} /></button></div>
  </div>;
}
