import React, { useState, useEffect } from 'react';
import { RepInsightsPanel } from './RepInsightsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  avg_deal_size: number;
  top_issues?: string[];
  objections_total?: number;
  objections_handled_total?: number;
  objection_handling_rate?: number | null;
  events_with_transcripts?: number;
  negative_events?: number;
  negative_sentiment_rate?: number | null;
  negative_deals_total_value?: number;
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
            salesManagerId: filters.salesManagerId,
            debug: true
          }
        });

        if (error) {
          console.error('Error fetching team metrics:', error);
          return;
        }

        console.log('Team metrics response:', data);
        if (data?.diagnostics) {
          console.log('Team metrics diagnostics:', data.diagnostics);
        }
        
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
                <TableHead className="font-semibold text-foreground">Objection Handling</TableHead>
                <TableHead className="font-semibold text-foreground">Neg. Sentiment</TableHead>
                <TableHead className="font-semibold text-foreground">Top Issues</TableHead>
                <TableHead className="font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                      <TableCell>
                        <div className="min-w-[160px]">
                          {team.objection_handling_rate !== null && team.objection_handling_rate !== undefined && (team.objections_total ?? 0) > 0 ? (
                            <span className="font-medium text-foreground">
                              {team.objection_handling_rate.toFixed(1)}%{' '}
                              <span className="text-muted-foreground font-normal">
                                of {team.objections_total ?? 0} {(team.objections_total ?? 0) === 1 ? 'objection' : 'objections'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[160px]">
                          {team.negative_sentiment_rate !== null && team.negative_sentiment_rate !== undefined && (team.events_with_transcripts ?? 0) > 0 ? (
                            <span className="font-medium text-foreground">
                              {team.negative_sentiment_rate.toFixed(1)}%{' '}
                              <span className="text-muted-foreground font-normal">
                                of {team.events_with_transcripts ?? 0} {(team.events_with_transcripts ?? 0) === 1 ? 'call' : 'calls'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(team.negative_deals_total_value ?? 0)} negative deal value
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[140px]">
                          <div className="flex flex-col gap-1">
                            {(team.top_issues?.filter(Boolean).slice(0, 3) || []).map((issue, i) => (
                              <span
                                key={`${team.team_name}-issue-${i}`}
                                className="inline-flex w-auto self-start items-start px-2 py-0.5 rounded border text-xs text-foreground whitespace-nowrap"
                              >
                                {issue}
                              </span>
                            ))}
                            {(!team.top_issues || team.top_issues.length === 0) && (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </div>
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
                        <TableCell colSpan={8}>
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