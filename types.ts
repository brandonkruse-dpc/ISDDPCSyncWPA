
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerModel {
  id: string;
  label: string;
  initialSeconds: number;
  currentSeconds: number;
  status: TimerStatus;
}

export type SyncRole = 'master' | 'slave' | 'standalone';

export interface SyncMessage {
  type: 'SYNC_UPDATE' | 'ACTION_TRIGGER';
  sourceId: string;
  payload: {
    timers?: TimerModel[];
    timestamp: number;
  };
}

export interface AppState {
  timers: TimerModel[];
  role: SyncRole;
  sessionId: string;
}
