import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DbParkingCondition, DbPointOfInterest } from '@/types/database';

interface SubmitReportData {
  latitude: number;
  longitude: number;
  address: string;
  parkingCondition: DbParkingCondition;
  pointsOfInterest: DbPointOfInterest[];
  otherPoiText?: string;
  comments?: string;
  email?: string;
  phone?: string;
  photoFile?: File;
}

interface UseSubmitReportReturn {
  submit: (data: SubmitReportData) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

export function useSubmitReport(): UseSubmitReportReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `submissions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('submission-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('submission-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading photo:', err);
      return null;
    }
  };

  const submit = async (data: SubmitReportData): Promise<{ success: boolean; error?: string }> => {
    setIsSubmitting(true);

    try {
      let photoUrl: string | undefined;

      // Upload photo if provided
      if (data.photoFile) {
        const uploadedUrl = await uploadPhoto(data.photoFile);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      // Insert submission
      const { error: insertError } = await supabase
        .from('bicycle_submissions')
        .insert({
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          parking_condition: data.parkingCondition,
          points_of_interest: data.pointsOfInterest,
          other_poi_text: data.otherPoiText || null,
          comments: data.comments || null,
          email: data.email || null,
          phone: data.phone || null,
          photo_url: photoUrl || null,
        });

      if (insertError) throw insertError;

      return { success: true };
    } catch (err) {
      console.error('Error submitting report:', err);
      return { success: false, error: 'שגיאה בשליחת הדיווח. נא לנסות שוב.' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
