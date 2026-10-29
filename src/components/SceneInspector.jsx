import React from 'react';
import { Sofa, Monitor, Gamepad2, BedDouble, Refrigerator, Trophy, LampCeiling, Sprout, Focus, X, MessageSquare, Box } from 'lucide-react';
import { TwitchChatFeed } from './TwitchChatFeed.jsx';

export const FURNITURE = [
  { id: 'couch', name: 'Sectional sofa', category: 'Living room', icon: Sofa },
  { id: 'tv', name: 'Home cinema', category: 'Living room', icon: Monitor },
  { id: 'battlestation', name: 'Battlestation', category: 'Studio', icon: Gamepad2 },
  { id: 'bed', name: 'Canopy bed', category: 'Bedroom', icon: BedDouble },
  { id: 'fridge', name: 'Smart refrigerator', category: 'Kitchen', icon: Refrigerator },
  { id: 'bookshelf', name: 'Trophy archive', category: 'Gallery', icon: Trophy },
  { id: 'lamp', name: 'Gyro chandelier', category: 'Lighting', icon: LampCeiling },
  { id: 'plant', name: 'Mega bonsai', category: 'Living room', icon: Sprout }
];

export function SceneInspector({ tab, onChangeTab, chatter, selectedFurniture, onSelectFurniture, onFocusFurniture, events, onSendMessage, channel, simulationEnabled }) {
  const selected = FURNITURE.find(item => item.id === selectedFurniture?.id);
  const scales = chatter?.furnitureScales || {};
  return <aside className="workspace-inspector" aria-label="Home inspector and activity">
    <div className="inspector-tabs" role="tablist" aria-label="Inspector" onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'activity' : event.key === 'End' ? 'objects' : tab === 'activity' ? 'objects' : 'activity';
      onChangeTab(next);
      event.currentTarget.querySelector(`#${next}-tab`)?.focus();
    }}>
      <button role="tab" tabIndex={tab === 'activity' ? 0 : -1} id="activity-tab" aria-controls="activity-panel" aria-selected={tab === 'activity'} onClick={() => onChangeTab('activity')}><MessageSquare size={14} />Activity{events.length > 0 && <span className="activity-pip" />}</button>
      <button role="tab" tabIndex={tab === 'objects' ? 0 : -1} id="objects-tab" aria-controls="objects-panel" aria-selected={tab === 'objects'} onClick={() => onChangeTab('objects')}><Box size={14} />Objects<span className="count-badge">8</span></button>
    </div>
    {tab === 'activity' ? <div className="inspector-content" role="tabpanel" id="activity-panel" aria-labelledby="activity-tab"><TwitchChatFeed events={events} onSendMessage={onSendMessage} channel={channel} simulationEnabled={simulationEnabled} /></div> : <div className="objects-panel" role="tabpanel" id="objects-panel" aria-labelledby="objects-tab">
      <div className="objects-heading"><h2>Inside the home</h2><p>Choose an object to find it in 3D.</p></div>
      <div className="object-list">{FURNITURE.map(({ id, name, category, icon: Icon }) => <button key={id} className={`object-row ${selected?.id === id ? 'selected' : ''}`} onClick={() => onSelectFurniture(selected?.id === id ? null : { id, name, category })} aria-pressed={selected?.id === id}><span className="object-icon"><Icon size={19} strokeWidth={1.5} /></span><span><strong>{name}</strong><small>{category}</small></span><span className="object-scale">{Number(scales[id] || 1).toFixed(2)}<small>×</small></span></button>)}</div>
      {selected ? <div className="object-detail"><div><span className="selection-label">Selected object</span><button className="icon-action-btn" onClick={() => onSelectFurniture(null)} aria-label="Clear object selection"><X size={14} /></button></div><h3>{selected.name}</h3><p>{Number(scales[selected.id] || 1).toFixed(2)}× watch-time growth</p><button className="btn-secondary" onClick={onFocusFurniture}><Focus size={14} />Focus in scene</button></div> : <p className="object-hint">You can also select furniture directly in the scene. Press <kbd>F</kbd> to take a closer look.</p>}
      <div className="objects-footer"><SparkleMark /><span>Furniture adapts to the space as your home grows.</span></div>
    </div>}
  </aside>;
}
function SparkleMark() { return <Box size={16} strokeWidth={1.5} />; }
