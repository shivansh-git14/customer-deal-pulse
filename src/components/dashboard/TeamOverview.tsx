import React, { useState, useEffect } from 'react';
import { RepInsightsPanel } from './RepInsightsPanel';
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
  avg_deal_size: number;
}

export const TeamOverview = ({ filters }: TeamOverviewProps) => {
  // Accordion-style expansion: only one row at a time
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [teamData, setTeamData] = useState<TeamMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMetrics = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching team metrics with filters:', filters);
        
        const { data, error } = await supabase.functions.invoke('team-metrics', {
          body: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            salesManagerId: filters.salesManagerId
          }
        });

        if (error) {
          console.error('Error fetching team metrics:', error);
          return;
        }

        console.log('Team metrics response:', data);
        
        if (data.success) {
          setTeamData(data.data);
        }
      } catch (error) {
        console.error('Error calling team metrics function:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMetrics();
  }, [filters]);

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
              {teamData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No team data available for the selected filters
                  </TableCell>
                </TableRow>
              ) : (
                teamData.map((team, index) => (
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
                          {getTrendIcon(getTargetTrend(team.target_percentage))}
                          {team.target_percentage.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>{team.conversion_rate.toFixed(1)}%</TableCell>
                      <TableCell>{team.efficiency.toFixed(2)}</TableCell>
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
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${getPerformanceColor(team.performance_score)}`}>
                          {team.performance_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedIndex === index && (
                      <TableRow key={`${team.team_name}-details`}>
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