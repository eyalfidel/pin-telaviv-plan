import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import L from 'leaflet';
import { HeatLayer } from 'leaflet.heat';
import PublicMap from '@/components/PublicMap';
import { AdminSubmission } from '@/types/database';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haversineDistanceMeters, dampingWeight } from '@/lib/geo';

interface AdminHeatmapViewProps {
  submissions: AdminSubmission[];
  onMarkerClick: (submission: AdminSubmission) => void;
}

interface DockingStation {
  latitude: number;
  longitude: number;
}

const HEAT_OPTIONS = {
  radius: 28,
  blur: 20,
  maxZoom: 17,
  max: 1.0,
  gradient: {
    0.25: 'hsl(199, 89%, 48%)', // floor weight (heavily dampened) - blue
    0.4: 'hsl(142, 70%, 40%)', // green
    0.6: 'hsl(48, 96%, 53%)', // yellow
    0.8: 'hsl(24, 95%, 53%)', // orange
    1.0: 'hsl(0, 70%, 50%)', // undampened hotspot - red
  },
};

// Admin-only heatmap view: identifies demand hotspots, but dampens a
// submission's weight the closer it is to an existing bicycle docking
// station in a private residential yard - a request right next to one is
// still a real signal, just a weaker one than a request with no nearby
// alternative at all.
export default function AdminHeatmapView({ submissions, onMarkerClick }: AdminHeatmapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<HeatLayer | null>(null);
  const [stations, setStations] = useState<DockingStation[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [dampingEnabled, setDampingEnabled] = useState(true);

  // Stable identity so PublicMap's map-init effect doesn't re-run (and
  // rebuild the whole Leaflet map) on every AdminHeatmapView re-render.
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    heatLayerRef.current = new HeatLayer([], HEAT_OPTIONS).addTo(map);
  }, []);

  // The dampening calculation needs the docking stations up front, not
  // lazily like AdminMapView's optional reference layer - it's the whole
  // point of this view, so fetch it eagerly.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('bicycle_docking_private_yards').select('id, latitude, longitude');
      if (cancelled) return;
      setIsLoadingStations(false);
      if (error) {
        toast.error('שגיאה בטעינת נתוני עמדות העגינה: ' + error.message);
        return;
      }
      setStations(data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nearest-docking-station distance per submission, and the raw vs.
  // dampened weight derived from it. Brute-force N x ~2300 distance checks
  // is fine at this data size - no spatial index needed.
  const weightedPoints = useMemo(() => {
    return submissions.map((s) => {
      let nearest = Infinity;
      for (const station of stations) {
        const d = haversineDistanceMeters(s.latitude, s.longitude, station.latitude, station.longitude);
        if (d < nearest) nearest = d;
      }
      const weight = stations.length === 0 ? 1 : dampingWeight(nearest);
      return { lat: s.latitude, lng: s.longitude, weight };
    });
  }, [submissions, stations]);

  // Mutate the existing heat layer's points in place instead of rebuilding
  // it on every toggle/data change - avoids flicker and keeps its position
  // in the layer stack.
  useEffect(() => {
    if (!heatLayerRef.current) return;
    const points: Array<[number, number, number]> = weightedPoints.map((p) => [
      p.lat,
      p.lng,
      dampingEnabled ? p.weight : 1,
    ]);
    heatLayerRef.current.setLatLngs(points);
  }, [weightedPoints, dampingEnabled]);

  return (
    <div className="absolute inset-0">
      <PublicMap
        submissions={submissions}
        onMarkerClick={(submission) => onMarkerClick(submission as AdminSubmission)}
        emptyMessage="לא נמצאו דיווחים התואמים את הסינון"
        onMapReady={handleMapReady}
      />

      <div className="absolute top-3 left-3 z-[500] flex flex-col items-start gap-2">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border p-3 max-w-[220px]">
          <p className="text-xs font-semibold text-foreground mb-1">עוצמת ביקוש</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            אדום = ביקוש גבוה, לא מנוכה. כחול = ביקוש מוחלש כי קיימת עמדת עגינה קרובה.
          </p>
        </div>

        <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border px-3 py-2 flex items-center gap-2">
          <Switch
            id="damping-toggle"
            checked={dampingEnabled}
            disabled={isLoadingStations}
            onCheckedChange={setDampingEnabled}
          />
          <Label htmlFor="damping-toggle" className="text-xs font-medium text-foreground cursor-pointer">
            {isLoadingStations ? 'טוען נתוני עמדות עגינה...' : 'דעיכה לפי קרבה לעמדות עגינה קיימות'}
          </Label>
        </div>
      </div>
    </div>
  );
}
