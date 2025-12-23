export type ParkingCondition = 
  | 'exists_need_more' 
  | 'none_exists' 
  | 'nearby_not_exact';

export type PointOfInterest = 
  | 'cultural' 
  | 'educational' 
  | 'health' 
  | 'commercial' 
  | 'transport' 
  | 'park' 
  | 'other';

export type SubmissionStatus = 'pending' | 'approved' | 'hidden';

export interface BicycleSubmission {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  email: string;
  phone: string;
  photoUrl?: string;
  parkingCondition: ParkingCondition;
  pointsOfInterest: PointOfInterest[];
  otherPointOfInterest?: string;
  comments?: string;
  status: SubmissionStatus;
  createdAt: Date;
}

export interface MapPosition {
  lat: number;
  lng: number;
}

export const PARKING_CONDITIONS: Record<ParkingCondition, string> = {
  exists_need_more: 'קיימות עמדות חניה לאופניים במיקום זה, אך יש צורך בעמדות נוספות',
  none_exists: 'אין עמדות חניה לאופניים במיקום זה',
  nearby_not_exact: 'קיימות עמדות חניה לאופניים בקרבת מקום, אך לא בנקודה המדויקת',
};

export const POINTS_OF_INTEREST: Record<PointOfInterest, string> = {
  cultural: 'מוסד תרבות',
  educational: 'מוסד חינוכי',
  health: 'מוסד בריאות',
  commercial: 'אזור מסחרי',
  transport: 'צומת תחבורה ציבורית',
  park: 'פארק / מרחב ציבורי',
  other: 'אחר',
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: 'ממתין לאישור',
  approved: 'מאושר',
  hidden: 'מוסתר',
};
