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
  reporterName?: string;
  photoFile?: File;
}

interface UseSubmitReportReturn {
  submit: (data: SubmitReportData) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

// Rate limiting constants
const RATE_LIMIT_KEY = 'bicycle_submission_rate_limit';
const RATE_LIMIT_MAX_SUBMISSIONS = 5; // Max submissions per time window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window

interface RateLimitData {
  timestamps: number[];
}

function checkRateLimit(): { allowed: boolean; remainingTime?: number } {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    let data: RateLimitData = { timestamps: [] };

    if (stored) {
      data = JSON.parse(stored);
    }

    // Filter out timestamps older than the window
    data.timestamps = data.timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    if (data.timestamps.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
      const oldestTimestamp = Math.min(...data.timestamps);
      const remainingTime = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp)) / 1000 / 60);
      return { allowed: false, remainingTime };
    }

    return { allowed: true };
  } catch {
    // If localStorage fails, allow the submission
    return { allowed: true };
  }
}

function recordSubmission(): void {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    let data: RateLimitData = { timestamps: [] };

    if (stored) {
      data = JSON.parse(stored);
    }

    // Filter and add new timestamp
    data.timestamps = data.timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );
    data.timestamps.push(now);

    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
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
    // Check rate limit before proceeding
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      return { 
        success: false, 
        error: `הגעת למגבלת הדיווחים. נא לנסות שוב בעוד ${rateLimitCheck.remainingTime} דקות.` 
      };
    }

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
          reporter_name: data.reporterName || null,
          photo_url: photoUrl || null,
        });

      if (insertError) throw insertError;

      // Record successful submission for rate limiting
      recordSubmission();

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
