import { useState, useEffect } from "react";
import { useDrop } from "react-dnd";
import { Folder } from "../types/Folder";

export const FolderIcon: React.FC<{
  folder: Folder;
  onSelect: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onMoveBookmark: (bookmarkId: string, folderId: string) => void;
}> = ({ folder, onSelect, onRename, onDelete, onMoveBookmark }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [folderName, setFolderName] = useState(folder.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  const handleRename = () => {
    onRename(folder.id, folderName);
    setIsEditing(false);
    setShowContextMenu(false);
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "bookmark",
    drop: (item: { id: string }) => onMoveBookmark(item.id, folder.id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

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
      ref={drop}
      className={`w-24 h-24 m-2 flex flex-col items-center justify-center cursor-pointer rounded relative ${
        isOver ? "bg-gray-700" : "hover:bg-gray-800"
      }`}
      onClick={() => !isEditing && onSelect(folder.id)}
      onContextMenu={handleContextMenu}
    >
      <div className="w-16 h-16 bg-gray-700 flex items-center justify-center rounded">
        <span className="text-4xl">📁</span>
      </div>
      {isEditing ? (
        <input
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onBlur={handleRename}
          onKeyPress={(e) => e.key === "Enter" && handleRename()}
          className="w-full text-center mt-1 text-xs bg-gray-800 text-gray-300"
          autoFocus
        />
      ) : (
        <span className="text-md mt-1 text-center text-white shadow-sm overflow-hidden">
          {folder.name}
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
              onDelete(folder.id);
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
