import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { Bookmark, Edit, Trash2 } from "lucide-react";
import { Bookmark as BookmarkType } from "../types/Bookmark";

interface BookmarkIconProps {
  bookmark: BookmarkType;
  onMove: (id: string, folderId: string | null) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  bookmark,
  onMove,
  onRename,
  onDelete,
}) => {
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
    const handleClickOutside = () =>
      showContextMenu && setShowContextMenu(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showContextMenu]);

  return (
    <div
      ref={drag}
      className={`w-24 h-24 m-2 flex flex-col items-center justify-center relative group 
        ${isDragging ? "opacity-50" : ""}`}
      onContextMenu={handleContextMenu}
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center rounded-lg shadow-lg hover:bg-opacity-30 transition-all duration-300"
        onClick={(e) => isEditing && e.preventDefault()}
      >
        <Bookmark className="h-8 w-8 text-white" />
      </a>

      {isEditing ? (
        <input
          type="text"
          value={bookmarkTitle}
          onChange={(e) => setBookmarkTitle(e.target.value)}
          onBlur={handleRename}
          onKeyPress={(e) => e.key === "Enter" && handleRename()}
          className="w-full mt-2 p-1 text-sm bg-white bg-opacity-20 backdrop-blur-sm rounded focus:outline-none focus:ring-2 focus:ring-white text-white text-center"
          autoFocus
        />
      ) : (
        <span className="text-sm text-white font-medium mt-2 text-center overflow-hidden whitespace-nowrap text-ellipsis w-full px-1">
          {bookmark.title}
        </span>
      )}

      {showContextMenu && (
        <div
          className="fixed bg-white bg-opacity-90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-lg py-1 z-50"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setShowContextMenu(false);
            }}
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Rename</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bookmark.id);
              setShowContextMenu(false);
            }}
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BookmarkIcon;
