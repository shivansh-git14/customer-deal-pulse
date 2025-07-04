import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DashboardFilters } from '@/hooks/useDashboardData';
import { supabase } from '@/integrations/supabase/client';

interface TeamOverviewProps {
  filters: DashboardFilters;
}

interface TeamMetrics {
  team_name: string;
  team_size: number;
  revenue: number;
  target: number;
  target_percentage: number;
  conversion_rate: number;
  efficiency: number;
  momentum: 'Accelerating' | 'Improving' | 'Stable' | 'Declining';
  risk_level: 'Low Risk' | 'Medium Risk' | 'High Risk';
  performance_score: number;
}

export const TeamOverview = ({ filters }: TeamOverviewProps) => {
  const [teamData, setTeamData] = useState<TeamMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data based on the available managers and realistic metrics
  const mockTeamData: TeamMetrics[] = [
    {
      team_name: "Sarah Johnson Team",
      team_size: 4,
      revenue: 394000,
      target: 315000,
      target_percentage: 125,
      conversion_rate: 27.2,
      efficiency: 7.8,
      momentum: 'Accelerating',
      risk_level: 'Low Risk',
      performance_score: 92
    },
    {
      team_name: "Michael Chen Team", 
      team_size: 3,
      revenue: 247000,
      target: 252000,
      target_percentage: 98,
      conversion_rate: 21.8,
      efficiency: 9.6,
      momentum: 'Improving',
      risk_level: 'Medium Risk',
      performance_score: 78
    },
    {
      team_name: "Emily Davis Team",
      team_size: 2,
      revenue: 152000,
      target: 178000,
      target_percentage: 85,
      conversion_rate: 18.5,
      efficiency: 12.1,
      momentum: 'Stable',
      risk_level: 'High Risk',
      performance_score: 65
    },
    {
      team_name: "Robert Wilson Team",
      team_size: 3,
      revenue: 268000,
      target: 255000,
      target_percentage: 105,
      conversion_rate: 24.1,
      efficiency: 8.9,
      momentum: 'Stable',
      risk_level: 'Low Risk',
      performance_score: 84
    }
  ];

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getTargetTrend = (percentage: number) => {
    if (percentage >= 100) return 'up';
    if (percentage >= 90) return 'neutral';
    return 'down';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-success" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-danger" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getMomentumBadge = (momentum: string) => {
    const variants = {
      'Accelerating': 'bg-success/10 text-success border-success/20',
      'Improving': 'bg-info/10 text-info border-info/20',
      'Stable': 'bg-muted text-muted-foreground',
      'Declining': 'bg-danger/10 text-danger border-danger/20'
    };
    return variants[momentum as keyof typeof variants] || variants.Stable;
  };

  const getRiskBadge = (risk: string) => {
    const variants = {
      'Low Risk': 'bg-success/10 text-success border-success/20',
      'Medium Risk': 'bg-warning/10 text-warning border-warning/20',
      'High Risk': 'bg-danger/10 text-danger border-danger/20'
    };
    return variants[risk as keyof typeof variants] || variants['Low Risk'];
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'bg-success text-success-foreground';
    if (score >= 70) return 'bg-warning text-warning-foreground';
    return 'bg-danger text-danger-foreground';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <Users className="h-5 w-5 text-primary" />
          Team Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-foreground">Team</TableHead>
                <TableHead className="font-semibold text-foreground">Revenue</TableHead>
                <TableHead className="font-semibold text-foreground">Target %</TableHead>
                <TableHead className="font-semibold text-foreground">Conversion</TableHead>
                <TableHead className="font-semibold text-foreground">Efficiency</TableHead>
                <TableHead className="font-semibold text-foreground">Momentum</TableHead>
                <TableHead className="font-semibold text-foreground">Risk Level</TableHead>
                <TableHead className="font-semibold text-foreground">Performance</TableHead>
                <TableHead className="font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTeamData.map((team, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{team.team_name}</div>
                        <div className="text-sm text-muted-foreground">{team.team_size} reps</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{formatCurrency(team.revenue)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${
                        team.target_percentage >= 100 ? 'text-success' : 
                        team.target_percentage >= 90 ? 'text-warning' : 'text-danger'
                      }`}>
                        {team.target_percentage}%
                      </span>
                      {getTrendIcon(getTargetTrend(team.target_percentage))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground">{team.conversion_rate}%</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground">{team.efficiency} touches/opp</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getMomentumBadge(team.momentum)}>
                      {team.momentum}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRiskBadge(team.risk_level)}>
                      {team.risk_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${getPerformanceColor(team.performance_score)}`}>
                      {team.performance_score}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MessageSquare className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};