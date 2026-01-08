
export const formatTime = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const h = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : '';
  const m = mins.toString().padStart(2, '0');
  const s = secs.toString().padStart(2, '0');

  return `${h}${m}:${s}`;
};

export const parseTimeToSeconds = (h: number, m: number, s: number): number => {
  return (h * 3600) + (m * 60) + s;
};

export const generateId = () => Math.random().toString(36).substring(2, 9);
