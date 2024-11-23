import React, { useState, useEffect } from "react";
import { Trash2, X, EyeOff, Eye, AlertCircle } from "lucide-react";
import { BlockedItem,BlocklistModalProps, Notification } from "../types/Blocklist";
import { normalizeUrl } from "../utils/helpers";



const BlocklistModal: React.FC<BlocklistModalProps> = ({ isOpen, onClose }) => {
  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll when modal is open
      document.body.style.overflow = "hidden";
      chrome.storage.sync.get(["blocklist"], (result) => {
        if (result.blocklist) {
          const formattedItems = Array.isArray(result.blocklist)
            ? result.blocklist.map((url: string | BlockedItem) => {
                const normalizedUrl =
                  typeof url === "string"
                    ? normalizeUrl(url)
                    : normalizeUrl(url.url);
                return typeof url === "string"
                  ? { url: normalizedUrl, isActive: true }
                  : { ...url, url: normalizedUrl };
              })
            : [];
          setBlockedItems(formattedItems);
        }
      });
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = "unset";
      setNotification(null);
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const addItem = () => {
    if (!newItem) return;

    const normalizedUrl = normalizeUrl(newItem);
    if (blockedItems.some((item) => item.url === normalizedUrl)) {
      setNotification({
        message: `"${normalizedUrl}" is already in your blocklist`,
        type: "error",
      });
      return;
    }

    const newBlockedItem = { url: normalizedUrl, isActive: true };
    const updatedList = [...blockedItems, newBlockedItem];
    setBlockedItems(updatedList);
    chrome.storage.sync.set({ blocklist: updatedList }, () => {
      console.log("Updated blocklist:", updatedList);
      setNotification({
        message: `"${normalizedUrl}" has been added to your blocklist`,
        type: "success",
      });
    });
    setNewItem("");
  };

  const removeItem = (url: string) => {
    const updatedList = blockedItems.filter((item) => item.url !== url);
    setBlockedItems(updatedList);
    chrome.storage.sync.set({ blocklist: updatedList }, () => {
      console.log("Updated blocklist after removal:", updatedList);
      setNotification({
        message: `"${url}" has been removed from your blocklist`,
        type: "success",
      });
    });
  };

  const toggleBlock = (url: string) => {
    const updatedList = blockedItems.map((item) =>
      item.url === url ? { ...item, isActive: !item.isActive } : item
    );
    setBlockedItems(updatedList);
    chrome.storage.sync.set({ blocklist: updatedList }, () => {
      const item = updatedList.find((i) => i.url === url);
      setNotification({
        message: `"${url}" is now ${item?.isActive ? "blocked" : "unblocked"}`,
        type: "success",
      });
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 pointer-events-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
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
            {notification && (
              <div
                className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                  notification.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                } transition-opacity duration-300`}
              >
                <AlertCircle className="h-5 w-5" />
                <span>{notification.message}</span>
              </div>
            )}

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
    </div>
  );
};

export default BlocklistModal;
