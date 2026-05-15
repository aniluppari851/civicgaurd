'use client';

import { motion } from 'framer-motion';
import { Search, MapPin, ThumbsUp, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { CardSkeleton } from '@/components/Skeleton';
import UserSearch from '@/components/UserSearch';

export default function PublicDashboard() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch('/api/complaints');
        if (response.ok) {
          const data = await response.json();
          setComplaints(data);
        }
      } catch (error) {
        console.error('Failed to fetch complaints', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const stats = {
    ALL: complaints.length,
    PENDING: complaints.filter(c => c.status === 'PENDING').length,
    IN_PROGRESS: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    RESOLVED: complaints.filter(c => c.status === 'RESOLVED').length,
    REJECTED: complaints.filter(c => c.status === 'REJECTED').length,
  };

  const filteredComplaints = complaints.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      c.title?.toLowerCase().includes(searchLower) ||
      c.description?.toLowerCase().includes(searchLower) ||
      c.category?.toLowerCase().includes(searchLower) ||
      c.address?.toLowerCase().includes(searchLower) ||
      c.id.toLowerCase().includes(searchLower)
    );
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSupport = async (id: string) => {
    if (!session) {
      alert('You must be logged in to support a complaint.');
      return;
    }

    try {
      const response = await fetch(`/api/complaints/${id}/support`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Update the specific complaint in the state
        setComplaints(complaints.map(c => 
          c.id === id ? { ...c, support_count: data.support_count, supported_by: data.supported_by } : c
        ));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add support');
      }
    } catch (error) {
      console.error('Failed to support complaint', error);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'clamp(1rem, 5vw, 3rem)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', fontWeight: 800, marginBottom: '0.5rem' }}>Public Activity Feed</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.9rem, 3vw, 1.2rem)', maxWidth: '600px', margin: '0 auto' }}>
          Real-time visibility into civic issues and government response. No censorship, total transparency.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: 'clamp(1.5rem, 5vw, 3rem)' }}>
        {/* User Search Section */}
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>Search Citizens</label>
          <UserSearch />
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0', opacity: 0.5 }}></div>

        {/* Issue Search Section */}
        <div style={{ position: 'relative', width: '100%' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>Search Issues</label>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by area, category, or issue ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: 'clamp(0.75rem, 3vw, 1rem) clamp(0.75rem, 3vw, 1rem) clamp(0.75rem, 3vw, 1rem) 3rem', 
                background: 'var(--glass)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border)', 
                borderRadius: '1rem',
                color: 'var(--text)',
                fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {[
            { id: 'ALL', label: 'All', color: 'var(--primary)' },
            { id: 'PENDING', label: 'Pending', color: 'var(--warning)' },
            { id: 'IN_PROGRESS', label: 'In Progress', color: 'var(--primary)' },
            { id: 'RESOLVED', label: 'Resolved', color: 'var(--success)' },
            { id: 'REJECTED', label: 'Rejected', color: 'var(--danger)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '100px',
                background: filterStatus === tab.id ? tab.color : 'rgba(255,255,255,0.05)',
                color: filterStatus === tab.id ? 'white' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: filterStatus === tab.id ? 'transparent' : 'var(--border)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
              <span style={{ 
                background: filterStatus === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', 
                padding: '0.1rem 0.4rem', 
                borderRadius: '10px', 
                fontSize: '0.7rem' 
              }}>
                {(stats as any)[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', paddingBottom: '4rem', gap: '1rem' }}>
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No results found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try searching for a different area, category, or keyword.</p>
            <button onClick={() => setSearchTerm('')} className="btn btn-primary" style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Clear Search</button>
          </div>
        ) : (
          filteredComplaints.map((complaint, index) => (
            <motion.div 
              key={complaint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index % 10) * 0.1 }}
              className="glass" 
              style={{ padding: 'clamp(1rem, 4vw, 1.5rem)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* Reporter Identity */}
              <Link 
                href={`/user/${complaint.citizen_id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                className="reporter-link"
              >
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'var(--primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '0.85rem', 
                  fontWeight: 800,
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.1)'
                }}>
                  {complaint.users?.image_url ? (
                    <img src={complaint.users.image_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    complaint.users?.name?.[0] || '?'
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>{complaint.users?.name || 'Anonymous Citizen'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(complaint.created_at).toLocaleDateString()}</div>
                </div>
              </Link>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    color: 'var(--primary)', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '100px', 
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>{complaint.category || 'GENERAL'}</span>
                  <span style={{ 
                    background: complaint.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.1)' : complaint.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                    color: complaint.status === 'RESOLVED' ? 'var(--success)' : complaint.status === 'IN_PROGRESS' ? 'var(--primary)' : 'var(--warning)', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '100px', 
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>{complaint.status?.replace('_', ' ')}</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#CG-{complaint.id.substring(0,6)}</span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: '1.3' }}>
                  {complaint.title || complaint.description.substring(0, 50)}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                  {complaint.description}
                </p>
              </div>

              {complaint.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <MapPin size={16} color="var(--danger)" />
                  <span>{complaint.address}</span>
                </div>
              )}

              <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => handleSupport(complaint.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: session && complaint.supported_by?.includes(session.user?.id) ? 'var(--primary)' : session ? 'var(--text)' : 'var(--text-muted)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      cursor: session ? 'pointer' : 'not-allowed', 
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      opacity: session ? 1 : 0.6
                    }}
                    title={session ? "Support this issue" : "Login to support"}
                  >
                    <ThumbsUp size={16} fill={session && complaint.supported_by?.includes(session.user?.id) ? 'currentColor' : 'none'} />
                    <span>{complaint.support_count || 0} Supports</span>
                  </button>
                </div>
                <Link href={`/complaint/${complaint.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                  Details <ExternalLink size={14} />
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
