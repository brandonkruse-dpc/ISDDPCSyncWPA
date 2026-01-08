
import React, { useState, useEffect, useRef } from 'react';
import { Peer, DataConnection } from 'peerjs';
import { TimerModel, SyncRole, SyncMessage } from './types';
import { MAX_TIMERS } from './constants';
import { generateId } from './utils/timeUtils';
import { TimerCard } from './components/TimerCard';
import { AddTimerModal } from './components/AddTimerModal';
import { generateTimerPresets } from './services/geminiService';

const App: React.FC = () => {
  const [timers, setTimers] = useState<TimerModel[]>([]);
  const [role, setRole] = useState<SyncRole>('standalone');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sessionId] = useState(() => generateId().toUpperCase());
  const [masterIdInput, setMasterIdInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);

  const isDark = theme === 'dark';

  // Persist theme
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initialize PeerJS
  useEffect(() => {
    const peer = new Peer(role === 'master' ? sessionId : undefined);
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('Peer connected with ID:', id);
    });

    peer.on('connection', (conn) => {
      if (role !== 'master') {
        conn.close();
        return;
      }
      connectionsRef.current.push(conn);
      
      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
      });
    });

    peer.on('error', (err) => {
      console.error('PeerJS Error:', err);
      setConnectionStatus('disconnected');
    });

    return () => {
      peer.destroy();
      connectionsRef.current = [];
    };
  }, [role, sessionId]);

  // Slave Connection Logic
  const connectToMaster = () => {
    if (!peerRef.current || !masterIdInput) return;
    setConnectionStatus('connecting');
    
    const conn = peerRef.current.connect(masterIdInput.toUpperCase());
    
    conn.on('open', () => {
      setConnectionStatus('connected');
      connectionsRef.current = [conn];
    });

    conn.on('data', (data) => {
      const msg = data as SyncMessage;
      if (msg.type === 'SYNC_UPDATE' && msg.payload.timers) {
        setTimers(msg.payload.timers);
      }
    });

    conn.on('close', () => {
      setConnectionStatus('disconnected');
      connectionsRef.current = [];
    });
    
    conn.on('error', () => {
      setConnectionStatus('disconnected');
      connectionsRef.current = [];
    });
  };

  // Sync Timer Ticks
  useEffect(() => {
    if (role === 'slave') return;

    const interval = setInterval(() => {
      setTimers(prev => {
        const next = prev.map(t => {
          if (t.status === 'running') {
            if (t.currentSeconds <= 1) {
              return { ...t, currentSeconds: 0, status: 'finished' as const };
            }
            return { ...t, currentSeconds: t.currentSeconds - 1 };
          }
          return t;
        });

        if (role === 'master' && connectionsRef.current.length > 0) {
          const syncMsg: SyncMessage = {
            type: 'SYNC_UPDATE',
            sourceId: sessionId,
            payload: {
              timers: next,
              timestamp: Date.now()
            }
          };
          connectionsRef.current.forEach(conn => {
            if (conn.open) {
              conn.send(syncMsg);
            }
          });
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [role, sessionId]);

  const handleAddTimer = (label: string, seconds: number) => {
    if (timers.length >= MAX_TIMERS) return;
    const newTimer: TimerModel = {
      id: generateId(),
      label,
      initialSeconds: seconds,
      currentSeconds: seconds,
      status: 'idle'
    };
    setTimers([...timers, newTimer]);
  };

  const handleAiPreset = async (prompt: string) => {
    const presets = await generateTimerPresets(prompt);
    if (presets.length > 0) {
      const newTimers = presets.slice(0, MAX_TIMERS).map((p: any) => ({
        id: generateId(),
        label: p.label,
        initialSeconds: p.durationSeconds,
        currentSeconds: p.durationSeconds,
        status: 'idle' as const
      }));
      setTimers(newTimers);
    }
  };

  const handleToggleTimer = (id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status === 'running') return { ...t, status: 'paused' };
        if (t.status === 'finished') return t;
        return { ...t, status: 'running' };
      }
      return t;
    }));
  };

  const handleResetTimer = (id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, currentSeconds: t.initialSeconds, status: 'idle' };
      }
      return t;
    }));
  };

  const handleDeleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const handleGlobalControl = (action: 'START' | 'PAUSE' | 'RESET') => {
    setTimers(prev => prev.map(t => {
      if (action === 'START' && t.status !== 'finished') return { ...t, status: 'running' as const };
      if (action === 'PAUSE' && t.status === 'running') return { ...t, status: 'paused' as const };
      if (action === 'RESET') return { ...t, currentSeconds: t.initialSeconds, status: 'idle' as const };
      return t;
    }));
  };

  const getGridClasses = () => {
    const count = timers.length;
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  };

  const isCompact = timers.length > 2;

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className={`flex flex-col h-screen overflow-hidden p-4 md:p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-6">
        <div className="text-center lg:text-left flex items-center gap-4">
          <div>
            <h1 className={`text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent uppercase tracking-tighter`}>
              ISD DPC Sync
            </h1>
            <div className="flex items-center justify-center lg:justify-start gap-2 mt-1">
               <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest border ${isDark ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-white text-cyan-600 border-slate-200 shadow-sm'}`}>
                 ID: {sessionId}
               </span>
               <span className={`text-[10px] font-bold uppercase tracking-widest ${role === 'master' ? 'text-amber-500' : role === 'slave' ? 'text-emerald-500' : 'text-slate-400'}`}>
                 {role}
               </span>
            </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className={`p-3 rounded-2xl transition-all shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </button>
        </div>

        {/* Sync Controls Panel */}
        <div className={`flex flex-col sm:flex-row items-center gap-4 p-3 rounded-3xl border backdrop-blur-sm ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
          <div className={`flex p-1 rounded-2xl border shadow-inner ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            {(['standalone', 'master', 'slave'] as const).map((r) => (
              <button 
                key={r}
                onClick={() => {
                  setRole(r);
                  setConnectionStatus('disconnected');
                  connectionsRef.current = [];
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${role === r ? (isDark ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'bg-white text-slate-900 shadow-md border border-slate-200') : 'text-slate-500 hover:text-slate-400'}`}
              >
                {r}
              </button>
            ))}
          </div>

          {role === 'slave' && (
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="MASTER ID" 
                value={masterIdInput}
                onChange={(e) => setMasterIdInput(e.target.value.toUpperCase())}
                className={`w-24 border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none transition-colors uppercase ${isDark ? 'bg-slate-950 border-slate-800 text-cyan-400 focus:border-cyan-500' : 'bg-white border-slate-200 text-cyan-600 focus:border-cyan-400'}`}
              />
              <button 
                onClick={connectToMaster}
                disabled={connectionStatus === 'connected' || !masterIdInput}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  connectionStatus === 'connected' ? 'bg-emerald-600 text-white cursor-default' : 
                  connectionStatus === 'connecting' ? 'bg-slate-700 text-slate-400' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20'
                }`}
              >
                {connectionStatus === 'connected' ? 'Linked' : connectionStatus === 'connecting' ? 'Linking...' : 'Connect'}
              </button>
            </div>
          )}

          {role === 'master' && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-amber-900/20 border-amber-900/30' : 'bg-amber-50 border-amber-200'}`}>
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
                {connectionsRef.current.length} Slaves Active
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 overflow-auto">
        {timers.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center space-y-6 ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
            <div className="relative">
              <svg className="w-32 h-32 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {role === 'slave' && connectionStatus !== 'connected' && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="text-[10px] font-bold uppercase tracking-tighter text-center leading-tight">Waiting for<br/>master link</div>
                </div>
              )}
            </div>
            
            {role !== 'slave' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className={`group relative px-8 py-4 font-black rounded-2xl border transition-all overflow-hidden ${isDark ? 'bg-slate-900 text-cyan-400 border-cyan-900/30 hover:border-cyan-500/50 hover:text-white' : 'bg-white text-cyan-600 border-cyan-100 shadow-md hover:border-cyan-400'}`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'bg-gradient-to-r from-cyan-600/10 to-blue-600/10' : 'bg-cyan-50'}`}></div>
                <span className="relative z-10 uppercase tracking-widest text-sm">Create New Timer</span>
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-4 md:gap-8 h-full items-stretch content-center ${getGridClasses()}`}>
            {timers.map(timer => (
              <TimerCard
                key={timer.id}
                timer={timer}
                onToggle={handleToggleTimer}
                onReset={handleResetTimer}
                onDelete={handleDeleteTimer}
                role={role}
                isCompact={isCompact}
                theme={theme}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          {timers.length} of {MAX_TIMERS} Timers Active
        </div>

        {role !== 'slave' && (
          <div className="flex items-center gap-4">
            <div className={`flex rounded-3xl p-1.5 border shadow-2xl backdrop-blur-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
              <button 
                onClick={() => handleGlobalControl('START')}
                className="p-4 text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all active:scale-90"
                title="Start All"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button 
                onClick={() => handleGlobalControl('PAUSE')}
                className="p-4 text-amber-500 hover:bg-amber-500/10 rounded-2xl transition-all active:scale-90"
                title="Pause All"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              </button>
              <button 
                onClick={() => handleGlobalControl('RESET')}
                className={`p-4 rounded-2xl transition-all active:scale-90 ${isDark ? 'text-slate-500 hover:bg-slate-700/50' : 'text-slate-400 hover:bg-slate-100'}`}
                title="Reset All"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>

            {timers.length < MAX_TIMERS && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-900/40 transform hover:scale-110 active:scale-95 transition-all border border-cyan-400/20"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              </button>
            )}
          </div>
        )}

        <div className={`text-[10px] font-bold uppercase tracking-[0.2em] hidden sm:block ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          {connectionStatus === 'connected' ? 'WiFi SYNC ACTIVE' : 'P2P STANDBY'}
        </div>
      </footer>

      {isAddModalOpen && (
        <AddTimerModal 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={handleAddTimer}
          onAiPreset={handleAiPreset}
        />
      )}
    </div>
  );
};

export default App;
