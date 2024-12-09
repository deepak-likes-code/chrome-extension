import React from 'react';
import { PieChart } from 'lucide-react';

interface AnalyticsIconProps {
  onClick: () => void;
}

const AnalyticsIcon: React.FC<AnalyticsIconProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200"
      title="View Analytics"
    >
      <PieChart className="w-6 h-6 text-white" />
    </button>
  );
};

export default AnalyticsIcon;