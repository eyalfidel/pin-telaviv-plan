import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSubmissionStore } from '@/store/submissionStore';
import { BicycleSubmission } from '@/types/submission';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon for bicycle parking
const createBicycleIcon = (isActive: boolean = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative">
        <div class="${isActive ? 'animate-pulse' : ''}" style="
          width: 32px;
          height: 32px;
          background: ${isActive ? 'hsl(180, 45%, 45%)' : 'hsl(207, 70%, 45%)'};
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

interface BicycleMapProps {
  onMarkerClick?: (submission: BicycleSubmission) => void;
  showAllSubmissions?: boolean;
}

export default function BicycleMap({ onMarkerClick, showAllSubmissions = false }: BicycleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const pendingMarkerRef = useRef<L.Marker | null>(null);

  const { 
    submissions,
    getFilteredSubmissions, 
    openSubmissionPanel, 
    pendingLocation,
    selectedSubmission 
  } = useSubmissionStore();

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

    // Handle map click to drop pin
    mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
      openSubmissionPanel(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [openSubmissionPanel]);

  // Update markers when submissions or filters change
  useEffect(() => {
    if (!markersRef.current || !mapRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Get submissions to display
    const displaySubmissions = showAllSubmissions 
      ? submissions 
      : getFilteredSubmissions();

    // Add markers for each submission
    displaySubmissions.forEach((submission) => {
      const isSelected = selectedSubmission?.id === submission.id;
      const marker = L.marker([submission.latitude, submission.longitude], {
        icon: createBicycleIcon(isSelected),
      });

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <strong style="font-size: 14px;">${submission.address}</strong>
          <p style="margin: 8px 0; font-size: 12px; color: #666;">
            ${submission.comments || 'No additional comments'}
          </p>
          <span style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            background: ${submission.status === 'approved' ? '#dcfce7' : submission.status === 'pending' ? '#fef3c7' : '#f3f4f6'};
            color: ${submission.status === 'approved' ? '#166534' : submission.status === 'pending' ? '#92400e' : '#6b7280'};
          ">
            ${submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
          </span>
        </div>
      `);

      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(submission);
        }
      });

      marker.addTo(markersRef.current!);
    });
  }, [submissions, getFilteredSubmissions, selectedSubmission, onMarkerClick, showAllSubmissions]);

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
    <div ref={mapContainer} className="w-full h-full" />
  );
}
