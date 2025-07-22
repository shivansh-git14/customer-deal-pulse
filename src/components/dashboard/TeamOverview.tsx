import React, { useState, useEffect } from 'react';
import { RepInsightsPanel } from './RepInsightsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, TrendingDown, Minus, MessageSquare, Eye } from 'lucide-react';
import { DashboardFilters } from '@/hooks/useDashboardData';
import { useApi } from '@/hooks/useApi';
import { getTeamMetrics } from '@/lib/api';
import { formatCurrency, getTargetTrend, getMomentumBadge, getRiskBadge, getPerformanceColor } from '@/lib/utils';

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
  avg_deal_size: number;
}

const TrendIcon = ({ trend }: { trend: string }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3 text-success" />;
    case 'down':
      return <TrendingDown className="h-3 w-3 text-danger" />;
    default:
      return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
};

export const TeamOverview = ({ filters }: TeamOverviewProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { data: teamData, isLoading, execute: fetchTeamMetrics } = useApi<TeamMetrics[]>(() => getTeamMetrics(filters), false);

  useEffect(() => {
    if (filters) {
      fetchTeamMetrics(filters);
    }
  }, [filters, fetchTeamMetrics]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Users className="h-5 w-5 text-primary" />
            Team Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
              {teamData && teamData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No team data available for the selected filters
                  </TableCell>
                </TableRow>
              ) : (
                teamData && teamData.map((team, index) => (
                  <React.Fragment key={team.team_name}>
                    <TableRow
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${expandedIndex === index ? 'bg-muted/10' : ''}`}
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      aria-expanded={expandedIndex === index}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpandedIndex(expandedIndex === index ? null : index); }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-1">
                              {team.team_name}
                              <span className={`ml-2 transition-transform ${expandedIndex === index ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                            </div>
                            <div className="text-sm text-muted-foreground">{team.team_size} reps</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{formatCurrency(team.revenue)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendIcon trend={getTargetTrend(team.target_percentage)} />
                          <span>{team.target_percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{team.conversion_rate.toFixed(1)}%</TableCell>
                      <TableCell>{team.efficiency.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getMomentumBadge(team.momentum)}>{team.momentum}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRiskBadge(team.risk_level)}>{team.risk_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`px-2 py-1 rounded-md text-xs font-medium text-center ${getPerformanceColor(team.performance_score)}`}>
                          {team.performance_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-8">
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            Nudge
                          </Button>
                          <Button variant="outline" size="sm" className="h-8">
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedIndex === index && (
                      <TableRow className="bg-muted/10 hover:bg-muted/20">
                        <TableCell colSpan={9}>
                          <RepInsightsPanel teamName={team.team_name} filters={filters} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};