interface BackgroundSelectorProps {
  onBackgroundChange: (newBackground: string) => void;
}

import React, { useCallback, useState } from "react";

interface BackgroundSelectorProps {
  onBackgroundChange: (newBackground: string) => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  onBackgroundChange,
}) => {
  const pastelColors = [
    "#FFB3BA",
    "#BAFFC9",
    "#BAE1FF",
    "#FFFFBA",
    "#FFDFBA",
    "#E0BBE4",
    "#D4F0F0",
    "#FFC6FF",
    "#DAEAF6",
    "#FFDAB9",
  ];

  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  const handleShuffle = useCallback(() => {
    const newIndex = (currentColorIndex + 1) % pastelColors.length;
    setCurrentColorIndex(newIndex);
    onBackgroundChange(pastelColors[newIndex]);
  }, [currentColorIndex, onBackgroundChange]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === "string") {
            onBackgroundChange(event.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [onBackgroundChange]
  );

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2">
      <button
        onClick={handleShuffle}
        className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg cursor-pointer hover:bg-opacity-30 transition-all duration-300"
      >
        <span className="text-white text-sm">Shuffle BG</span>
      </button>

      <label
        htmlFor="bg-upload"
        className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg cursor-pointer hover:bg-opacity-30 transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-white text-sm">Change Background</span>
      </label>
      <input
        id="bg-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default BackgroundSelector;
