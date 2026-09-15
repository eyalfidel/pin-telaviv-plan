import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PublicSubmission, PARKING_CONDITIONS_LABELS, DbSubmissionStatus } from '@/types/database';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Status colors for markers (ordered: pending=yellow, in_review=blue, approved=green, rejected=red, hidden=gray)
// Exported so other map views (e.g. the admin dashboard's map legend) can
// reuse the same colors instead of redefining them.
export const STATUS_COLORS: Record<DbSubmissionStatus, string> = {
  pending: 'hsl(48, 96%, 53%)',      // Yellow - pending
  in_review: 'hsl(207, 70%, 45%)',   // Blue - in review
  approved: 'hsl(142, 70%, 40%)',    // Green - approved
  rejected: 'hsl(0, 70%, 50%)',      // Red - rejected
  hidden: 'hsl(0, 0%, 50%)',         // Gray - hidden
};

// Status labels in Hebrew
const STATUS_LABELS: Record<DbSubmissionStatus, string> = {
  pending: 'ממתין לאישור במערכת',
  in_review: 'הבקשה בבדיקה',
  approved: 'הבקשה אושרה',
  rejected: 'הבקשה נדחתה',
  hidden: 'מוסתר',
};

// Custom marker icon for bicycle parking with status color
const createBicycleIcon = (status: DbSubmissionStatus) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.approved;
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative">
        <div style="
          width: 32px;
          height: 32px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <div style="
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            font-size: 14px;
          ">🚲</div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Pending location marker
const pendingIcon = L.divIcon({
  className: 'pending-marker',
  html: `
    <div class="relative">
      <div class="animate-bounce" style="
        width: 40px;
        height: 40px;
        background: hsl(38, 92%, 50%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
        <div style="
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 18px;
        ">📍</div>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

interface PublicMapProps {
  submissions: PublicSubmission[];
  pendingLocation?: { lat: number; lng: number } | null;
  // Optional: the public map uses this to drop a pin and open the report
  // form. The admin map view omits it - admins shouldn't create reports
  // by clicking the map.
  onMapClick?: (lat: number, lng: number) => void;
  // Optional: fires in addition to the normal popup when a marker is
  // clicked. Used by the admin map view to open the edit dialog for that
  // submission.
  onMarkerClick?: (submission: PublicSubmission) => void;
  // Optional centered overlay shown when there are zero submissions to
  // display. Left undefined by the public page, so its behavior is
  // unchanged; the admin map view opts in, since an empty admin map
  // always means "the current filters matched nothing."
  emptyMessage?: string;
}

export default function PublicMap({ submissions, pendingLocation, onMapClick, onMarkerClick, emptyMessage }: PublicMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const pendingMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Tel Aviv coordinates
    const telAvivCenter: L.LatLngExpression = [32.0853, 34.7818];

    mapRef.current = L.map(mapContainer.current, {
      center: telAvivCenter,
      zoom: 14,
      zoomControl: false,
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Initialize markers layer group
    markersRef.current = L.layerGroup().addTo(mapRef.current);

    // Handle map click to drop pin (public map only - onMapClick is
    // omitted in the admin map view)
    mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onMapClick]);

  // Update markers when submissions change
  useEffect(() => {
    if (!markersRef.current || !mapRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Add markers for each submission
    submissions.forEach((submission) => {
      const marker = L.marker([submission.latitude, submission.longitude], {
        icon: createBicycleIcon(submission.status),
      });

      const statusLabel = STATUS_LABELS[submission.status] || submission.status;
      const statusColor = STATUS_COLORS[submission.status] || STATUS_COLORS.approved;

      // Public popup with status indicator, photo, and admin response
      const photoHtml = submission.photoUrl ? `
        <div style="margin: 8px 0;">
          <a href="${submission.photoUrl}" target="_blank" rel="noopener noreferrer">
            <img src="${submission.photoUrl}" alt="תמונה" style="
              width: 100%;
              max-height: 120px;
              object-fit: cover;
              border-radius: 8px;
              cursor: pointer;
              border: 1px solid #e5e5e5;
            " />
          </a>
        </div>
      ` : '';

      const adminResponseHtml = submission.adminResponse ? `
        <div style="
          margin: 8px 0;
          padding: 8px;
          background: #f0f9ff;
          border-radius: 8px;
          border-right: 3px solid ${statusColor};
        ">
          <p style="margin: 0; font-size: 11px; color: #0369a1; font-weight: 500;">
            <span style="background: #dbeafe; padding: 1px 6px; border-radius: 4px; font-size: 10px;">נוסף על ידי הצוות</span>
          </p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #0c4a6e;">${submission.adminResponse}</p>
        </div>
      ` : '';

      const adminPhotoHtml = submission.adminPhotoUrl ? `
        <div style="margin: 8px 0;">
          <p style="margin: 0 0 4px; font-size: 11px;">
            <span style="background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">מצב סופי</span>
          </p>
          <a href="${submission.adminPhotoUrl}" target="_blank" rel="noopener noreferrer">
            <img src="${submission.adminPhotoUrl}" alt="מצב סופי" style="
              width: 100%;
              max-height: 120px;
              object-fit: cover;
              border-radius: 8px;
              cursor: pointer;
              border: 1px solid #bbf7d0;
            " />
          </a>
        </div>
      ` : '';

      const reporterHtml = submission.reporterName ? `
        <p style="margin: 4px 0; font-size: 11px; color: #666;">
          <strong>מדווח:</strong> ${submission.reporterName}
        </p>
      ` : '';

      marker.bindPopup(`
        <div style="min-width: 220px; max-width: 280px;">
          <strong style="font-size: 14px;">${submission.address}</strong>
          ${reporterHtml}
          <p style="margin: 8px 0; font-size: 12px; color: #666;">
            ${submission.comments || 'אין הערות נוספות'}
          </p>
          <p style="margin: 4px 0; font-size: 11px; color: #888;">
            ${PARKING_CONDITIONS_LABELS[submission.parkingCondition]}
          </p>
          ${photoHtml}
          <span style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            background: ${statusColor};
            color: white;
            margin: 4px 0;
          ">
            ${statusLabel}
          </span>
          ${adminResponseHtml}
          ${adminPhotoHtml}
          <p style="margin: 4px 0; font-size: 10px; color: #aaa;">
            ${submission.createdAt.toLocaleDateString('he-IL')}
          </p>
        </div>
      `);

      // Admin map view: also open the edit dialog for this submission on
      // click, alongside the normal popup.
      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(submission));
      }

      marker.addTo(markersRef.current!);
    });
  }, [submissions, onMarkerClick]);

  // Handle pending location marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing pending marker
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    // Add new pending marker if location exists
    if (pendingLocation) {
      pendingMarkerRef.current = L.marker([pendingLocation.lat, pendingLocation.lng], {
        icon: pendingIcon,
      }).addTo(mapRef.current);

      // Pan to the pending location
      mapRef.current.panTo([pendingLocation.lat, pendingLocation.lng]);
    }
  }, [pendingLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {emptyMessage && submissions.length === 0 && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
          <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border px-4 py-3 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        </div>
      )}
    </div>
  );
}
