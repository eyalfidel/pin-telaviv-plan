import { useState } from 'react';
import PublicMap, { STATUS_COLORS } from '@/components/PublicMap';
import { AdminSubmission, DbSubmissionStatus, STATUS_LABELS } from '@/types/database';

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

  return (
    <div className="absolute inset-0">
      <PublicMap
        submissions={submissions}
        onMarkerClick={(submission) => onMarkerClick(submission as AdminSubmission)}
        emptyMessage="לא נמצאו דיווחים התואמים את הסינון"
      />

      <div className="absolute top-3 left-3 z-[500]">
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          🎨 מקרא
        </button>
        {legendOpen && (
          <div className="mt-2 bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border p-3 min-w-[200px] animate-fade-in">
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
      </div>
    </div>
  );
}
