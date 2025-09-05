import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { supabase } from '@/lib/supabase/client';
import { useSite } from '@/hooks/useSite';
import { Tables } from '@/lib/database/types';

type ActivityLog = Tables<'activity_logs'>

export function useActivityLogs(limit = 10) {
  const { site } = useSite()

  return useSupabaseQuery<ActivityLog[]>(
    async (signal) => {
      if (!site?.id) {
        return []
      }

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('site_id', site.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching activity logs:', error)
        throw error
      }

      return data || []
    },
    {
      enabled: !!site?.id,
      staleTime: 30000, // 30 seconds
      initialData: [],
    }
  )
}