import React, { useState, useEffect, useCallback, useRef } from "react";
import { Pause, Play, X } from "react-feather";

interface TimerProps {
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

const Timer: React.FC<TimerProps> = ({
  initialTimer,
  onSetTimer,
  onTimerEnd,
  onCancel,
  onPause,
}) => {
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTimer) {
      setTitle(initialTimer.title);
      setIsRunning(true);
      setIsPaused(initialTimer.isPaused);
      setTimeLeft(
        Math.max(0, Math.floor((initialTimer.endTime - Date.now()) / 1000))
      );
    }
  }, [initialTimer]);

  const formatTime = (time: number) => {
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = time % 60;
    return `${hrs.toString().padStart(2, "0")} hr ${mins
      .toString()
      .padStart(2, "0")}min ${secs.toString().padStart(2, "0")}sec`;
  };

  const startTimer = useCallback(() => {
    if (hours === 0 && minutes === 0 && seconds === 0) return;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    onSetTimer(title, hours, minutes, seconds);
    setTimeLeft(totalSeconds);
    setIsRunning(true);
  }, [hours, minutes, seconds, title, onSetTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            onTimerEnd();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft, onTimerEnd]);

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    onPause(newPausedState);
  };

  const handleCancel = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
    onCancel();
  };

  const handleScroll = (
    event: React.WheelEvent<HTMLDivElement>,
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number
  ) => {
    event.preventDefault();
    setter((prevValue) => {
      const newValue = prevValue - Math.sign(event.deltaY);
      return newValue < 0 ? max : newValue > max ? 0 : newValue;
    });
  };

  return (
    <div className="fixed top-1/3 left-1/3 transform -translate-x-1/2 bg-opacity-50 text-white rounded-lg p-6 text-center">
      {!isRunning ? (
        <>
          <h2 className="text-3xl mb-6">ready to lock-in?</h2>
          <div className="flex justify-center items-center mb-8 space-x-4">
            <div className="flex flex-col items-center">
              <div
                ref={hourRef}
                onWheel={(e) => handleScroll(e, setHours, 99)}
                className="w-24 h-24 overflow-hidden cursor-pointer"
              >
                <div className="text-6xl">
                  {hours.toString().padStart(2, "0")}
                </div>
              </div>
              <span className="text-lg mt-2">Hours</span>
            </div>
            <div className="flex flex-col items-center">
              <div
                ref={minuteRef}
                onWheel={(e) => handleScroll(e, setMinutes, 59)}
                className="w-24 h-24 overflow-hidden cursor-pointer"
              >
                <div className="text-6xl">
                  {minutes.toString().padStart(2, "0")}
                </div>
              </div>
              <span className="text-lg mt-2">Minutes</span>
            </div>
            <div className="flex flex-col items-center">
              <div
                ref={secondRef}
                onWheel={(e) => handleScroll(e, setSeconds, 59)}
                className="w-24 h-24 overflow-hidden cursor-pointer"
              >
                <div className="text-6xl">
                  {seconds.toString().padStart(2, "0")}
                </div>
              </div>
              <span className="text-lg mt-2">Seconds</span>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-x-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="current task"
              className="w-full p-2 bg-transparent border rounded-md text-left text-xl"
            />
            <button
              onClick={startTimer}
              className="px-3 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap text-xl"
            >
              Let's go.
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-5xl mb-6">{title ? title : "Locked In"}</h2>
          <div className="text-6xl font-mono mb-4">{formatTime(timeLeft)}</div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={togglePause}
              className="p-2 bg-gray-600 rounded-full hover:bg-gray-700 transition-colors"
            >
              {isPaused ? (
                <Play className="h-6 w-6" />
              ) : (
                <Pause className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={handleCancel}
              className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Timer;
