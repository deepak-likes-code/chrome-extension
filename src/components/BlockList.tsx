import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

const BlocklistManager: React.FC = () => {
  const [blockedItems, setBlockedItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    chrome.storage.sync.get(["blocklist"], (result) => {
      if (result.blocklist) {
        setBlockedItems(result.blocklist);
        console.log("Loaded blocklist:", result.blocklist);
      }
    });
  }, []);

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

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg p-6 m-4">
      <div className="flex mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Enter URL or domain to block"
          className="flex-grow p-2 border rounded-l"
        />
        <button
          onClick={addItem}
          className=" text-white p-2 rounded-r bg-gray-600 hover:bg-gray-800 transition-colors"
        >
          Add
        </button>
      </div>
      <ul>
        {blockedItems.map((item) => (
          <li
            key={item}
            className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded"
          >
            <span>{item}</span>
            <button onClick={() => removeItem(item)}>
              <Trash2 />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlocklistManager;
