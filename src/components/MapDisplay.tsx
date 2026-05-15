'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Location {
  lat: number;
  lng: number;
}

interface Complaint {
  id: string;
  title: string;
  category: string;
  lat?: number;
  lng?: number;
}

interface MapDisplayProps {
  complaints: Complaint[];
  center?: Location;
}

import { useMap } from 'react-leaflet';

function MapUpdater({ center }: { center: Location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 16);
  }, [center, map]);
  return null;
}

export default function MapDisplay({ complaints, center }: MapDisplayProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Default to a central location if no center provided and no complaints with locations
  const defaultCenter = center || { lat: 28.6139, lng: 77.2090 };
  const validComplaints = complaints.filter(c => c.lat && c.lng);
  
  const mapCenter = validComplaints.length > 0 ? { lat: validComplaints[0].lat!, lng: validComplaints[0].lng! } : defaultCenter;

  if (!isMounted) return <div style={{ height: '100%', width: '100%', background: 'rgba(0,0,0,0.1)' }} />;

  return (
    <MapContainer 
      key={`map-${mapCenter.lat}-${mapCenter.lng}-${complaints.length}`}
      center={mapCenter} 
      zoom={16} 
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
      {validComplaints.map((complaint) => (
        <Marker 
          key={complaint.id} 
          position={{ lat: complaint.lat!, lng: complaint.lng! }} 
          icon={icon}
        >
          <Popup>
            <strong>{complaint.title}</strong><br />
            {complaint.category}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
