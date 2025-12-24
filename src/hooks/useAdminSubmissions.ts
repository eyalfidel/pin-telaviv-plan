import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  AdminSubmission, 
  DbSubmissionStatus,
  toAdminSubmission 
} from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

interface UseAdminSubmissionsReturn {
  submissions: AdminSubmission[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateStatus: (id: string, status: DbSubmissionStatus) => Promise<boolean>;
  deleteSubmission: (id: string) => Promise<boolean>;
}

export function useAdminSubmissions(): UseAdminSubmissionsReturn {
  const { isAdmin } = useAuth();
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!isAdmin) {
      setSubmissions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Admins can see all submissions including contact info
      const { data, error: fetchError } = await supabase
        .from('bicycle_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const adminSubmissions = (data || []).map((row) => toAdminSubmission(row as any));
      setSubmissions(adminSubmissions);
    } catch (err) {
      console.error('Error fetching admin submissions:', err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const updateStatus = async (id: string, status: DbSubmissionStatus): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('bicycle_submissions')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );

      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      return false;
    }
  };

  const deleteSubmission = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('bicycle_submissions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setSubmissions((prev) => prev.filter((s) => s.id !== id));

      return true;
    } catch (err) {
      console.error('Error deleting submission:', err);
      return false;
    }
  };

  return {
    submissions,
    isLoading,
    error,
    refetch: fetchSubmissions,
    updateStatus,
    deleteSubmission,
  };
}
