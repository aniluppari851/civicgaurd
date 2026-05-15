'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapDisplay = dynamic(() => import('@/components/MapDisplay'), { ssr: false });

export default function AdminLiveMap() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/admin/complaints');
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin complaints for map', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Live Incident Map</h2>
        <p style={{ color: 'var(--text-muted)' }}>Real-time geographical overview of all reported complaints.</p>
      </div>
      
      <div className="glass" style={{ flex: 1, borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Loading map data...
          </div>
        ) : (
          <MapDisplay complaints={complaints} />
        )}
      </div>
    </div>
  );
}
