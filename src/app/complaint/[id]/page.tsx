'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Calendar, Tag, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapDisplay = dynamic(() => import('@/components/MapDisplay'), { ssr: false });

import Skeleton, { CardSkeleton } from '@/components/Skeleton';

import { useSession } from 'next-auth/react';

export default function ComplaintDetails() {
  const { data: session } = useSession();
  const params = useParams();
  const id = params.id as string;

  const backLink = session?.user?.role === 'ADMIN' 
    ? '/admin/dashboard' 
    : session?.user?.role === 'DEPARTMENT_OFFICER'
      ? '/department/dashboard'
      : '/public-dashboard';
  
  const backLabel = session?.user?.role === 'ADMIN' || session?.user?.role === 'DEPARTMENT_OFFICER'
    ? 'Back to Dashboard'
    : 'Back to Feed';
  
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        // Add timestamp to bypass any browser or CDN caching
        const response = await fetch(`/api/complaints/${id}?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });
        if (!response.ok) {
          throw new Error('Complaint not found');
        }
        const data = await response.json();
        setComplaint(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <Skeleton width="100px" height="1.5rem" />
        </div>
        <div className="content-grid" style={{ alignItems: 'start' }}>
          <div className="glass" style={{ padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Skeleton width="100px" height="1.5rem" borderRadius="100px" />
              <Skeleton width="100px" height="1.5rem" borderRadius="100px" />
            </div>
            <Skeleton width="80%" height="3rem" style={{ marginBottom: '2rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
              <Skeleton width="40%" height="1rem" />
              <Skeleton width="30%" height="1rem" />
            </div>
            <Skeleton width="100%" height="200px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass" style={{ padding: '1.5rem' }}>
              <Skeleton width="100%" height="250px" />
            </div>
            <div className="glass" style={{ padding: '1.5rem' }}>
              <Skeleton width="100%" height="150px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{error || 'Complaint not found'}</h1>
        <Link href={backLink} className="btn btn-primary" style={{ display: 'inline-flex' }}>
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '1100px', margin: '0 auto' }}>
      <Link href={backLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem', fontWeight: 600 }}>
        <ArrowLeft size={18} />
        {backLabel}
      </Link>

      <div className="content-grid" style={{ alignItems: 'start' }}>
        {/* Left Column: Details */}
        <div className="glass" style={{ padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary)', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '100px', 
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}><Tag size={14} /> {complaint.category || 'GENERAL'}</span>
            
            <span style={{ 
              background: complaint.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.1)' : complaint.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
              color: complaint.status === 'RESOLVED' ? 'var(--success)' : complaint.status === 'IN_PROGRESS' ? 'var(--primary)' : 'var(--warning)', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '100px', 
              fontSize: '0.8rem',
              fontWeight: 700
            }}>{complaint.status?.replace('_', ' ')}</span>

            {complaint.priority === 'URGENT' && (
              <span style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--danger)', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '100px', 
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}><AlertTriangle size={14} /> URGENT</span>
            )}
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            {complaint.title || 'Civic Issue'}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem', color: 'var(--text-muted)' }}>
            {complaint.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="var(--danger)" />
                <span>{complaint.address}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} />
              <span>Reported on {new Date(complaint.created_at).toLocaleDateString()} at {new Date(complaint.created_at).toLocaleTimeString()}</span>
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Description
          </h3>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: '2.5rem' }}>
            {complaint.description}
          </p>

          {(complaint.internal_notes || complaint.resolution_proof_url) && (
            <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '1rem', padding: '1.5rem', marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle size={20} color="var(--success)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--success)' }}>Official Department Response</h3>
                </div>
                
                {complaint.officer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', border: '1px solid var(--border)' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                      {complaint.officer.image_url ? (
                        <img src={complaint.officer.image_url} alt={complaint.officer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        complaint.officer.name[0]
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                      Officer {complaint.officer.name}
                    </span>
                  </div>
                )}
              </div>
              
              {complaint.internal_notes && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text)', margin: 0, fontStyle: 'italic' }}>
                    "{complaint.internal_notes}"
                  </p>
                </div>
              )}

              {complaint.resolution_proof_url && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Resolution Proof</div>
                  <img 
                    src={complaint.resolution_proof_url} 
                    alt="Resolution Proof" 
                    style={{ maxHeight: '350px', maxWidth: '100%', width: 'auto', borderRadius: '0.75rem', border: '1px solid var(--border)', cursor: 'zoom-in', display: 'block' }} 
                    onClick={() => window.open(complaint.resolution_proof_url, '_blank')}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Map & Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Location Map</h3>
            <div style={{ height: '250px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {complaint.lat && complaint.lng ? (
                <MapDisplay complaints={[complaint]} center={{ lat: complaint.lat, lng: complaint.lng }} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}>
                  No exact coordinates provided
                </div>
              )}
            </div>
          </div>

          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Issue Metadata</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tracking ID:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>#CG-{complaint.id.substring(0,8)}</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Supporters:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{complaint.support_count || 0} Citizens</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Assigned Dept:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{complaint.category || 'General Administration'}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
