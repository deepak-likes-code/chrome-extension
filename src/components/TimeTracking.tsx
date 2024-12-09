import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface TimeEntry {
  domain: string;
  duration: number;
  date: string;
  startTime: number;
  lastUpdate: number;
}

const TimeTrackingView = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await chrome.storage.local.get(['timeEntries']);
        setTimeEntries(result.timeEntries || []);
      } catch (error) {
        console.error('Error loading time entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Listen for updates
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.timeEntries) {
        setTimeEntries(changes.timeEntries.newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

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
        minutes: Math.round(duration / 60000), // Convert to minutes
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10); // Top 10 sites
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const chartData = processDataForChart();

  return (
    <div className="p-4">
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setViewMode('daily')}
          className={`px-4 py-2 rounded-lg ${
            viewMode === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setViewMode('weekly')}
          className={`px-4 py-2 rounded-lg ${
            viewMode === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`px-4 py-2 rounded-lg ${
            viewMode === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Monthly
        </button>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              dataKey="domain"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number) => [`${value} min`, 'Time Spent']}
            />
            <Bar dataKey="minutes" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeTrackingView;