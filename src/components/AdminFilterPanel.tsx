import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DbParkingCondition,
  DbPointOfInterest,
  PARKING_CONDITIONS_LABELS,
  POINTS_OF_INTEREST_LABELS,
} from '@/types/database';

interface FiltersState {
  parkingConditions: DbParkingCondition[];
  pointsOfInterest: DbPointOfInterest[];
}

interface AdminFilterPanelProps {
  filters: FiltersState;
  onFilterChange: (filters: Partial<FiltersState>) => void;
  onClearFilters: () => void;
}

// Admin dashboard's compact, always-inline counterpart to the public
// map's PublicFilters drawer. Same filter dimensions/labels, but rendered
// as a bounded card in the dashboard's normal layout flow instead of an
// absolutely-positioned floating panel (which only makes sense over a
// full-viewport map).
export default function AdminFilterPanel({ filters, onFilterChange, onClearFilters }: AdminFilterPanelProps) {
  const toggleParkingCondition = (condition: DbParkingCondition) => {
    const next = filters.parkingConditions.includes(condition)
      ? filters.parkingConditions.filter((c) => c !== condition)
      : [...filters.parkingConditions, condition];
    onFilterChange({ parkingConditions: next });
  };

  const togglePointOfInterest = (poi: DbPointOfInterest) => {
    const next = filters.pointsOfInterest.includes(poi)
      ? filters.pointsOfInterest.filter((p) => p !== poi)
      : [...filters.pointsOfInterest, poi];
    onFilterChange({ pointsOfInterest: next });
  };

  const hasActiveFilters = filters.parkingConditions.length > 0 || filters.pointsOfInterest.length > 0;

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">סינון מתקדם</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>נקה סינונים</Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">מצב חניה קיים</Label>
          <div className="space-y-2">
            {(Object.entries(PARKING_CONDITIONS_LABELS) as [DbParkingCondition, string][]).map(([key, label]) => (
              <div key={key} className="flex items-start gap-3">
                <Checkbox
                  id={`admin-filter-${key}`}
                  checked={filters.parkingConditions.includes(key)}
                  onCheckedChange={() => toggleParkingCondition(key)}
                />
                <Label htmlFor={`admin-filter-${key}`} className="text-xs text-muted-foreground leading-tight cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">סוג נקודת עניין</Label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(POINTS_OF_INTEREST_LABELS) as [DbPointOfInterest, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={`admin-filter-poi-${key}`}
                  checked={filters.pointsOfInterest.includes(key)}
                  onCheckedChange={() => togglePointOfInterest(key)}
                />
                <Label htmlFor={`admin-filter-poi-${key}`} className="text-sm text-muted-foreground cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
