export type PlaybackAction = 'play' | 'pause' | 'stop' | 'extend';
export type PlaybackCard = {
  playing: boolean; mood: string; status: string; playLabel: string; stopLabel: string;
  extendLabel: string; helper: string; deadline: number | null; timerLabel: string; logo: string;
};
