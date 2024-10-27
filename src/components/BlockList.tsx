import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";

interface BlocklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BlocklistModal: React.FC<BlocklistModalProps> = ({ isOpen, onClose }) => {
  const [blockedItems, setBlockedItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (isOpen) {
      chrome.storage.sync.get(["blocklist"], (result) => {
        if (result.blocklist) {
          setBlockedItems(result.blocklist);
          console.log("Loaded blocklist:", result.blocklist);
        }
      });
    }
  }, [isOpen]);

  const addItem = () => {
    if (newItem && !blockedItems.includes(newItem)) {
      const updatedList = [...blockedItems, newItem];
      setBlockedItems(updatedList);
      chrome.storage.sync.set({ blocklist: updatedList }, () => {
        console.log("Updated blocklist:", updatedList);
      });
      setNewItem("");
    }
  };

  const removeItem = (item: string) => {
    const updatedList = blockedItems.filter((blocked) => blocked !== item);
    setBlockedItems(updatedList);
    chrome.storage.sync.set({ blocklist: updatedList }, () => {
      console.log("Updated blocklist after removal:", updatedList);
    });
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
                    key={item}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group"
                  >
                    <span className="text-gray-700">{item}</span>
                    <button
                      onClick={() => removeItem(item)}
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
