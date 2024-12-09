import React, { useCallback, useState } from "react";
import { Shuffle, User, X } from "lucide-react";
import { createPortal } from "react-dom";

interface BackgroundSelectorProps {
  onBackgroundChange: (newBackground: string, isColor?: boolean) => void;
}

interface AboutDevModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutDevModal: React.FC<AboutDevModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg w-full max-w-lg mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">About Focus Tab</h2>
          <p className="text-gray-700 leading-relaxed">
            I built Focus Tab to solve my own struggles with browser organization and time management. 
            The extension combines a clean todo list, timer, and bookmark manager to create a 
            distraction-free productivity environment right in your new tab. The integrated timer helps 
            with focusing on tasks, while the organized bookmarks reduce tab clutter. 
            I hope it helps you stay focused and organized as much as it's helped me!
          </p>
        </div>

        <div className="flex items-center justify-start gap-4 pt-4 border-t border-gray-200">
          <a
            href="https://github.com/yourusername/focus-tab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span>GitHub</span>
          </a>
          <a
            href="https://twitter.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
            <span>Twitter</span>
          </a>
          <a
            href="https://buymeacoffee.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#FFDD00] text-gray-900 rounded-md font-medium hover:bg-[#FFDD00]/90 transition-colors"
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutDevModal;