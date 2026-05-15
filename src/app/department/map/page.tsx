'use client';

import { useEffect, useState } from 'react';
import { useDepartment } from '../layout';
import dynamic from 'next/dynamic';

const MapDisplay = dynamic(() => import('@/components/MapDisplay'), { 
  ssr: false,
  loading: () => <div style={{ height: '600px', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
});

export default function OfficerMap() {
  const { selectedDept } = useDepartment();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedDept) {
      fetchComplaints();
    }
  }, [selectedDept]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/department/complaints?deptId=${selectedDept.id}`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style jsx>{`
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.5rem;
          }
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Geospatial View: {selectedDept?.name}</h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {complaints.length} Assigned Locations
        </div>
      </div>

      <div className="glass" style={{ padding: '1rem', height: '70vh', borderRadius: '1rem', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading department data...</div>
        ) : (
          <MapDisplay complaints={complaints} />
        )}
      </div>
    </div>
  );
}
