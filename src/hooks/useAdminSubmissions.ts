import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  AdminSubmission, 
  DbSubmissionStatus,
  DbParkingCondition,
  DbPointOfInterest,
  toAdminSubmission 
} from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

export interface SubmissionUpdateData {
  address?: string;
  parkingCondition?: DbParkingCondition;
  pointsOfInterest?: DbPointOfInterest[];
  otherPoiText?: string;
  comments?: string;
  reporterName?: string;
  email?: string;
  phone?: string;
  existingSpacesCount?: number | null;
}

interface UseAdminSubmissionsReturn {
  submissions: AdminSubmission[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateStatus: (id: string, status: DbSubmissionStatus) => Promise<boolean>;
  updateAdminResponse: (id: string, response: string) => Promise<boolean>;
  updateSubmission: (id: string, data: SubmissionUpdateData) => Promise<boolean>;
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

  const updateAdminResponse = async (id: string, response: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('bicycle_submissions')
        .update({ admin_response: response || null })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, adminResponse: response || undefined } : s))
      );

      return true;
    } catch (err) {
      console.error('Error updating admin response:', err);
      return false;
    }
  };

  const updateSubmission = async (id: string, data: SubmissionUpdateData): Promise<boolean> => {
    try {
      const updateData: Record<string, any> = {};
      
      if (data.address !== undefined) updateData.address = data.address;
      if (data.parkingCondition !== undefined) updateData.parking_condition = data.parkingCondition;
      if (data.pointsOfInterest !== undefined) updateData.points_of_interest = data.pointsOfInterest;
      if (data.otherPoiText !== undefined) updateData.other_poi_text = data.otherPoiText || null;
      if (data.comments !== undefined) updateData.comments = data.comments || null;
      if (data.reporterName !== undefined) updateData.reporter_name = data.reporterName || null;
      if (data.email !== undefined) updateData.email = data.email || null;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.existingSpacesCount !== undefined) updateData.existing_spaces_count = data.existingSpacesCount;

      const { error: updateError } = await supabase
        .from('bicycle_submissions')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { 
          ...s, 
          ...data,
        } : s))
      );

      return true;
    } catch (err) {
      console.error('Error updating submission:', err);
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
    updateAdminResponse,
    updateSubmission,
    deleteSubmission,
  };
}
