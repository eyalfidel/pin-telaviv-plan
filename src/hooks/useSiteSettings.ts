import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSiteSettingsReturn {
  submissionsOpen: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
  setSubmissionsOpen: (open: boolean) => Promise<boolean>;
}

export function useSiteSettings(): UseSiteSettingsReturn {
  const [submissionsOpen, setSubmissionsOpenState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('submissions_open')
      .eq('id', true)
      .maybeSingle();

    if (!error && data) {
      setSubmissionsOpenState(data.submissions_open);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setSubmissionsOpen = async (open: boolean): Promise<boolean> => {
    const { error } = await supabase
      .from('site_settings')
      .update({ submissions_open: open })
      .eq('id', true);

    if (error) {
      console.error('Error updating site settings:', error);
      return false;
    }

    setSubmissionsOpenState(open);
    return true;
  };

  return { submissionsOpen, isLoading, refetch: fetchSettings, setSubmissionsOpen };
}
