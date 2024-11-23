export interface TimerProps {
    initialTimer: { title: string; endTime: number; isPaused: boolean } | null;
    onSetTimer: (
      title: string,
      hours: number,
      minutes: number,
      seconds: number
    ) => void;
    onTimerEnd: () => void;
    onCancel: () => void;
    onPause: (isPaused: boolean) => void;
  }
  
  export interface TimerState {
    title: string;
    endTime: number;
    isPaused: boolean;
  }