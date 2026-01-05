// Types that match the database schema
export type DbParkingCondition = 'existing_needs_more' | 'none' | 'nearby';
export type DbPointOfInterest = 'cultural' | 'educational' | 'health' | 'commercial' | 'transport' | 'park' | 'other';
export type DbSubmissionStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'hidden';

export interface DbBicycleSubmission {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  parking_condition: DbParkingCondition;
  points_of_interest: DbPointOfInterest[];
  other_poi_text?: string | null;
  comments?: string | null;
  photo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  reporter_name?: string | null;
  existing_spaces_count?: number | null;
  status: DbSubmissionStatus;
  created_at: string;
  updated_at: string;
}

// Public submission type (includes reporter name, but no email/phone)
export interface PublicSubmission {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  parkingCondition: DbParkingCondition;
  pointsOfInterest: DbPointOfInterest[];
  otherPoiText?: string;
  comments?: string;
  photoUrl?: string;
  reporterName?: string;
  status: DbSubmissionStatus;
  adminResponse?: string;
  createdAt: Date;
}

// Admin submission type (includes contact info)
export interface AdminSubmission extends PublicSubmission {
  email?: string;
  phone?: string;
  reporterName?: string;
  existingSpacesCount?: number;
  updatedAt: Date;
}

// Labels for UI (Hebrew)
// Ordered array for UI display
export const PARKING_CONDITIONS_ORDER: DbParkingCondition[] = [
  'existing_needs_more',
  'nearby',
  'none',
];

export const PARKING_CONDITIONS_LABELS: Record<DbParkingCondition, string> = {
  existing_needs_more: 'קיימות עמדות חניה לאופניים במיקום זה, אך יש צורך בעמדות נוספות',
  nearby: 'קיימות עמדות חניה לאופניים בקרבת מקום, אך לא בנקודה המדויקת',
  none: 'אין עמדות חניה לאופניים במיקום זה',
};

export const POINTS_OF_INTEREST_LABELS: Record<DbPointOfInterest, string> = {
  cultural: 'מוסד תרבות',
  educational: 'מוסד חינוך',
  health: 'מוסד בריאות',
  commercial: 'אזור מסחרי',
  transport: 'מרכז תחבורה ציבורית',
  park: 'פארק / מרחב ציבורי',
  other: 'אחר',
};

export const STATUS_LABELS: Record<DbSubmissionStatus, string> = {
  pending: 'ממתין לאישור במערכת',
  in_review: 'הבקשה התקבלה לבדיקה',
  approved: 'הבקשה אושרה',
  rejected: 'הבקשה נדחתה',
  hidden: 'מוסתר',
};

// Transform database row to public submission
export function toPublicSubmission(row: DbBicycleSubmission & { admin_response?: string | null }): PublicSubmission {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    parkingCondition: row.parking_condition,
    pointsOfInterest: row.points_of_interest || [],
    otherPoiText: row.other_poi_text || undefined,
    comments: row.comments || undefined,
    photoUrl: row.photo_url || undefined,
    reporterName: row.reporter_name || undefined,
    status: row.status,
    adminResponse: row.admin_response || undefined,
    createdAt: new Date(row.created_at),
  };
}

// Transform database row to admin submission
export function toAdminSubmission(row: DbBicycleSubmission): AdminSubmission {
  return {
    ...toPublicSubmission(row),
    email: row.email || undefined,
    phone: row.phone || undefined,
    reporterName: row.reporter_name || undefined,
    existingSpacesCount: row.existing_spaces_count ?? undefined,
    status: row.status,
    updatedAt: new Date(row.updated_at),
  };
}
