import React, { useState, useEffect, useCallback } from "react";
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

  const updateTimerState = useCallback(() => {
    chrome.storage.local.set({
      timerState: { title, endTime, isPaused, isCompleted },
    });
  }, [title, endTime, isPaused, isCompleted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!isPaused && !isCompleted) {
      interval = setInterval(() => {
        const newTimeLeft = endTime - Date.now();
        if (newTimeLeft <= 0) {
          clearInterval(interval);
          setTimeLeft(0);
          setIsCompleted(true);
          chrome.runtime.sendMessage({
            action: "createTimerNotification",
            title: title,
          });
          onTimerEnd();
        } else {
          setTimeLeft(newTimeLeft);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [endTime, onTimerEnd, isPaused, isCompleted, title]);

  useEffect(() => {
    updateTimerState();
  }, [updateTimerState]);

  useEffect(() => {
    const messageListener = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.action === "updateTimer") {
        setTimeLeft(message.timeLeft);
        setIsPaused(message.isPaused);
        setIsCompleted(message.isCompleted);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Initialize timer state
    const initializeTimerState = () => {
      chrome.storage.local.get(["timerState"], (result) => {
        if (result.timerState) {
          setTimeLeft(result.timerState.endTime - Date.now());
          setIsPaused(result.timerState.isPaused);
          setIsCompleted(result.timerState.isCompleted);
        }
      });
    };

    initializeTimerState();

    // Notify background script that the timer component is ready
    chrome.runtime.sendMessage({ action: "timerComponentReady" });

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

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
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    chrome.runtime.sendMessage({
      action: "updateTimerPause",
      isPaused: newPausedState,
    });
  };

  const handleClose = () => {
    onCancel();
    chrome.runtime.sendMessage({ action: "cancelTimer" });
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 rounded-lg shadow-lg p-6 text-center hover:bg-opacity-100 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {isCompleted ? (
        <>
          <div className="text-4xl font-bold text-green-600 mb-4">
            Mission Accomplished!
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </>
      ) : (
        <>
          <div className="text-6xl font-mono mb-4">{formatTime(timeLeft)}</div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {isPaused ? (
                <Play className="h-6 w-6" />
              ) : (
                <Pause className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={handleClose}
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
