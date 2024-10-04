import React, { useState } from "react";

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetTimer: (
    title: string,
    hours: number,
    minutes: number,
    seconds: number
  ) => void;
}

const TimerModal: React.FC<TimerModalProps> = ({
  isOpen,
  onClose,
  onSetTimer,
}) => {
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetTimer(title, hours, minutes, seconds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Set Timer</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Timer Title"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <div className="flex items-center space-x-4 mb-4">
            <div>
              <label htmlFor="hours" className="block mb-1 text-sm">
                Hours
              </label>
              <input
                id="hours"
                type="number"
                value={hours}
                onChange={(e) =>
                  setHours(Math.max(0, parseInt(e.target.value)))
                }
                placeholder="0"
                className="w-20 p-2 border rounded"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="minutes" className="block mb-1 text-sm">
                Minutes
              </label>
              <input
                id="minutes"
                type="number"
                value={minutes}
                onChange={(e) =>
                  setMinutes(
                    Math.max(0, Math.min(59, parseInt(e.target.value)))
                  )
                }
                placeholder="0"
                className="w-20 p-2 border rounded"
                min="0"
                max="59"
              />
            </div>
            <div>
              <label htmlFor="seconds" className="block mb-1 text-sm">
                Seconds
              </label>
              <input
                id="seconds"
                type="number"
                value={seconds}
                onChange={(e) =>
                  setSeconds(
                    Math.max(0, Math.min(59, parseInt(e.target.value)))
                  )
                }
                placeholder="0"
                className="w-20 p-2 border rounded"
                min="0"
                max="59"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Start Timer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimerModal;
