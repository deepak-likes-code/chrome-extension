import React, { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { BookmarkIcon } from "./BookmarkIcon";

interface Bookmark {
  id: string;
  url: string;
  title: string;
  folderId: string | null;
}

interface BookmarkGridProps {
  selectedFolder: string | null;
  onBackToFolders: () => void;
}

// Include the updated BookmarkIcon component here

const AddBookmarkIcon: React.FC<{ onAddBookmark: () => void }> = ({
  onAddBookmark,
}) => {
  return (
    <div
      className="w-24 h-24 m-2 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 rounded"
      onClick={onAddBookmark}
    >
      <div className="w-16 h-16 bg-blue-200 flex items-center justify-center rounded">
        <span className="text-2xl">+</span>
      </div>
      <span className="text-xs mt-1 text-center overflow-hidden text-white">
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

  const addBookmark = () => {
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      url: "https://example.com",
      title: "New Bookmark",
      folderId: selectedFolder,
    };
    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    chrome.storage.local.set({ bookmarks: updatedBookmarks });
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
    <div ref={drop} className="flex-1 p-4 w-full overflow-auto">
      <button
        onClick={onBackToFolders}
        className="mb-4 bg-blue-500 text-white p-2 rounded"
      >
        Back to Folders
      </button>
      <div className="grid grid-cols-4 gap-4">
        {filteredBookmarks.map((bookmark) => (
          <BookmarkIcon
            key={bookmark.id}
            bookmark={bookmark}
            onMove={moveBookmark}
            onRename={renameBookmark}
            onDelete={deleteBookmark}
          />
        ))}
        <AddBookmarkIcon onAddBookmark={addBookmark} />
      </div>
    </div>
  );
};

export default BookmarkGrid;
