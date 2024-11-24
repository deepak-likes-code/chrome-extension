import React, { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import BookmarkIcon from "./BookmarkIcon";
import AddBookmarkModal from "./AddBookmarkModal";
import { ArrowLeft, Plus, BookmarkPlus } from "lucide-react";
import { Bookmark, BookmarkGridProps } from "../types/Bookmark";

const AddBookmarkIcon: React.FC<{ onAddBookmark: () => void }> = ({
  onAddBookmark,
}) => {
  return (
    <div
      className="w-24 h-24 m-2 flex flex-col items-center justify-center cursor-pointer group"
      onClick={onAddBookmark}
    >
      <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center rounded-lg shadow-lg group-hover:bg-opacity-30 transition-all duration-300">
        <BookmarkPlus className="h-8 w-8 text-white" />
      </div>
      <span className="text-sm text-white font-medium mt-2 text-center overflow-hidden">
        Add Bookmark
      </span>
    </div>
  );
};

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  selectedFolder,
  onBackToFolders,
}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["bookmarks"], (result) => {
      if (result.bookmarks) {
        setBookmarks(result.bookmarks);
      }
    });

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes.bookmarks) {
        setBookmarks(changes.bookmarks.newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const [, drop] = useDrop(() => ({
    accept: "bookmark",
    drop: (item: { id: string }) => moveBookmark(item.id, selectedFolder),
  }));

  const moveBookmark = (id: string, folderId: string | null) => {
    const updatedBookmarks = bookmarks.map((bookmark) =>
      bookmark.id === id ? { ...bookmark, folderId } : bookmark
    );
    setBookmarks(updatedBookmarks);
    chrome.storage.local.set({ bookmarks: updatedBookmarks });
  };

  const addBookmark = (url: string, title: string) => {
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      url,
      title,
      folderId: selectedFolder,
    };
    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    chrome.storage.local.set({ bookmarks: updatedBookmarks });
    setIsAddModalOpen(false);
  };

  const renameBookmark = (id: string, newName: string) => {
    const updatedBookmarks = bookmarks.map((b) =>
      b.id === id ? { ...b, title: newName } : b
    );
    setBookmarks(updatedBookmarks);
    chrome.storage.local.set({ bookmarks: updatedBookmarks });
  };

  const deleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updatedBookmarks);
    chrome.storage.local.set({ bookmarks: updatedBookmarks });
  };

  const filteredBookmarks = bookmarks.filter(
    (bookmark) => bookmark.folderId === selectedFolder
  );

  return (
    <div ref={drop} className="flex-1 p-6 w-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToFolders}
          className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg cursor-pointer hover:bg-opacity-30 transition-all duration-300 text-white"
          aria-label="Back to Folders"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Folders</span>
        </button>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg cursor-pointer hover:bg-opacity-30 transition-all duration-300 text-white"
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">Add Bookmark</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {filteredBookmarks.map((bookmark) => (
          <BookmarkIcon
            key={bookmark.id}
            bookmark={bookmark}
            onMove={moveBookmark}
            onRename={renameBookmark}
            onDelete={deleteBookmark}
          />
        ))}
        <AddBookmarkIcon onAddBookmark={() => setIsAddModalOpen(true)} />
      </div>

      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addBookmark}
      />
    </div>
  );
};

export default BookmarkGrid;
