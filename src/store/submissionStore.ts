import { create } from 'zustand';
import { BicycleSubmission, ParkingCondition, PointOfInterest } from '@/types/submission';
import { mockSubmissions, generateId } from '@/lib/mockData';

interface SubmissionFilters {
  parkingConditions: ParkingCondition[];
  pointsOfInterest: PointOfInterest[];
}

interface SubmissionStore {
  submissions: BicycleSubmission[];
  filters: SubmissionFilters;
  selectedSubmission: BicycleSubmission | null;
  isSubmissionPanelOpen: boolean;
  pendingLocation: { lat: number; lng: number } | null;
  
  // Actions
  addSubmission: (submission: Omit<BicycleSubmission, 'id' | 'createdAt' | 'status'>) => void;
  updateSubmissionStatus: (id: string, status: BicycleSubmission['status']) => void;
  deleteSubmission: (id: string) => void;
  setFilters: (filters: Partial<SubmissionFilters>) => void;
  clearFilters: () => void;
  setSelectedSubmission: (submission: BicycleSubmission | null) => void;
  openSubmissionPanel: (lat: number, lng: number) => void;
  closeSubmissionPanel: () => void;
  getFilteredSubmissions: () => BicycleSubmission[];
}

export const useSubmissionStore = create<SubmissionStore>((set, get) => ({
  submissions: mockSubmissions,
  filters: {
    parkingConditions: [],
    pointsOfInterest: [],
  },
  selectedSubmission: null,
  isSubmissionPanelOpen: false,
  pendingLocation: null,

  addSubmission: (submissionData) => {
    const newSubmission: BicycleSubmission = {
      ...submissionData,
      id: generateId(),
      status: 'pending',
      createdAt: new Date(),
    };
    set((state) => ({
      submissions: [...state.submissions, newSubmission],
      isSubmissionPanelOpen: false,
      pendingLocation: null,
    }));
  },

  updateSubmissionStatus: (id, status) => {
    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === id ? { ...s, status } : s
      ),
    }));
  },

  deleteSubmission: (id) => {
    set((state) => ({
      submissions: state.submissions.filter((s) => s.id !== id),
    }));
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        parkingConditions: [],
        pointsOfInterest: [],
      },
    });
  },

  setSelectedSubmission: (submission) => {
    set({ selectedSubmission: submission });
  },

  openSubmissionPanel: (lat, lng) => {
    set({
      isSubmissionPanelOpen: true,
      pendingLocation: { lat, lng },
      selectedSubmission: null,
    });
  },

  closeSubmissionPanel: () => {
    set({
      isSubmissionPanelOpen: false,
      pendingLocation: null,
    });
  },

  getFilteredSubmissions: () => {
    const { submissions, filters } = get();
    
    return submissions.filter((submission) => {
      // Only show approved submissions on public map
      if (submission.status !== 'approved') return false;
      
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
  },
}));
