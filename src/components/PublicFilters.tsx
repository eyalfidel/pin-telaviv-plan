import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  DbParkingCondition, 
  DbPointOfInterest,
  PARKING_CONDITIONS_LABELS, 
  POINTS_OF_INTEREST_LABELS 
} from '@/types/database';

interface FiltersState {
  parkingConditions: DbParkingCondition[];
  pointsOfInterest: DbPointOfInterest[];
}

interface PublicFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FiltersState;
  onFilterChange: (filters: Partial<FiltersState>) => void;
  onClearFilters: () => void;
}

export default function PublicFilters({ 
  isOpen, 
  onClose, 
  filters, 
  onFilterChange, 
  onClearFilters 
}: PublicFiltersProps) {
  const toggleParkingCondition = (condition: DbParkingCondition) => {
    const newConditions = filters.parkingConditions.includes(condition)
      ? filters.parkingConditions.filter((c) => c !== condition)
      : [...filters.parkingConditions, condition];
    onFilterChange({ parkingConditions: newConditions });
  };

  const togglePointOfInterest = (poi: DbPointOfInterest) => {
    const newPOIs = filters.pointsOfInterest.includes(poi)
      ? filters.pointsOfInterest.filter((p) => p !== poi)
      : [...filters.pointsOfInterest, poi];
    onFilterChange({ pointsOfInterest: newPOIs });
  };

  const hasActiveFilters = filters.parkingConditions.length > 0 || filters.pointsOfInterest.length > 0;

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-[1000] w-80 bg-card rounded-lg shadow-civic-lg border border-border animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">סינון מיקומים</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
        {/* Parking Conditions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            מצב חניה קיים
          </Label>
          <div className="space-y-2">
            {(Object.entries(PARKING_CONDITIONS_LABELS) as [DbParkingCondition, string][]).map(([key, label]) => (
              <div key={key} className="flex items-start gap-3">
                <Checkbox
                  id={`filter-${key}`}
                  checked={filters.parkingConditions.includes(key)}
                  onCheckedChange={() => toggleParkingCondition(key)}
                />
                <Label 
                  htmlFor={`filter-${key}`} 
                  className="text-xs text-muted-foreground leading-tight cursor-pointer"
                >
                  {label.split(',')[0]}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Points of Interest */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            סוג נקודת עניין
          </Label>
          <div className="space-y-2">
            {(Object.entries(POINTS_OF_INTEREST_LABELS) as [DbPointOfInterest, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={`filter-poi-${key}`}
                  checked={filters.pointsOfInterest.includes(key)}
                  onCheckedChange={() => togglePointOfInterest(key)}
                />
                <Label 
                  htmlFor={`filter-poi-${key}`} 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      {hasActiveFilters && (
        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="w-full"
          >
            נקה סינונים
          </Button>
        </div>
      )}
    </div>
  );
}
