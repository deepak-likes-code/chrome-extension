import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

interface TimeEntry {
  domain: string;
  duration: number;
  date: string;
}

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };
  

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B6B6B', '#E9D985', '#6C88C4', '#77A8A8'
];

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await chrome.storage.local.get(['timeEntries']);
        setTimeEntries(result.timeEntries || []);
      } catch (error) {
        console.error('Error loading time entries:', error);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const getFilteredData = () => {
    const now = new Date();
    const startDate = viewMode === 'daily' ? startOfDay(now)
      : viewMode === 'weekly' ? subDays(now, 7)
      : subDays(now, 30);

    return timeEntries.filter(entry => new Date(entry.date) >= startDate);
  };

  const processDataForChart = () => {
    const filteredData = getFilteredData();
    const domainTotals = new Map<string, number>();

    filteredData.forEach(entry => {
      const current = domainTotals.get(entry.domain) || 0;
      domainTotals.set(entry.domain, current + entry.duration);
    });

    return Array.from(domainTotals.entries())
      .map(([domain, duration]) => ({
        domain: domain,
        minutes: Math.round(duration / 60000),
      }))
      .filter(item => item.minutes >= 1) // Only show items with 1 or more minutes
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10);
  };

  if (!isOpen) return null;

  const chartData = processDataForChart();
  const totalMinutes = chartData.reduce((acc, item) => acc + item.minutes, 0);



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Time Insights</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex space-x-2 mb-8">
            {['daily', 'weekly', 'monthly'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as 'daily' | 'weekly' | 'monthly')}
                className={`px-6 py-2 rounded-full transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-row items-start gap-8 mt-4">
            <div className="flex-1">
              <div className="h-[400px] relative">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="minutes"
                      nameKey="domain"
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={hoveredSite ? 140 : 130}
                      paddingAngle={2}
                      onMouseEnter={(_, index) => setHoveredSite(chartData[index].domain)}
                      onMouseLeave={() => setHoveredSite(null)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={entry.domain} 
                          fill={COLORS[index % COLORS.length]}
                          opacity={hoveredSite === null || hoveredSite === entry.domain ? 1 : 0.3}
                          className="transition-all duration-300"
                          style={{
                            transform: hoveredSite === entry.domain ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: 'center'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-3xl font-bold">
                    {formatTime(totalMinutes)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {viewMode === 'daily' ? 'Today' : 
                     viewMode === 'weekly' ? 'This Week' : 
                     'This Month'}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-80 h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {chartData.map((entry, index) => (
                <div
                  key={entry.domain}
                  className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                    hoveredSite === entry.domain ? 'bg-gray-100 scale-105' : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setHoveredSite(entry.domain)}
                  onMouseLeave={() => setHoveredSite(null)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-grow">
                    <div className="font-medium">{entry.domain}</div>
                    <div className="text-sm text-gray-500">
                      {formatTime(entry.minutes)} ({Math.round((entry.minutes / totalMinutes) * 100)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this to your global CSS file


export default AnalyticsModal;