import React, { useState, useEffect } from "react";
import { Trash2, X, EyeOff, Eye } from "lucide-react";

interface BlocklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BlockedItem {
  url: string;
  isActive: boolean;
}

const BlocklistModal: React.FC<BlocklistModalProps> = ({ isOpen, onClose }) => {
  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (isOpen) {
      chrome.storage.sync.get(["blocklist"], (result) => {
        if (result.blocklist) {
          const formattedItems = Array.isArray(result.blocklist)
            ? result.blocklist.map((url: string | BlockedItem) => {
                return typeof url === "string" ? { url, isActive: true } : url;
              })
            : [];
          setBlockedItems(formattedItems);
          console.log("Loaded blocklist:", result.blocklist);
        }
      });
    }
  }, [isOpen]);

  const addItem = () => {
    if (newItem && !blockedItems.some((item) => item.url === newItem)) {
      const newBlockedItem = { url: newItem, isActive: true };
      const updatedList = [...blockedItems, newBlockedItem];
      setBlockedItems(updatedList);
      chrome.storage.sync.set({ blocklist: updatedList }, () => {
        console.log("Updated blocklist:", updatedList);
      });
      setNewItem("");
    }
  };

  const removeItem = (url: string) => {
    const updatedList = blockedItems.filter((item) => item.url !== url);
    setBlockedItems(updatedList);
    chrome.storage.sync.set({ blocklist: updatedList }, () => {
      console.log("Updated blocklist after removal:", updatedList);
    });
  };

  const toggleBlock = (url: string) => {
    const updatedList = blockedItems.map((item) =>
      item.url === url ? { ...item, isActive: !item.isActive } : item
    );
    setBlockedItems(updatedList);
    chrome.storage.sync.set({ blocklist: updatedList });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 relative">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Block List Manager
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addItem()}
              placeholder="Enter URL or domain to block"
              className="flex-grow p-3 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addItem}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {blockedItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No blocked items yet
              </p>
            ) : (
              <ul className="space-y-2">
                {blockedItems.map((item) => (
                  <li
                    key={item.url}
                    className={`flex justify-between items-center p-3 rounded-lg group transition-colors ${
                      item.isActive
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleBlock(item.url)}
                        className={`transition-colors ${
                          item.isActive
                            ? "text-red-500 hover:text-red-600"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {item.isActive ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                      <span>{item.url}</span>
                    </div>
                    <button
                      onClick={() => removeItem(item.url)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlocklistModal;
