import React, { useCallback, useState } from "react";
import { Shuffle, ShieldOff, PieChart, User } from "lucide-react";
import { createPortal } from "react-dom";
import BlocklistModal from "./BlockList";
import AnalyticsModal from "./AnalyticsModal";
import AboutDevModal from "./AboutDev";
import { useRef, useEffect } from "react";

interface BackgroundSelectorProps {
  onBackgroundChange: (newBackground: string, isColor?: boolean) => void;
}

interface TooltipButtonProps {
  onClick?: () => void;
  tooltip: string;
  children: React.ReactNode;
  className?: string;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({
  onClick,
  tooltip,
  children,
  className = "",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'left'>('top');

  useEffect(() => {
    if (buttonRef.current && tooltipRef.current && showTooltip) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      const wouldOverflowRight = buttonRect.right + (tooltipRect.width / 2) > window.innerWidth;
      const wouldOverflowLeft = buttonRect.left - (tooltipRect.width / 2) < 0;

      if (wouldOverflowRight || wouldOverflowLeft) {
        setTooltipPosition('left');
      } else {
        setTooltipPosition('top');
      }
    }
  }, [showTooltip]);

  const getTooltipStyles = () => {
    if (tooltipPosition === 'left') {
      return {
        tooltip: "absolute right-full bottom-0 mb-0 mr-2 px-3 py-1.5 bg-black text-white text-sm rounded whitespace-nowrap",
        arrow: "absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-black transform rotate-45"
      };
    }
    return {
      tooltip: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-sm rounded whitespace-nowrap",
      arrow: "absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black transform rotate-45"
    };
  };

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${className} flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg cursor-pointer hover:bg-opacity-30 transition-all duration-300`}
      >
        {children}
      </button>
      {showTooltip && (
        <div ref={tooltipRef} className={getTooltipStyles().tooltip}>
          {tooltip}
          <div className={getTooltipStyles().arrow}></div>
        </div>
      )}
    </div>
  );
};

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  onBackgroundChange,
}) => {
  const [isAboutDevOpen, setIsAboutDevOpen] = useState(false);
  const [isBlocklistOpen, setIsBlocklistOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [currentWallpaperIndex, setCurrentWallpaperIndex] = useState(0);

  const wallpapers = [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
    'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e'
  ];

  const handleShuffle = useCallback(() => {
    const newIndex = (currentWallpaperIndex + 1) % wallpapers.length;
    setCurrentWallpaperIndex(newIndex);
    onBackgroundChange(wallpapers[newIndex], false);
  }, [currentWallpaperIndex, onBackgroundChange, wallpapers]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === "string") {
            onBackgroundChange(event.target.result, false);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [onBackgroundChange]
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <TooltipButton
          onClick={() => setIsAnalyticsOpen(true)}
          tooltip="View analytics"
        >
          <PieChart className="h-5 w-5 text-white" />
        </TooltipButton>

        <TooltipButton
          onClick={() => setIsBlocklistOpen(true)}
          tooltip="Manage blocked sites"
        >
          <ShieldOff className="h-5 w-5 text-white" />
        </TooltipButton>

        <TooltipButton
          onClick={() => setIsAboutDevOpen(true)}
          tooltip="About the developer"
        >
          <User className="h-5 w-5 text-white" />
        </TooltipButton>

        <TooltipButton
          onClick={handleShuffle}
          tooltip="Change background"
        >
          <Shuffle className="h-5 w-5 text-white" />
        </TooltipButton>

        <div className="relative">
          <TooltipButton tooltip="Upload custom background">
            <label
              htmlFor="bg-upload"
              className="cursor-pointer"
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
            </label>
          </TooltipButton>
          <input
            id="bg-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {isBlocklistOpen &&
        createPortal(
          <BlocklistModal
            isOpen={isBlocklistOpen}
            onClose={() => setIsBlocklistOpen(false)}
          />,
          document.body
        )}

      {isAnalyticsOpen &&
        createPortal(
          <AnalyticsModal
            isOpen={isAnalyticsOpen}
            onClose={() => setIsAnalyticsOpen(false)}
          />,
          document.body
        )}

      {isAboutDevOpen &&
        createPortal(
          <AboutDevModal
            isOpen={isAboutDevOpen}
            onClose={() => setIsAboutDevOpen(false)}
          />,
          document.body
        )}
    </>
  );
};

export default BackgroundSelector;