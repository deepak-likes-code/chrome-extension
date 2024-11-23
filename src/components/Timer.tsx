import React, { useState, useEffect, useCallback, useRef } from "react";
import { Pause, Play, X } from "react-feather";
import { TimerProps } from "../types/Timer";

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

  const handleManualInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number
  ) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= max) {
      setter(numValue);
    }
  };

  const getTimeValues = () => {
    if (isRunning) {
      const hrs = Math.floor(timeLeft / 3600);
      const mins = Math.floor((timeLeft % 3600) / 60);
      const secs = timeLeft % 60;
      return [
        { value: hrs, setter: setHours, max: 99, label: "Hours" },
        { value: mins, setter: setMinutes, max: 59, label: "Minutes" },
        { value: secs, setter: setSeconds, max: 59, label: "Seconds" },
      ];
    }
    return [
      { value: hours, setter: setHours, max: 99, label: "Hours" },
      { value: minutes, setter: setMinutes, max: 59, label: "Minutes" },
      { value: seconds, setter: setSeconds, max: 59, label: "Seconds" },
    ];
  };

  return (
    <div className="fixed top-1/3 left-1/3 transform -translate-x-1/2 bg-opacity-50 text-white rounded-lg p-6 text-center">
      <h2 className="text-3xl mb-6">
        {isRunning ? (title ? title : "Locked In") : "ready to lock-in?"}
      </h2>
      <div className="flex justify-center items-center mb-8 space-x-4">
        {getTimeValues().map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="relative w-24 h-24 overflow-hidden">
              <div
                onWheel={(e) =>
                  !isRunning && handleScroll(e, item.setter, item.max)
                }
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
              >
                <input
                  type="text"
                  value={item.value.toString().padStart(2, "0")}
                  onChange={(e) =>
                    !isRunning &&
                    handleManualInput(e.target.value, item.setter, item.max)
                  }
                  className="w-full h-full text-6xl text-center bg-transparent focus:outline-none"
                  readOnly={isRunning}
                />
              </div>
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent opacity-50"></div>
            </div>
            <span className="text-lg mt-2">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-row justify-center items-center gap-x-4">
        {!isRunning && (
          <>
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
          </>
        )}
        {isRunning && (
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
        )}
      </div>
    </div>
  );
};

export default Timer;
