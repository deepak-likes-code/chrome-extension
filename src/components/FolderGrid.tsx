import React, { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { FolderIcon } from "./FolderIcon";
import { BookmarkIcon } from "./BookmarkIcon";
import { Bookmark } from "../types/Bookmark";
import { Folder, FolderGridProps } from "../types/Folder";

const AddFolderIcon: React.FC<{ onAddFolder: () => void }> = ({
  onAddFolder,
}) => {
  return (
    <div
      className="w-24 h-24 m-2 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 rounded"
      onClick={onAddFolder}
    >
      <div className="w-16 h-16 bg-gray-700 flex items-center justify-center rounded">
        <span className="text-4xl">+</span>
      </div>
      <span className="text-xs mt-1 text-center overflow-hidden">
        Add Folder
      </span>
    </div>
  );
};

const FolderGrid: React.FC<FolderGridProps> = ({ onSelectFolder }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    chrome.storage.local.get(["folders", "bookmarks"], (result) => {
      if (result.folders) setFolders(result.folders);
      if (result.bookmarks) setBookmarks(result.bookmarks || []);
    });

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local") {
        if (changes.folders) setFolders(changes.folders.newValue);
        if (changes.bookmarks) setBookmarks(changes.bookmarks.newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const addFolder = () => {
    const newFolder: Folder = { id: Date.now().toString(), name: "New Folder" };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    chrome.storage.local.set({ folders: updatedFolders });
  };

  const renameFolder = (id: string, newName: string) => {
    const updatedFolders = folders.map((f) =>
      f.id === id ? { ...f, name: newName } : f
    );
    setFolders(updatedFolders);
    chrome.storage.local.set({ folders: updatedFolders });
  };

  const deleteFolder = (id: string) => {
    const updatedFolders = folders.filter((f) => f.id !== id);
    setFolders(updatedFolders);
    chrome.storage.local.set({ folders: updatedFolders });

    // Delete bookmarks in this folder
    const updatedBookmarks = bookmarks.filter((b) => b.folderId !== id);
    setBookmarks(updatedBookmarks);
    chrome.storage.local.set({ bookmarks: updatedBookmarks });
  };

  const moveBookmark = (bookmarkId: string, folderId: string) => {
    const updatedBookmarks = bookmarks.map((b) =>
      b.id === bookmarkId ? { ...b, folderId: folderId } : b
    );
    setBookmarks(updatedBookmarks);
    chrome.storage.local.set({ bookmarks: updatedBookmarks });
  };

  const deleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updatedBookmarks);
    chrome.storage.local.set({ bookmarks: updatedBookmarks });
  };

  const unorganizedBookmarks = bookmarks.filter((b) => b.folderId === null);

  return (
    <div className="flex p-4 overflow-auto">
      <div className="grid grid-cols-4 gap-1">
        {folders.map((folder) => (
          <FolderIcon
            key={folder.id}
            folder={folder}
            onSelect={onSelectFolder}
            onRename={renameFolder}
            onDelete={deleteFolder}
            onMoveBookmark={moveBookmark}
          />
        ))}
        {unorganizedBookmarks.map((bookmark) => (
          <BookmarkIcon
            key={bookmark.id}
            bookmark={bookmark}
            onMove={(bookmarkId, folderId) =>
              moveBookmark(bookmarkId, folderId || "")
            }
            onRename={(id, newName) => {
              const updatedBookmarks = bookmarks.map((b) =>
                b.id === id ? { ...b, title: newName } : b
              );
              setBookmarks(updatedBookmarks);
              chrome.storage.local.set({ bookmarks: updatedBookmarks });
            }}
            onDelete={deleteBookmark}
          />
        ))}
        <AddFolderIcon onAddFolder={addFolder} />
      </div>
    </div>
  );
};

export default FolderGrid;
