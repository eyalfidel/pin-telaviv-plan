import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  PublicSubmission, 
  DbParkingCondition, 
  DbPointOfInterest,
  toPublicSubmission 
} from '@/types/database';

interface SubmissionFilters {
  parkingConditions: DbParkingCondition[];
  pointsOfInterest: DbPointOfInterest[];
}

interface UsePublicSubmissionsReturn {
  submissions: PublicSubmission[];
  isLoading: boolean;
  error: string | null;
  filters: SubmissionFilters;
  setFilters: (filters: Partial<SubmissionFilters>) => void;
  clearFilters: () => void;
  refetch: () => void;
  getFilteredSubmissions: () => PublicSubmission[];
}

export function usePublicSubmissions(): UsePublicSubmissionsReturn {
  const [submissions, setSubmissions] = useState<PublicSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<SubmissionFilters>({
    parkingConditions: [],
    pointsOfInterest: [],
  });

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all submissions except pending ones (no email/phone for privacy)
      const { data, error: fetchError } = await supabase
        .from('bicycle_submissions')
        .select('id, latitude, longitude, address, parking_condition, points_of_interest, other_poi_text, comments, photo_url, created_at, updated_at, status')
        .in('status', ['approved', 'in_review', 'rejected', 'hidden'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const publicSubmissions = (data || []).map((row) => toPublicSubmission(row as any));
      setSubmissions(publicSubmissions);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const setFilters = (newFilters: Partial<SubmissionFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFiltersState({
      parkingConditions: [],
      pointsOfInterest: [],
    });
  };

  const getFilteredSubmissions = useCallback(() => {
    return submissions.filter((submission) => {
      // Filter by parking conditions
      if (filters.parkingConditions.length > 0) {
        if (!filters.parkingConditions.includes(submission.parkingCondition)) {
          return false;
        }
      }

      // Filter by points of interest
      if (filters.pointsOfInterest.length > 0) {
        const hasMatchingPOI = submission.pointsOfInterest.some((poi) =>
          filters.pointsOfInterest.includes(poi)
        );
        if (!hasMatchingPOI) return false;
      }

      return true;
    });
  }, [submissions, filters]);

  return {
    submissions,
    isLoading,
    error,
    filters,
    setFilters,
    clearFilters,
    refetch: fetchSubmissions,
    getFilteredSubmissions,
  };
}
