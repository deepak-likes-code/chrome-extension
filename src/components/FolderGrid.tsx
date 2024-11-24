import React, { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { FolderIcon } from "./FolderIcon";
import BookmarkIcon from "./BookmarkIcon";
import { Bookmark } from "../types/Bookmark";
import { Folder, FolderGridProps } from "../types/Folder";
import { FolderPlus, Plus } from "lucide-react";

const AddFolderIcon: React.FC<{ onAddFolder: () => void }> = ({
  onAddFolder,
}) => {
  return (
    <div
      className="w-24 h-24 m-2 flex flex-col items-center justify-center cursor-pointer group"
      onClick={onAddFolder}
    >
      <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center rounded-lg shadow-lg group-hover:bg-opacity-30 transition-all duration-300">
        <FolderPlus className="h-8 w-8 text-white" />
      </div>
      <span className="text-sm text-white font-medium mt-2 text-center overflow-hidden">
        Add Folder
      </span>
    </div>
  );
};

const FolderGrid: React.FC<FolderGridProps> = ({ onSelectFolder }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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
    const name = newFolderName.trim() || "New Folder";
    const newFolder: Folder = { id: Date.now().toString(), name };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    chrome.storage.local.set({ folders: updatedFolders });
    setNewFolderName("");
    setIsAddingFolder(false);
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
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">My Folders</h2>
        <button
          onClick={() => setIsAddingFolder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg cursor-pointer hover:bg-opacity-30 transition-all duration-300 text-white"
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">New Folder</span>
        </button>
      </div>

      {isAddingFolder && (
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name"
            className="flex-grow p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
            autoFocus
            onKeyPress={(e) => e.key === "Enter" && addFolder()}
          />
          <button
            onClick={addFolder}
            className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg text-white hover:bg-opacity-30 transition-all duration-300"
          >
            Add
          </button>
          <button
            onClick={() => setIsAddingFolder(false)}
            className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg text-white hover:bg-opacity-30 transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
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
        <AddFolderIcon onAddFolder={() => setIsAddingFolder(true)} />
      </div>
    </div>
  );
};

export default FolderGrid;
