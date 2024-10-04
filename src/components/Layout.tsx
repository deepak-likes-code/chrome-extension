import React, { useState, useEffect, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FolderGrid from "./FolderGrid";
import BookmarkGrid from "./BookmarkGrid";
import TodoList from "./TodoList";
import BackgroundSelector from "./BackgroundSelector";

const MacOSLayout: React.FC = () => {
  const [backgroundImage, setBackgroundImage] =
    useState<string>("default-bg.jpg");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    chrome.storage.local.get(["backgroundImage"], (result) => {
      if (result.backgroundImage) {
        setBackgroundImage(result.backgroundImage);
      }
    });

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && (changes.bookmarks || changes.folders)) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleBackgroundChange = useCallback((newBackgroundImage: string) => {
    setBackgroundImage(newBackgroundImage);
    chrome.storage.local.set({ backgroundImage: newBackgroundImage }, () => {
      console.log("Background image saved");
    });
  }, []);

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
        {/* Dark filter overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none"></div>

        <div className="w-full"></div>

        <div className="flex w-1/2 flex-col px-2 mt-4 relative z-10">
          <div className="flex flex-col max-h-[50vh] ">
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
        </div>

        <BackgroundSelector onBackgroundChange={handleBackgroundChange} />
      </div>
    </DndProvider>
  );
};

export default MacOSLayout;
