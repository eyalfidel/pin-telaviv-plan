import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PublicSubmission, PARKING_CONDITIONS_LABELS } from '@/types/database';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon for bicycle parking
const createBicycleIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative">
        <div style="
          width: 32px;
          height: 32px;
          background: hsl(207, 70%, 45%);
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
  onMapClick: (lat: number, lng: number) => void;
}

export default function PublicMap({ submissions, pendingLocation, onMapClick }: PublicMapProps) {
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

    // Handle map click to drop pin
    mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
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
        icon: createBicycleIcon(),
      });

      // Public popup - no contact info, no status
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <strong style="font-size: 14px;">${submission.address}</strong>
          <p style="margin: 8px 0; font-size: 12px; color: #666;">
            ${submission.comments || 'אין הערות נוספות'}
          </p>
          <p style="margin: 4px 0; font-size: 11px; color: #888;">
            ${PARKING_CONDITIONS_LABELS[submission.parkingCondition].split(',')[0]}
          </p>
          <p style="margin: 4px 0; font-size: 10px; color: #aaa;">
            ${submission.createdAt.toLocaleDateString('he-IL')}
          </p>
        </div>
      `);

      marker.addTo(markersRef.current!);
    });
  }, [submissions]);

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

  return <div ref={mapContainer} className="w-full h-full" />;
}
