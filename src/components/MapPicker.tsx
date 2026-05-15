import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search } from 'lucide-react';

// Fix for default marker icon in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Location {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
}

function LocationMarker({ position, setPosition, onLocationSelect }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon}></Marker>
  );
}

function MapUpdater({ center }: { center: Location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 13);
  }, [center, map]);
  return null;
}

export default function MapPicker({ onLocationSelect, initialLocation }: MapPickerProps) {
  const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // New Delhi coordinates as default
  const [position, setPosition] = useState<Location | null>(initialLocation || null);
  const [mapCenter, setMapCenter] = useState<Location>(initialLocation || defaultCenter);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const newLocation = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setMapCenter(newLocation);
        setPosition(newLocation);
        onLocationSelect(newLocation);
      } else {
        alert('Location not found. Please try another search.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setSearching(false);
    }
  };

  if (!isMounted) return <div style={{ height: '100%', width: '100%', background: 'rgba(0,0,0,0.1)' }} />;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Search Bar Overlay */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 1000, 
        width: '92%', 
        maxWidth: '400px' 
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <input 
            type="text" 
            placeholder="Search city or area..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
            style={{ 
              flex: 1, 
              padding: '0.6rem 1rem', 
              borderRadius: '2rem', 
              border: '1px solid var(--border)', 
              background: 'var(--bg-card)',
              color: 'var(--text)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              minWidth: 0,
              fontSize: '16px'
            }}
          />
          <button 
            type="button" 
            disabled={searching}
            onClick={handleSearch}
            style={{ 
              padding: '0.6rem', 
              width: '42px',
              height: '42px',
              borderRadius: '50%', 
              border: 'none', 
              background: 'var(--primary)', 
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              flexShrink: 0
            }}
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      <MapContainer 
        key={`picker-${mapCenter.lat}-${mapCenter.lng}`}
        center={mapCenter} 
        zoom={17} 
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <ZoomControl position="bottomright" />
        <MapUpdater center={mapCenter} />
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={20}
        />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}

