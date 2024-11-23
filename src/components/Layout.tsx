import React, { useState, useEffect, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FolderGrid from "./FolderGrid";
import BookmarkGrid from "./BookmarkGrid";
import TodoList from "./TodoList";
import BackgroundSelector from "./BackgroundSelector";
import Timer from "./Timer";
import { TimerState } from "../types/Timer";

interface BackgroundState {
  type: "image" | "color";
  value: string;
}

const MacOSLayout: React.FC = () => {
  const [background, setBackground] = useState<BackgroundState>({
    type: "image",
    value: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
  });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
  const [showBlocklist, setShowBlocklist] = useState(false);
  const [presetTitle, setPresetTitle] = useState<string | null>(null);

  const handleBackgroundChange = useCallback(
    (newBackground: string, isColor: boolean = false) => {
      const backgroundState: BackgroundState = {
        type: isColor ? "color" : "image",
        value: newBackground,
      };
      setBackground(backgroundState);
      chrome.storage.local.set({ background: backgroundState }, () => {
        console.log("Background saved");
      });
    },
    []
  );

  useEffect(() => {
    chrome.storage.local.get(["background", "timerState"], (result) => {
      if (result.background) {
        setBackground(result.background);
      }
      if (result.timerState) {
        setActiveTimer(result.timerState);
      }
    });

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local") {
        if (changes.bookmarks || changes.folders) {
          setRefreshTrigger((prev) => prev + 1);
        }
        if (changes.timerState) {
          setActiveTimer(changes.timerState.newValue);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleSetTimer = (
    title: string,
    hours: number,
    minutes: number,
    seconds: number
  ) => {
    const endTime = Date.now() + (hours * 3600 + minutes * 60 + seconds) * 1000;
    const newTimerState: TimerState = {
      title,
      endTime,
      isPaused: false,
    };
    setActiveTimer(newTimerState);
    chrome.storage.local.set({ timerState: newTimerState }, () => {
      console.log("Timer state saved");
      setPresetTitle(null); // Clear the preset title after timer starts
    });
  };

  const handleTimerEnd = () => {
    chrome.storage.local.remove("timerState", () => {
      console.log("Timer state cleared");
    });
    setActiveTimer(null);
    setPresetTitle(null);
  };

  const handleCancelTimer = () => {
    chrome.storage.local.remove("timerState", () => {
      console.log("Timer state cleared");
    });
    setActiveTimer(null);
    setPresetTitle(null);
  };

  const handleTimerPause = (isPaused: boolean) => {
    if (activeTimer) {
      const updatedTimer = { ...activeTimer, isPaused };
      setActiveTimer(updatedTimer);
      chrome.storage.local.set({ timerState: updatedTimer }, () => {
        console.log("Timer pause state updated");
      });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="h-screen w-screen overflow-hidden flex justify-stretch relative"
        style={
          background.type === "image"
            ? {
                backgroundImage: `url(${background.value})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transition: "background-image 0.5s ease-in-out"
              }
            : {
                backgroundColor: background.value,
                transition: "background-color 0.5s ease-in-out"
              }
        }
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none"></div>

        <div className="w-full"></div>

        <div className="flex w-1/2 flex-col px-2 mt-4 relative z-10">
          <div className="flex flex-col max-h-[50vh]">
            <TodoList
              onPresetTimer={setPresetTitle}
              activeTimerTitle={activeTimer?.title}
            />
          </div>
          <div className="flex">
            {selectedFolder === null ? (
              <FolderGrid
                onSelectFolder={setSelectedFolder}
                key={refreshTrigger}
              />
            ) : (
              <BookmarkGrid
                selectedFolder={selectedFolder}
                onBackToFolders={() => setSelectedFolder(null)}
                key={refreshTrigger}
              />
            )}
          </div>
        </div>

        <Timer
          initialTimer={activeTimer}
          presetTitle={presetTitle}
          onSetTimer={handleSetTimer}
          onTimerEnd={handleTimerEnd}
          onCancel={handleCancelTimer}
          onPause={handleTimerPause}
        />

        <div className="fixed bottom-4 right-4 flex items-center space-x-8 z-10">
          <BackgroundSelector onBackgroundChange={handleBackgroundChange} />
        </div>
      </div>
    </DndProvider>
  );
};

export default MacOSLayout;
