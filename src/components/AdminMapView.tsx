import { useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import PublicMap, { STATUS_COLORS } from '@/components/PublicMap';
import { AdminSubmission, DbSubmissionStatus, STATUS_LABELS } from '@/types/database';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminMapViewProps {
  submissions: AdminSubmission[];
  onMarkerClick: (submission: AdminSubmission) => void;
}

// Admin-side map view for SecureAdminDashboard's "מפה" toggle. Reuses the
// same Leaflet map the public page uses (PublicMap) rather than a second
// implementation - just without click-to-report, and with a click handler
// that opens the existing edit dialog instead.
export default function AdminMapView({ submissions, onMarkerClick }: AdminMapViewProps) {
  const [legendOpen, setLegendOpen] = useState(false);
  const [showDockingLayer, setShowDockingLayer] = useState(false);
  const [isLoadingDocking, setIsLoadingDocking] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const dockingLayerRef = useRef<L.LayerGroup | null>(null);
  const dockingLoadedRef = useRef(false);

  // Stable identity so PublicMap's map-init effect doesn't re-run (and
  // rebuild the whole Leaflet map) on every AdminMapView re-render.
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    dockingLayerRef.current = L.layerGroup();
  }, []);

  const toggleDockingLayer = async (checked: boolean) => {
    setShowDockingLayer(checked);
    if (!mapRef.current || !dockingLayerRef.current) return;

    if (!checked) {
      mapRef.current.removeLayer(dockingLayerRef.current);
      return;
    }

    if (!dockingLoadedRef.current) {
      setIsLoadingDocking(true);
      const { data, error } = await supabase
        .from('bicycle_docking_private_yards')
        .select('id, address, spaces, latitude, longitude');
      setIsLoadingDocking(false);

      if (error) {
        toast.error('שגיאה בטעינת שכבת עמדות העגינה: ' + error.message);
        setShowDockingLayer(false);
        return;
      }

      dockingLoadedRef.current = true;
      (data || []).forEach((station) => {
        const marker = L.circleMarker([station.latitude, station.longitude], {
          radius: 5,
          weight: 2,
          color: '#ffffff',
          fillColor: 'hsl(199, 89%, 48%)',
          fillOpacity: 0.9,
        });
        marker.bindPopup(`
          <div style="min-width: 160px;">
            <strong style="font-size: 13px;">${station.address}</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
              עמדות עגינה: ${station.spaces ?? '-'}
            </p>
          </div>
        `);
        marker.addTo(dockingLayerRef.current!);
      });
    }

    dockingLayerRef.current.addTo(mapRef.current);
  };

  return (
    <div className="absolute inset-0">
      <PublicMap
        submissions={submissions}
        onMarkerClick={(submission) => onMarkerClick(submission as AdminSubmission)}
        emptyMessage="לא נמצאו דיווחים התואמים את הסינון"
        onMapReady={handleMapReady}
      />

      <div className="absolute top-3 left-3 z-[500] flex flex-col items-start gap-2">
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          🎨 מקרא
        </button>
        {legendOpen && (
          <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border p-3 min-w-[200px] animate-fade-in">
            <p className="text-xs font-semibold text-foreground mb-2">סטטוס דיווחים</p>
            {/* Includes "מוסתר" (hidden), unlike the public map's legend -
                admins need to be able to spot hidden pins too. */}
            {(Object.keys(STATUS_COLORS) as DbSubmissionStatus[]).map((status) => (
              <div key={status} className="flex items-center gap-2 py-1">
                <span
                  style={{ background: STATUS_COLORS[status] }}
                  className="w-4 h-4 rounded-full inline-block border border-white shadow-sm"
                />
                <span className="text-xs text-foreground">{STATUS_LABELS[status]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Admin-only reference layer from the municipal GIS, off by
            default. Not shown to the public map at all. */}
        <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border px-3 py-2 flex items-center gap-2">
          <Switch
            id="docking-layer-toggle"
            checked={showDockingLayer}
            disabled={isLoadingDocking}
            onCheckedChange={toggleDockingLayer}
          />
          <Label htmlFor="docking-layer-toggle" className="text-xs font-medium text-foreground cursor-pointer">
            {isLoadingDocking ? 'טוען עמדות עגינה...' : 'עמדות עגינה בחצרות (GIS עירוני)'}
          </Label>
        </div>
      </div>
    </div>
  );
}
