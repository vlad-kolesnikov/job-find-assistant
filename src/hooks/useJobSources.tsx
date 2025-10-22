import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface JobSource {
  id: string;
  user_id: string;
  name: string;
  baseUrl: string;
  filterQuery: string;
  sentCount: number;
  rejectedCount: number;
  waitingCount: number;
  notes: string;
  sortOrder: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStats {
  totalSent: number;
  totalWaiting: number;
  totalRejected: number;
  weeklyGoal: number;
  monthlyGoal: number;
  lastUpdated: Date;
}

export const useJobSources = () => {
  const { user } = useAuth();
  const [jobSources, setJobSources] = useState<JobSource[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJobSources = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const mappedData = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        baseUrl: item.base_url,
        filterQuery: item.filter_query || '',
        sentCount: item.sent_count,
        rejectedCount: item.rejected_count,
        waitingCount: item.waiting_count,
        notes: item.notes || '',
        sortOrder: item.sort_order,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setJobSources(mappedData);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('application_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setStats({
        totalSent: data.total_sent,
        totalWaiting: data.total_waiting,
        totalRejected: data.total_rejected,
        weeklyGoal: data.weekly_goal,
        monthlyGoal: data.monthly_goal,
        lastUpdated: new Date(data.last_updated),
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute totals helper to avoid stale state races
  const computeTotals = (sources: JobSource[]) => ({
    totalSent: sources.reduce((sum, s) => sum + s.sentCount, 0),
    totalWaiting: sources.reduce((sum, s) => sum + s.waitingCount, 0),
    totalRejected: sources.reduce((sum, s) => sum + s.rejectedCount, 0),
  });

  const updateJobSource = async (source: JobSource) => {
    // Optimistically update local state to avoid lost increments on rapid clicks
    let nextSources: JobSource[] = [];
    setJobSources((prev) => {
      nextSources = prev.map((s) => (s.id === source.id ? source : s));
      return nextSources;
    });

    try {
      const { error } = await supabase
        .from('job_sources')
        .update({
          name: source.name,
          base_url: source.baseUrl,
          filter_query: source.filterQuery,
          sent_count: source.sentCount,
          rejected_count: source.rejectedCount,
          waiting_count: source.waitingCount,
          notes: source.notes,
        })
        .eq('id', source.id)
        .eq('user_id', user!.id);

      if (error) throw error;

      // Update stats based on the optimistic state we just applied
      const totals = computeTotals(nextSources);
      await updateStats(totals);
    } catch (error: any) {
      toast.error(error.message);
      // In case of error, refetch to realign local state with server
      await fetchJobSources();
      await fetchStats();
    }
  };

  const addJobSource = async (name: string, baseUrl: string, filterQuery: string = '') => {
    if (!user) return;

    try {
      // Get the max sort_order for the user
      const { data: maxData } = await supabase
        .from('job_sources')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = maxData && maxData.length > 0 ? maxData[0].sort_order + 1 : 1;

      const { error } = await supabase
        .from('job_sources')
        .insert({
          user_id: user.id,
          name,
          base_url: baseUrl,
          filter_query: filterQuery,
          sent_count: 0,
          rejected_count: 0,
          waiting_count: 0,
          notes: '',
          sort_order: nextSortOrder,
        });

      if (error) throw error;

      await fetchJobSources();
      toast.success(`${name} added successfully`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteJobSource = async (id: string, name: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('job_sources')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchJobSources();
      await updateStats();
      toast.success(`${name} removed successfully`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateWeeklyGoal = async (newGoal: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('application_stats')
        .update({
          weekly_goal: newGoal,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchStats();
      toast.success('Weekly goal updated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateMonthlyGoal = async (newGoal: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('application_stats')
        .update({
          monthly_goal: newGoal,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchStats();
      toast.success('Monthly goal updated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const adjustTotals = async (
    deltaSent: number = 0,
    deltaWaiting: number = 0,
    deltaRejected: number = 0,
  ) => {
    if (!user) return;
    if (!stats) {
      await fetchStats();
    }
    const cur = stats || {
      totalSent: 0,
      totalWaiting: 0,
      totalRejected: 0,
      weeklyGoal: 0,
      monthlyGoal: 0,
      lastUpdated: new Date(),
    };

    const next = {
      totalSent: Math.max(0, cur.totalSent + deltaSent),
      totalWaiting: Math.max(0, cur.totalWaiting + deltaWaiting),
      totalRejected: Math.max(0, cur.totalRejected + deltaRejected),
    };

    try {
      const { error } = await supabase
        .from('application_stats')
        .update({
          total_sent: next.totalSent,
          total_waiting: next.totalWaiting,
          total_rejected: next.totalRejected,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (error) throw error;
      setStats((prev) => prev ? { ...prev, ...next, lastUpdated: new Date() } : null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateStats = async (
    totals?: { totalSent: number; totalWaiting: number; totalRejected: number }
  ) => {
    if (!user) return;

    // Use provided totals when available to avoid relying on possibly stale state
    const { totalSent, totalWaiting, totalRejected } =
      totals ?? computeTotals(jobSources);

    try {
      const { error } = await supabase
        .from('application_stats')
        .update({
          total_sent: totalSent,
          total_waiting: totalWaiting,
          total_rejected: totalRejected,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchStats();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const reorderJobSources = async (sourceId: string, destinationId: string) => {
    if (!user) return;

    try {
      const sourceIndex = jobSources.findIndex(s => s.id === sourceId);
      const destIndex = jobSources.findIndex(s => s.id === destinationId);

      if (sourceIndex === -1 || destIndex === -1) return;

      // Reorder locally for instant feedback
      const newSources = [...jobSources];
      const [removed] = newSources.splice(sourceIndex, 1);
      newSources.splice(destIndex, 0, removed);

      // Update sort orders
      const updates = newSources.map((source, index) => ({
        id: source.id,
        sort_order: index + 1,
      }));

      setJobSources(newSources);

      // Update in database
      for (const update of updates) {
        await supabase
          .from('job_sources')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      await fetchJobSources();
    } catch (error: any) {
      toast.error(error.message);
      await fetchJobSources(); // Revert on error
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobSources();
      fetchStats();
    }
  }, [user]);

  return {
    jobSources,
    stats,
    loading,
    updateJobSource,
    addJobSource,
    deleteJobSource,
    updateWeeklyGoal,
    updateMonthlyGoal,
    reorderJobSources,
    adjustTotals,
  };
};
