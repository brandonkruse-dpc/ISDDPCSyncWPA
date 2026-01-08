
import React, { useState } from 'react';
import { parseTimeToSeconds } from '../utils/timeUtils';

interface AddTimerModalProps {
  onClose: () => void;
  onAdd: (label: string, seconds: number) => void;
  onAiPreset?: (prompt: string) => Promise<void>;
}

export const AddTimerModal: React.FC<AddTimerModalProps> = ({ onClose, onAdd, onAiPreset }) => {
  const [label, setLabel] = useState('New Timer');
  const [h, setH] = useState(0);
  const [m, setM] = useState(5);
  const [s, setS] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseTimeToSeconds(h, m, s);
    if (total > 0) {
      onAdd(label, total);
      onClose();
    }
  };

  const handleAiSubmit = async () => {
    if (!aiPrompt || !onAiPreset) return;
    setIsGenerating(true);
    await onAiPreset(aiPrompt);
    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Add New Timer</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Timer Name</label>
            <input 
              type="text" 
              value={label} 
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Ex: Exam Session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Duration</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input 
                  type="number" min="0" max="23" value={h} onChange={(e) => setH(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center text-xl text-white font-mono"
                />
                <span className="block text-center text-[10px] text-slate-500 mt-1 uppercase">Hours</span>
              </div>
              <div>
                <input 
                  type="number" min="0" max="59" value={m} onChange={(e) => setM(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center text-xl text-white font-mono"
                />
                <span className="block text-center text-[10px] text-slate-500 mt-1 uppercase">Minutes</span>
              </div>
              <div>
                <input 
                  type="number" min="0" max="59" value={s} onChange={(e) => setS(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center text-xl text-white font-mono"
                />
                <span className="block text-center text-[10px] text-slate-500 mt-1 uppercase">Seconds</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 transition-all"
            >
              Create
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-800">
          <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Generate with Gemini AI</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Boxing training rounds"
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
            />
            <button
              onClick={handleAiSubmit}
              disabled={isGenerating || !aiPrompt}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {isGenerating ? '...' : 'Magic'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
