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
  exists_need_more: 'There are existing bicycle parking facilities at this exact spot, but additional facilities are needed',
  none_exists: 'There are no bicycle parking facilities at this location',
  nearby_not_exact: 'There are bicycle parking facilities nearby (within short walking distance), but not at this exact spot',
};

export const POINTS_OF_INTEREST: Record<PointOfInterest, string> = {
  cultural: 'Cultural institution',
  educational: 'Educational institution',
  health: 'Health institution',
  commercial: 'Commercial area',
  transport: 'Public transport hub',
  park: 'Park / public space',
  other: 'Other',
};
