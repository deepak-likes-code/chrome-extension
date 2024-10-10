import React, { useState, useEffect, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FolderGrid from "./FolderGrid";
import BookmarkGrid from "./BookmarkGrid";
import TodoList from "./TodoList";
import BackgroundSelector from "./BackgroundSelector";
import TimerModal from "./TimerModal";
import Timer from "./Timer";
import BlocklistManager from "./BlockList";

interface TimerState {
  title: string;
  endTime: number;
  isPaused: boolean;
  isCompleted: boolean;
}

const MacOSLayout: React.FC = () => {
  const [backgroundImage, setBackgroundImage] =
    useState<string>("../assets/bg.jpg");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [showBlocklist, setShowBlocklist] = useState(false);

  const handleBackgroundChange = useCallback((newBackgroundImage: string) => {
    setBackgroundImage(newBackgroundImage);
    chrome.storage.local.set({ backgroundImage: newBackgroundImage }, () => {
      console.log("Background image saved");
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.get(["backgroundImage", "timerState"], (result) => {
      if (result.backgroundImage) {
        setBackgroundImage(result.backgroundImage);
      }
      if (result.timerState) {
        setTimer(result.timerState);
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
          setTimer(changes.timerState.newValue);
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
    const endTime =
      Date.now() +
      hours * 60 * 60 * 1000 +
      minutes * 60 * 1000 +
      seconds * 1000;
    const newTimerState: TimerState = {
      title,
      endTime,
      isPaused: false,
      isCompleted: false,
    };
    setTimer(newTimerState);
    chrome.storage.local.set({ timerState: newTimerState }, () => {
      console.log("Timer state saved");
    });
    chrome.runtime.sendMessage({
      action: "setTimerAlarm",
      alarmName: "timerAlarm",
      when: endTime,
    });

    setIsTimerModalOpen(false);
  };

  const handleTimerEnd = () => {
    chrome.storage.local.remove("timerState", () => {
      console.log("Timer state cleared");
    });
    chrome.runtime.sendMessage({
      action: "clearTimerAlarm",
      alarmName: "timerAlarm",
    });
    setTimer(null);
  };

  const handleCancelTimer = () => {
    chrome.storage.local.remove("timerState", () => {
      console.log("Timer state cleared");
    });
    chrome.runtime.sendMessage({
      action: "clearTimerAlarm",
      alarmName: "timerAlarm",
    });
    setTimer(null);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="h-screen w-screen overflow-hidden flex justify-stretch relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none"></div>

        <div className="w-full"></div>

        <div className="flex w-1/2 flex-col px-2 mt-4 relative z-10">
          <div className="flex flex-col max-h-[50vh]">
            <TodoList />
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

          <div className="flex items-center justify-center mt-4">
            <button
              onClick={() => setIsTimerModalOpen(true)}
              className="px-4 py-2 bg-gray-500 cursor-pointer text-white rounded hover:bg-gray-600 transition-colors"
            >
              Add Timer
            </button>
            <button
              onClick={() => setShowBlocklist(!showBlocklist)}
              className="px-4 py-2 bg-gray-500 cursor-pointer text-white rounded hover:bg-gray-600 transition-colors"
            >
              {showBlocklist ? "Hide Blocklist" : "Show Blocklist"}
            </button>
          </div>

          {showBlocklist && <BlocklistManager />}
        </div>

        {timer && (
          <Timer
            title={timer.title}
            endTime={timer.endTime}
            onTimerEnd={handleTimerEnd}
            onCancel={handleCancelTimer}
          />
        )}

        <div className="fixed bottom-4 right-4 flex items-center space-x-8 z-10">
          <BackgroundSelector onBackgroundChange={handleBackgroundChange} />
        </div>

        <TimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          onSetTimer={handleSetTimer}
        />
      </div>
    </DndProvider>
  );
};

export default MacOSLayout;
