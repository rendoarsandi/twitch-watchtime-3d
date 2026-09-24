import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar.jsx';
import { ChatterList } from './components/ChatterList.jsx';
import { TelemetryHUD } from './components/TelemetryHUD.jsx';
import { TwitchChatFeed } from './components/TwitchChatFeed.jsx';
import { ViewportControls } from './components/ViewportControls.jsx';
import { OBSOverlayView } from './components/OBSOverlayView.jsx';
import { ThreeCanvas } from './three/ThreeCanvas.jsx';
import { wsClient } from './services/websocket.js';
import { audioSynth } from './three/AudioSynth.js';
import * as api from './services/api.js';

export function App() {
  const [channel, setChannel] = useState('streamer');
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
      const status = await api.fetchStatus();
      setChannel(status.channel || 'streamer');
      setIsConnected(status.isConnected);
      setMultiplier(status.multiplier);
      setSimulationEnabled(status.simulationEnabled);
      setGigantism(status.gigantism);
      if (status.liveOnly !== undefined) setLiveOnly(status.liveOnly);
      if (status.streamInfo) setStreamInfo(status.streamInfo);

      const chatterList = await api.fetchChatters();
      setChatters(chatterList);
      if (chatterList.length > 0) {
        setSelectedChatter(chatterList[0]);
      }
    } catch (err) {
      console.warn('API fetch warning (waiting for WS):', err.message);
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
        setIsConnected(data.isConnected);
      } else if (type === 'INIT') {
        if (data.status) {
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
        setChatters((prev) => [data, ...prev]);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeMultiplier = async (newMult) => {
    try {
      await api.setMultiplier(newMult);
      setMultiplier(newMult);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSimulation = async () => {
    try {
      const next = !simulationEnabled;
      await api.setSimulation(next);
      setSimulationEnabled(next);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleGigantism = async () => {
    try {
      const next = !gigantism;
      await api.setGigantism(next);
      setGigantism(next);
      audioSynth.playGrowth();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLiveOnly = async () => {
    try {
      const next = !liveOnly;
      await api.setLiveOnly(next);
      setLiveOnly(next);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTime = async (username, seconds) => {
    try {
      const updated = await api.addTimeToChatter(username, seconds);
      audioSynth.playGrowth();
      setSelectedChatter(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (senderUser, text) => {
    try {
      await api.sendChatMessage(senderUser, senderUser, text);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all tracked watch time to starting baseline?')) {
      await api.resetAllData();
      await loadInitialData();
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

  return (
    <div className="app-root">
      {/* Top Application Bar */}
      <TopBar
        channel={channel}
        onChangeChannel={handleChangeChannel}
        isConnected={isConnected}
        multiplier={multiplier}
        onChangeMultiplier={handleChangeMultiplier}
        simulationEnabled={simulationEnabled}
        onToggleSimulation={handleToggleSimulation}
        gigantism={gigantism}
        onToggleGigantism={handleToggleGigantism}
        liveOnly={liveOnly}
        onToggleLiveOnly={handleToggleLiveOnly}
        streamInfo={streamInfo}
        onResetData={handleResetData}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onToggleOBSOverlay={() => setIsOBSMode(true)}
      />

      {/* Main Workspace: Left Roster, Center 3D Viewport, Right Chat */}
      <div className="workspace-body">
        {/* Left Chatter Leaderboard & Watch Time Roster */}
        <ChatterList
          chatters={chatters}
          selectedChatter={selectedChatter}
          onSelectChatter={(c) => setSelectedChatter(c)}
          onAddTime={handleAddTime}
        />

        {/* Center 3D Interactive Canvas & Floating HUDs */}
        <main className="canvas-wrapper">
          <ThreeCanvas
            selectedChatter={selectedChatter}
            viewMode={viewMode}
            lightingMode={lightingMode}
            cameraPreset={cameraPreset}
            onSelectFurniture={(item) => setSelectedFurniture(item)}
            lastMilestone={lastMilestone}
          />

          {/* Center-Bottom Telemetry HUD */}
          <TelemetryHUD
            chatter={selectedChatter}
            selectedFurniture={selectedFurniture}
            onAddTime={handleAddTime}
            gigantism={gigantism}
          />

          {/* Bottom-Right Viewport & Lighting Controls */}
          <ViewportControls
            cameraPreset={cameraPreset}
            onChangeCamera={(cam) => setCameraPreset(cam)}
            viewMode={viewMode}
            onChangeViewMode={(v) => setViewMode(v)}
            lightingMode={lightingMode}
            onChangeLightingMode={(l) => setLightingMode(l)}
          />
        </main>

        {/* Right Live Twitch IRC Chat & Level-Up Feed */}
        <TwitchChatFeed
          events={events}
          onSendMessage={handleSendMessage}
          channel={channel}
        />
      </div>
    </div>
  );
}
