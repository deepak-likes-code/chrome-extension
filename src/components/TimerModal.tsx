import React, { useState, useEffect } from "react";

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
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setHours(0);
      setMinutes(0);
      setSeconds(0);
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hours === 0 && minutes === 0 && seconds === 0) {
      setError("Please set a time greater than 0");
      return;
    }
    onSetTimer(title, hours, minutes, seconds);
    onClose();
  };

  const handleNumberInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number
  ) => {
    const num = parseInt(value);
    if (isNaN(num)) {
      setter(0);
    } else {
      setter(Math.max(0, Math.min(max, num)));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Set Timer</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Timer Title"
            className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex justify-between mb-4">
            <div className="w-1/3 pr-2">
              <label htmlFor="hours" className="block mb-1 text-sm font-medium">
                Hours
              </label>
              <input
                id="hours"
                type="number"
                value={hours}
                onChange={(e) =>
                  handleNumberInput(e.target.value, setHours, 99)
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="99"
              />
            </div>
            <div className="w-1/3 px-1">
              <label
                htmlFor="minutes"
                className="block mb-1 text-sm font-medium"
              >
                Minutes
              </label>
              <input
                id="minutes"
                type="number"
                value={minutes}
                onChange={(e) =>
                  handleNumberInput(e.target.value, setMinutes, 59)
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="59"
              />
            </div>
            <div className="w-1/3 pl-2">
              <label
                htmlFor="seconds"
                className="block mb-1 text-sm font-medium"
              >
                Seconds
              </label>
              <input
                id="seconds"
                type="number"
                value={seconds}
                onChange={(e) =>
                  handleNumberInput(e.target.value, setSeconds, 59)
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="59"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:gray-blue-500 transition-colors"
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
