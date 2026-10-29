import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar.jsx';
import { ChatterList } from './components/ChatterList.jsx';
import { TelemetryHUD } from './components/TelemetryHUD.jsx';
import { SceneInspector } from './components/SceneInspector.jsx';
import { Box, Users, MessageSquare, Maximize2, Minimize2, MousePointer2, X, AlertCircle, RotateCcw } from 'lucide-react';
import { ViewportControls } from './components/ViewportControls.jsx';
import { OBSOverlayView } from './components/OBSOverlayView.jsx';
import { ThreeCanvas } from './three/ThreeCanvas.jsx';
import { wsClient } from './services/websocket.js';
import { audioSynth } from './three/AudioSynth.js';
import * as api from './services/api.js';

export function App() {
  const [channel, setChannel] = useState('streamer');
  const [serverConnected, setServerConnected] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [inspectorTab, setInspectorTab] = useState('activity');
  const [mobilePanel, setMobilePanel] = useState('home');
  const [focusMode, setFocusMode] = useState(false);
  const [cameraAction, setCameraAction] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [gigantism, setGigantism] = useState(false);
  const [chatters, setChatters] = useState([]);
  const [selectedChatter, setSelectedChatter] = useState(null);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [events, setEvents] = useState([]);
  const [streamInfo, setStreamInfo] = useState(null);
  const [liveOnly, setLiveOnly] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(null);

  // 3D Viewport states
  const [cameraPreset, setCameraPreset] = useState('isometric');
  const [viewMode, setViewMode] = useState('cutaway');
  const [lightingMode, setLightingMode] = useState('sunset');

  // OBS Overlay Mode
  const [isOBSMode, setIsOBSMode] = useState(false);

  // Check URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('overlay') === '1' || params.get('obs') === '1') {
      setIsOBSMode(true);
    }
    const urlChannel = params.get('channel');
    if (urlChannel) {
      setChannel(urlChannel);
    }
  }, []);

  // Fetch initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [status, chatterList] = await Promise.all([api.fetchStatus(), api.fetchChatters()]);
      setChannel(status.channel || 'streamer');
      setIsConnected(status.isConnected);
      setMultiplier(status.multiplier);
      setSimulationEnabled(status.simulationEnabled);
      setGigantism(status.gigantism);
      if (status.liveOnly !== undefined) setLiveOnly(status.liveOnly);
      if (status.streamInfo) setStreamInfo(status.streamInfo);

      setChatters(chatterList);
      setSelectedChatter(prev => chatterList.find(c => c.username === prev?.username) || chatterList[0] || null);
    } catch (err) {
      setActionError('Couldn’t load watch time. Check that the tracker server is running, then retry.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Connect and handle WebSocket updates
  useEffect(() => {
    wsClient.connect();

    const unsubscribe = wsClient.subscribe((type, data) => {
      if (type === 'CONNECTION_CHANGE') {
        setServerConnected(data.isConnected);
      } else if (type === 'INIT') {
        setDataLoading(false);
        setActionError('');
        if (data.status) {
          setIsConnected(data.status.isConnected);
          setChannel(data.status.channel);
          setMultiplier(data.status.multiplier);
          setSimulationEnabled(data.status.simulationEnabled);
          setGigantism(data.status.gigantism);
          if (data.status.liveOnly !== undefined) setLiveOnly(data.status.liveOnly);
          if (data.status.streamInfo) setStreamInfo(data.status.streamInfo);
        }
        if (data.chatters) {
          setChatters(data.chatters);
          setSelectedChatter((prev) => {
            if (!prev && data.chatters.length > 0) return data.chatters[0];
            const found = data.chatters.find((c) => c.username === prev?.username);
            return found || data.chatters[0];
          });
        }
        if (data.events) {
          setEvents(data.events);
        }
      } else if (type === 'STATUS') {
        setChannel(data.channel);
        setIsConnected(data.isConnected);
        setMultiplier(data.multiplier);
        setSimulationEnabled(data.simulationEnabled);
        setGigantism(data.gigantism);
        if (data.liveOnly !== undefined) setLiveOnly(data.liveOnly);
        if (data.streamInfo) setStreamInfo(data.streamInfo);
      } else if (type === 'STREAM_STATUS') {
        setStreamInfo(data);
      } else if (type === 'WATCHTIME_TICK') {
        // Update batch of chatters
        setChatters((prev) => {
          const map = new Map(prev.map((c) => [c.username, c]));
          for (const updated of data.chatters) {
            map.set(updated.username, updated);
          }
          const list = Array.from(map.values());
          list.sort((a, b) => b.watchSeconds - a.watchSeconds);
          return list;
        });

        // Update active chatter if in updated batch
        setSelectedChatter((prev) => {
          if (!prev) return prev;
          const updated = data.chatters.find((c) => c.username === prev.username);
          return updated ? { ...updated } : prev;
        });
      } else if (type === 'CHATTER_UPDATE') {
        setChatters((prev) => {
          const idx = prev.findIndex((c) => c.username === data.username);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = data;
            copy.sort((a, b) => b.watchSeconds - a.watchSeconds);
            return copy;
          }
          return [data, ...prev];
        });

        setSelectedChatter((prev) => (prev?.username === data.username ? data : prev));
      } else if (type === 'NEW_CHATTER') {
        setChatters((prev) => [data, ...prev.filter(c => c.username !== data.username)]);
        setSelectedChatter(prev => prev || data);
      } else if (type === 'CHAT_MESSAGE') {
        setEvents((prev) => [data, ...prev.slice(0, 80)]);
        audioSynth.playClick();
      } else if (type === 'SPECIAL_EVENT') {
        setEvents((prev) => [data, ...prev.slice(0, 80)]);
        audioSynth.playGrowth();
        setLastMilestone({ timestamp: Date.now(), data });
      } else if (type === 'TIER_UP') {
        setLastMilestone({ timestamp: Date.now(), data });
        audioSynth.playTierUp();
        setEvents((prev) => [
          {
            id: `tu-${Date.now()}`,
            type: 'tier_up',
            username: data.chatter?.username,
            displayName: data.chatter?.displayName,
            newTier: data.newTier,
            timestamp: Date.now()
          },
          ...prev.slice(0, 80)
        ]);
      } else if (type === 'REFRESH_ALL') {
        setChatters(data);
        setSelectedChatter((prev) => {
          if (!prev && data.length > 0) return data[0];
          const found = data.find((c) => c.username === prev?.username);
          return found || data[0] || null;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handlers
  const handleChangeChannel = async (newChannel) => {
    try {
      await api.setTrackedChannel(newChannel);
      setChannel(newChannel);
      setSelectedFurniture(null);
      setActionError('');
    } catch (err) {
      setActionError('Couldn’t change the channel. Check the tracker connection and try again.');
      throw err;
    }
  };

  const handleChangeMultiplier = async (newMult) => {
    try {
      await api.setMultiplier(newMult);
      setMultiplier(newMult);
    } catch (err) {
      setActionError('Couldn’t change watch speed. Check the tracker connection and try again.');
    }
  };

  const handleToggleSimulation = async () => {
    try {
      const next = !simulationEnabled;
      await api.setSimulation(next);
      setSimulationEnabled(next);
    } catch (err) {
      setActionError('Couldn’t toggle demo traffic. Check the tracker connection and try again.');
    }
  };

  const handleToggleGigantism = async () => {
    try {
      const next = !gigantism;
      await api.setGigantism(next);
      setGigantism(next);
      audioSynth.playGrowth();
    } catch (err) {
      setActionError('Couldn’t toggle gigantism. Check the tracker connection and try again.');
    }
  };

  const handleToggleLiveOnly = async () => {
    try {
      const next = !liveOnly;
      await api.setLiveOnly(next);
      setLiveOnly(next);
    } catch (err) {
      setActionError('Couldn’t change live-only tracking. Check the tracker connection and try again.');
    }
  };

  const handleAddTime = async (username, seconds) => {
    try {
      const updated = await api.addTimeToChatter(username, seconds);
      audioSynth.playGrowth();
      setSelectedChatter(updated);
    } catch (err) {
      setActionError('Couldn’t add watch time. Check the tracker connection and try again.');
    }
  };

  const handleSendMessage = async (senderUser, text) => {
    try {
      await api.sendChatMessage(senderUser, senderUser, text);
      return true;
    } catch (err) {
      setActionError('Couldn’t send the simulated message. Check the tracker connection and try again.');
      return false;
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all tracked watch time to starting baseline?')) {
      try { await api.resetAllData(); await loadInitialData(); }
      catch { setActionError('Couldn’t reset watch time. Check the tracker connection and try again.'); }
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioSynth.setMuted(next);
  };

  // If in OBS Overlay mode, render streamlined transparent view
  if (isOBSMode) {
    return (
      <OBSOverlayView
        selectedChatter={selectedChatter}
        channel={channel}
        onExitOverlay={() => setIsOBSMode(false)}
        lastMilestone={lastMilestone}
      />
    );
  }

  const selectFurniture = item => {
    setSelectedFurniture(item);
    if (item) setInspectorTab('objects');
  };
  const focusFurniture = () => { setMobilePanel('home'); setCameraAction({ type: 'focus', timestamp: Date.now() }); };
  const resetCamera = () => setCameraAction({ type: 'reset', timestamp: Date.now() });

  return (
    <div className="app-root">
      <TopBar channel={channel} onChangeChannel={handleChangeChannel} isConnected={isConnected}
        serverConnected={serverConnected} multiplier={multiplier} onChangeMultiplier={handleChangeMultiplier}
        simulationEnabled={simulationEnabled} onToggleSimulation={handleToggleSimulation}
        gigantism={gigantism} onToggleGigantism={handleToggleGigantism} liveOnly={liveOnly}
        onToggleLiveOnly={handleToggleLiveOnly} streamInfo={streamInfo} onResetData={handleResetData}
        isMuted={isMuted} onToggleMute={handleToggleMute} onToggleOBSOverlay={() => setIsOBSMode(true)} />
      {actionError && <div className="app-notice" role="alert"><AlertCircle size={16} /><span>{actionError}</span><button onClick={() => { setActionError(''); loadInitialData(); }}><RotateCcw size={13} />Retry</button><button onClick={() => setActionError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
      <nav className="mobile-navigation" aria-label="Workspace panels">
        {[[ 'community', 'Community', Users ], [ 'home', '3D home', Box ], [ 'activity', 'Activity & objects', MessageSquare ]].map(([id, label, Icon]) => <button key={id} className={mobilePanel === id ? 'active' : ''} onClick={() => setMobilePanel(id)} aria-pressed={mobilePanel === id}><Icon size={15} />{label}</button>)}
      </nav>
      <div className={`workspace-body ${focusMode ? 'focus-mode' : ''}`} data-panel={mobilePanel}>
        <ChatterList chatters={chatters} selectedChatter={selectedChatter} loading={dataLoading}
          onSelectChatter={chatter => { setSelectedChatter(chatter); setSelectedFurniture(null); setMobilePanel('home'); }} onAddTime={handleAddTime} />
        <main className="canvas-wrapper" aria-label="3D home workspace">
          <div className="scene-heading"><div><h1>{selectedChatter ? `${selectedChatter.displayName || selectedChatter.username}’s place` : 'Your community, built in 3D'}</h1><p>{selectedChatter?.tier?.description || 'Watch time becomes a home. Select a viewer to explore.'}</p></div><div className="scene-heading-actions">{selectedChatter && <span className="scene-tier">Tier {selectedChatter.tier?.id || 1}<span> / 5</span></span>}<button className="icon-action-btn focus-mode-button" onClick={() => setFocusMode(!focusMode)} aria-pressed={focusMode} aria-label={focusMode ? 'Show side panels' : 'Expand 3D workspace'} title={focusMode ? 'Show side panels' : 'Expand workspace'}>{focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div></div>
          <ViewportControls cameraPreset={cameraPreset} onChangeCamera={setCameraPreset} viewMode={viewMode} onChangeViewMode={setViewMode} lightingMode={lightingMode} onChangeLightingMode={setLightingMode} onResetCamera={resetCamera} onFocusFurniture={focusFurniture} hasSelection={Boolean(selectedFurniture)} />
          <div className="scene-stage">
            <ThreeCanvas selectedChatter={selectedChatter} viewMode={viewMode} lightingMode={lightingMode}
              cameraPreset={cameraPreset} onSelectFurniture={selectFurniture} selectedFurnitureId={selectedFurniture?.id}
              cameraAction={cameraAction} lastMilestone={lastMilestone} />
            <div className="scene-guide"><MousePointer2 size={12} /><span>Drag to orbit<span className="guide-desktop"> · Scroll to zoom · Click an object to inspect</span></span></div>
            <span className="scene-atmosphere"><span className={`atmosphere-dot ${lightingMode}`} />{lightingMode === 'sunset' ? 'Golden hour' : lightingMode === 'day' ? 'Daylight studio' : 'After hours'}</span>
          </div>
          <TelemetryHUD chatter={selectedChatter} onAddTime={handleAddTime} gigantism={gigantism} />
        </main>
        <SceneInspector tab={inspectorTab} onChangeTab={setInspectorTab} chatter={selectedChatter}
          selectedFurniture={selectedFurniture} onSelectFurniture={selectFurniture} onFocusFurniture={focusFurniture}
          events={events} onSendMessage={handleSendMessage} channel={channel} simulationEnabled={simulationEnabled} />
      </div>
    </div>
  );
}
