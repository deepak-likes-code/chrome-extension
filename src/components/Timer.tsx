import React, { useState, useEffect } from "react";
import { Pause, Play, X } from "react-feather";

interface TimerProps {
  title: string;
  endTime: number;
  onTimerEnd: () => void;
  onCancel: () => void;
}

const Timer: React.FC<TimerProps> = ({
  title,
  endTime,
  onTimerEnd,
  onCancel,
}) => {
  const [timeLeft, setTimeLeft] = useState(endTime - Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!isPaused && !isCompleted) {
      interval = setInterval(() => {
        const newTimeLeft = endTime - Date.now();
        if (newTimeLeft <= 0) {
          clearInterval(interval);
          setTimeLeft(0);
          setIsCompleted(true);
          onTimerEnd();
        } else {
          setTimeLeft(newTimeLeft);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [endTime, onTimerEnd, isPaused, isCompleted]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 rounded-lg shadow-lg p-6 text-center cursor-pointer hover:bg-opacity-100 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {isCompleted ? (
        <div className="text-4xl font-bold text-green-600 mb-4">
          Mission Accomplished!
        </div>
      ) : (
        <>
          <div className="text-6xl font-mono mb-4">{formatTime(timeLeft)}</div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isPaused ? (
                <Play className="h-6 w-6" />
              ) : (
                <Pause className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
