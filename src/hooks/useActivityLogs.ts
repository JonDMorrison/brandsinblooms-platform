import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useSite } from '@/src/hooks/useSite'
import { Tables } from '@/src/lib/database/types'

type ActivityLog = Tables<'activity_logs'>

export function useActivityLogs(limit = 10) {
  const { site } = useSite()

  return useQuery<ActivityLog[], Error>({
    queryKey: ['activity-logs', site?.id, limit],
    queryFn: async () => {
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
    enabled: !!site?.id,
    staleTime: 30000, // 30 seconds
  })
}