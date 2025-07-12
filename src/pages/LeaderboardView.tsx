import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { useDashboard } from '@/contexts/DashboardContext';

export function LeaderboardView() {
  const { filters } = useDashboard();

  return (
    <div className="space-y-8">
      <Leaderboard filters={filters} />
    </div>
  );
}
