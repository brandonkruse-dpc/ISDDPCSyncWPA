
import React from 'react';
import { TimerModel, SyncRole } from '../types';
import { formatTime } from '../utils/timeUtils';

interface TimerCardProps {
  timer: TimerModel;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  role: SyncRole;
  isCompact: boolean;
  theme: 'light' | 'dark';
}

export const TimerCard: React.FC<TimerCardProps> = ({ 
  timer, 
  onToggle, 
  onReset, 
  onDelete, 
  role,
  isCompact,
  theme
}) => {
  const isSlave = role === 'slave';
  const isFinished = timer.status === 'finished';
  const isRunning = timer.status === 'running';
  const isDark = theme === 'dark';

  return (
    <div className={`
      relative group flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-300
      ${isFinished 
        ? (isDark ? 'bg-red-900/40 border-2 border-red-500 animate-pulse' : 'bg-red-50 border-2 border-red-500 animate-pulse')
        : (isDark ? 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800/80 hover:border-slate-500' : 'bg-white border border-slate-200 shadow-sm hover:border-slate-400')
      }
    `}>
      {/* Label */}
      <h3 className={`font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} ${isCompact ? 'text-xs' : 'text-sm'}`}>
        {timer.label}
      </h3>

      {/* Main Time Display */}
      <div className={`
        font-mono font-black transition-all tabular-nums
        ${isDark ? 'text-white' : 'text-slate-900'}
        ${isCompact ? 'text-4xl md:text-5xl lg:text-7xl' : 'text-6xl md:text-8xl lg:text-9xl'}
      `}>
        {formatTime(timer.currentSeconds)}
      </div>

      {/* Progress Bar */}
      <div className={`w-full h-1 rounded-full mt-4 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
        <div 
          className="h-full bg-cyan-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(timer.currentSeconds / timer.initialSeconds) * 100}%` }}
        />
      </div>

      {/* Controls - Only visible if Master or Standalone */}
      {!isSlave && (
        <div className={`flex gap-4 mt-6 opacity-0 group-hover:opacity-100 transition-opacity ${isCompact ? 'scale-90' : ''}`}>
          <button
            onClick={() => onToggle(timer.id)}
            className={`p-4 rounded-full ${isRunning ? 'bg-amber-500' : 'bg-emerald-500'} text-white shadow-lg transform hover:scale-110 active:scale-95 transition-all`}
          >
            {isRunning ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          
          <button
            onClick={() => onReset(timer.id)}
            className={`p-4 rounded-full transform hover:scale-110 active:scale-95 transition-all ${isDark ? 'bg-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>

          <button
            onClick={() => onDelete(timer.id)}
            className={`p-4 rounded-full transform hover:scale-110 transition-all ${isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-red-500 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      )}

      {/* Slave Status Indicator */}
      {isSlave && (
        <div className={`absolute top-4 right-4 text-xs italic flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          Synced
        </div>
      )}
    </div>
  );
};
