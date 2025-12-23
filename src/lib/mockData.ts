import { BicycleSubmission, ParkingCondition, PointOfInterest } from '@/types/submission';

// Mock data for demonstration - will be replaced with Supabase
export const mockSubmissions: BicycleSubmission[] = [
  {
    id: '1',
    latitude: 32.0853,
    longitude: 34.7818,
    address: 'Rothschild Boulevard 45, Tel Aviv–Yafo',
    email: 'user1@example.com',
    phone: '050-1234567',
    parkingCondition: 'exists_need_more',
    pointsOfInterest: ['commercial', 'cultural'],
    comments: 'High foot traffic area, many cyclists pass through here daily.',
    status: 'approved',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    latitude: 32.0731,
    longitude: 34.7925,
    address: 'Dizengoff Square, Tel Aviv–Yafo',
    email: 'user2@example.com',
    phone: '052-9876543',
    parkingCondition: 'none_exists',
    pointsOfInterest: ['commercial', 'transport'],
    comments: 'Central location with no bicycle parking available.',
    status: 'approved',
    createdAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    latitude: 32.0636,
    longitude: 34.7736,
    address: 'Neve Tzedek, Shabazi Street 15, Tel Aviv–Yafo',
    email: 'user3@example.com',
    phone: '054-5555555',
    parkingCondition: 'nearby_not_exact',
    pointsOfInterest: ['cultural', 'commercial'],
    comments: 'Popular tourist and local area.',
    status: 'pending',
    createdAt: new Date('2024-01-20'),
  },
];

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
