export type PlaybackAction = 'play' | 'pause' | 'stop' | 'extend';
export type PlaybackCard = {
  playing: boolean; mood: string; status: string; playLabel: string; stopLabel: string;
  extendLabel: string; deadline: number | null; logo: string;
};
