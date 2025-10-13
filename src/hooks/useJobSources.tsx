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
  created_at: string;
  updated_at: string;
}

export interface ApplicationStats {
  totalSent: number;
  totalWaiting: number;
  totalRejected: number;
  weeklyGoal: number;
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
        .order('created_at', { ascending: false });

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
        lastUpdated: new Date(data.last_updated),
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateJobSource = async (source: JobSource) => {
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

      await fetchJobSources();
      await updateStats();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateStats = async () => {
    if (!user) return;

    const totalSent = jobSources.reduce((sum, source) => sum + source.sentCount, 0);
    const totalWaiting = jobSources.reduce((sum, source) => sum + source.waitingCount, 0);
    const totalRejected = jobSources.reduce((sum, source) => sum + source.rejectedCount, 0);

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
  };
};
