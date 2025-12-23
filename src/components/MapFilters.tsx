import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useSubmissionStore } from '@/store/submissionStore';
import { PARKING_CONDITIONS, POINTS_OF_INTEREST, ParkingCondition, PointOfInterest } from '@/types/submission';

interface MapFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MapFilters({ isOpen, onClose }: MapFiltersProps) {
  const { filters, setFilters, clearFilters, getFilteredSubmissions } = useSubmissionStore();
  const filteredCount = getFilteredSubmissions().length;

  const toggleParkingCondition = (condition: ParkingCondition) => {
    const current = filters.parkingConditions;
    const updated = current.includes(condition)
      ? current.filter((c) => c !== condition)
      : [...current, condition];
    setFilters({ parkingConditions: updated });
  };

  const togglePointOfInterest = (poi: PointOfInterest) => {
    const current = filters.pointsOfInterest;
    const updated = current.includes(poi)
      ? current.filter((p) => p !== poi)
      : [...current, poi];
    setFilters({ pointsOfInterest: updated });
  };

  const hasActiveFilters = filters.parkingConditions.length > 0 || filters.pointsOfInterest.length > 0;

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 left-4 z-[1000] w-80 max-h-[calc(100vh-120px)] overflow-y-auto bg-card rounded-lg shadow-civic-lg border border-border animate-slide-in-up">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Filter Submissions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredCount} location{filteredCount !== 1 ? 's' : ''} shown
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Parking Conditions */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Parking Conditions</h4>
          <div className="space-y-3">
            {(Object.entries(PARKING_CONDITIONS) as [ParkingCondition, string][]).map(([key, label]) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={filters.parkingConditions.includes(key)}
                  onCheckedChange={() => toggleParkingCondition(key)}
                  className="mt-0.5"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Points of Interest */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Points of Interest</h4>
          <div className="space-y-3">
            {(Object.entries(POINTS_OF_INTEREST) as [PointOfInterest, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={filters.pointsOfInterest.includes(key)}
                  onCheckedChange={() => togglePointOfInterest(key)}
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full"
          >
            Clear All Filters
          </Button>
        )}
      </div>
    </div>
  );
}
