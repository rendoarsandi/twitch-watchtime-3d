import React from 'react';
import { Clock3, ArrowUpRight, House, Plus, Sparkles } from 'lucide-react';
import { formatWatchTime } from './ChatterList.jsx';

const STAGES = [ ['Pod', '0m'], ['Cottage', '15m'], ['Residence', '1h'], ['Villa', '5h'], ['Citadel', '20h'] ];

export function TelemetryHUD({ chatter, onAddTime, gigantism }) {
  if (!chatter) return <div className="telemetry-empty"><House size={18} /><p>Select a viewer to see their watch time and home progression.</p></div>;
  const tier = chatter.tier || { id: 1, name: 'Starter Pod', minMinutes: 0, maxMinutes: 15 };
  const minutes = (chatter.watchSeconds || 0) / 60;
  const maxTier = !Number.isFinite(tier.maxMinutes) || tier.id === 5;
  const progress = maxTier ? 100 : Math.max(0, Math.min(100, (minutes - tier.minMinutes) / (tier.maxMinutes - tier.minMinutes) * 100));
  const remaining = maxTier ? 0 : Math.max(0, Math.ceil(tier.maxMinutes * 60 - chatter.watchSeconds));
  return <section className="telemetry-hud" aria-label="Home progression">
    <div className="home-progress-row">
      <div className="watchtime-total"><span><Clock3 size={12} />Total watch time</span><strong>{formatWatchTime(chatter.watchSeconds)}</strong></div>
      <div className="tier-progress-container">
        <div className="tier-progress-labels"><strong>{tier.name}</strong><span>{maxTier ? 'Highest tier unlocked' : <>{formatWatchTime(remaining)} to {STAGES[tier.id]?.[0]}<ArrowUpRight size={12} /></>}</span></div>
        <div className="progress-bar-bg" role="progressbar" aria-label="Progress to next home tier" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div className="progress-bar-fill" style={{ transform: `scaleX(${progress / 100})` }} /></div>
        <div className="tier-milestones">{STAGES.map(([label, time], i) => <span key={label} className={`${i + 1 <= tier.id ? 'unlocked' : ''} ${i + 1 === tier.id ? 'current' : ''}`} title={`${label} unlocks at ${time}`}><i />{label}</span>)}</div>
      </div>
    </div>
    <div className="growth-actions"><span className="growth-label"><Sparkles size={13} />{gigantism ? 'Gigantism enabled' : 'Watch it grow'}</span><div className="boost-buttons">{[[300, '5 min'], [1800, '30 min'], [7200, '2 hours'], [72000, '20 hours']].map(([seconds, label]) => <button key={seconds} onClick={() => onAddTime(chatter.username, seconds)} className={`btn-boost ${seconds === 72000 ? 'titan-boost' : ''}`}><Plus size={12} />{label}</button>)}</div><span className="house-scale">{(chatter.houseScale || 1).toFixed(2)}× house</span></div>
  </section>;
}
