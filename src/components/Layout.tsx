import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FolderGrid from "./FolderGrid";
import BookmarkGrid from "./BookmarkGrid";
import TodoList from "./TodoList";
import Spline from "@splinetool/react-spline";

const MacOSLayout: React.FC = () => {
  const [backgroundImage, setBackgroundImage] =
    useState<string>("default-bg.jpg");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Load the saved background image when the component mounts
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

  const handleBackgroundChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newBackgroundImage = e.target?.result as string;
        setBackgroundImage(newBackgroundImage);
        // Save the new background image to Chrome's local storage
        chrome.storage.local.set(
          { backgroundImage: newBackgroundImage },
          () => {
            console.log("Background image saved");
          }
        );
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="h-screen w-screen overflow-hidden flex justify-stretch "
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* <Spline scene="https://prod.spline.design/pBTlg1jNgQI3Pfsc/scene.splinecode" /> */}
        <div className="w-full"></div>

        <div className="flex w-1/2 flex-col px-2 mt-4">
          <div className="flex flex-col max-h-[50vh] ">
            <TodoList />
          </div>
          <div className=" flex ">
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

          <input
            type="file"
            onChange={handleBackgroundChange}
            className="absolute bottom-4 right-4"
            accept="image/*"
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default MacOSLayout;
