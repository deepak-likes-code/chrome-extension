import { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { Bookmark } from "../types/Bookmark";

export const BookmarkIcon: React.FC<{
  bookmark: Bookmark;
  onMove: (id: string, folderId: string | null) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}> = ({ bookmark, onMove, onRename, onDelete }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "bookmark",
    item: { id: bookmark.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState(bookmark.title);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  const handleRename = () => {
    onRename(bookmark.id, bookmarkTitle);
    setIsEditing(false);
    setShowContextMenu(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
    setContextMenuPosition({ x: e.pageX, y: e.pageY });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showContextMenu]);

  return (
    <div
      ref={drag}
      className={`w-24 h-24 m-2 flex flex-col items-center justify-center relative ${
        isDragging ? "opacity-50" : ""
      }`}
      onContextMenu={handleContextMenu}
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-16 h-16 bg-gray-500 flex items-center justify-center rounded"
        onClick={(e) => isEditing && e.preventDefault()}
      >
        <span className="text-2xl">🔖</span>
      </a>
      {isEditing ? (
        <input
          type="text"
          value={bookmarkTitle}
          onChange={(e) => setBookmarkTitle(e.target.value)}
          onBlur={handleRename}
          onKeyPress={(e) => e.key === "Enter" && handleRename()}
          className="w-full text-center mt-1 text-xs"
          autoFocus
        />
      ) : (
        <span className="text-xs text-white font-medium mt-1 text-center overflow-hidden whitespace-nowrap text-ellipsis w-full px-1">
          {bookmark.title}
        </span>
      )}
      {showContextMenu && (
        <div
          className="fixed bg-white border border-gray-300 shadow-md rounded-md py-2 z-50"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setShowContextMenu(false);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bookmark.id);
              setShowContextMenu(false);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
