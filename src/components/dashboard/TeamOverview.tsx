import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamData } from '@/hooks/useTeamData';
import { TrendingUp, TrendingDown, Users, MessageSquare, Eye } from 'lucide-react';

interface TeamOverviewProps {
  data: TeamData;
}

export const TeamOverview = ({ data }: TeamOverviewProps) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'accelerating':
      case 'improving':
        return <TrendingUp className="h-3 w-3" />;
      case 'declining':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'accelerating':
        return 'bg-[hsl(var(--momentum-accelerating))] text-white';
      case 'improving':
        return 'bg-[hsl(var(--momentum-improving))] text-white';
      case 'stable':
        return 'bg-[hsl(var(--momentum-stable))] text-white';
      case 'declining':
        return 'bg-[hsl(var(--momentum-declining))] text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-[hsl(var(--risk-low))] text-white';
      case 'medium':
        return 'bg-[hsl(var(--risk-medium))] text-white';
      case 'high':
        return 'bg-[hsl(var(--risk-high))] text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'bg-[hsl(var(--performance-excellent))] text-white';
    if (score >= 70) return 'bg-[hsl(var(--performance-good))] text-white';
    if (score >= 50) return 'bg-[hsl(var(--performance-average))] text-white';
    return 'bg-[hsl(var(--performance-poor))] text-white';
  };

  return (
    <div className="space-y-6">
      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teams.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.totalMembers} total members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgPerformance}</div>
            <p className="text-xs text-muted-foreground mt-1">Team performance score</p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Team</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Revenue</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Target %</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Conversion</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Efficiency</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Momentum</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Risk Level</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Performance</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.teams.map((team) => (
                  <tr key={team.manager_id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{team.manager_name} Team</div>
                          <div className="text-sm text-muted-foreground">{team.team_count} reps</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(team.revenue)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className={`font-medium ${team.target_percentage >= 100 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}>
                          {formatPercentage(team.target_percentage)}
                        </span>
                        {team.target_percentage >= 100 ? (
                          <TrendingUp className="h-3 w-3 text-[hsl(var(--success))]" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-[hsl(var(--warning))]" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">{formatPercentage(team.conversion_rate)}</td>
                    <td className="p-4">{team.efficiency.toFixed(1)} touches/opp</td>
                    <td className="p-4">
                      <Badge className={`${getMomentumColor(team.momentum)} capitalize`}>
                        <div className="flex items-center gap-1">
                          {getMomentumIcon(team.momentum)}
                          {team.momentum}
                        </div>
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={`${getRiskColor(team.risk_level)} capitalize`}>
                        {team.risk_level} Risk
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getPerformanceColor(team.performance_score)}`}>
                        {team.performance_score}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};