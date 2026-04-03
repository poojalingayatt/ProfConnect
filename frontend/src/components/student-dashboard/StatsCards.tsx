import React from 'react';
import { StatsCard } from './StatsCard';

interface StatsCardsProps {
  upcomingCount: number;
  completedCount: number;
  followedCount: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  upcomingCount,
  completedCount,
  followedCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <StatsCard title="Upcoming" value={upcomingCount} />
      <StatsCard title="Completed" value={completedCount} />
      <StatsCard title="Followed Faculty" value={followedCount} />
    </div>
  );
};

export default StatsCards;
