'use client';
// Trivial change to trigger rebuild

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Clock, CheckCircle, AlertCircle, User, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Skeleton, { TableRowSkeleton } from '@/components/Skeleton';

export default function Dashboard() {
  const { data: session } = useSession();
  const isUser = session?.user?.role === 'USER';
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleOpenHub = () => {
    window.dispatchEvent(new CustomEvent('openHub'));
  };

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch('/api/complaints');
        if (response.ok) {
          let data = await response.json();
          // If user, only show their own complaints
          if (isUser && session?.user?.id) {
            data = data.filter((c: any) => c.citizen_id === session.user.id);
          }
          setComplaints(data);
        }
      } catch (error) {
        console.error('Failed to fetch complaints', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchComplaints();
    }
  }, [session, isUser]);

  const pendingCount = complaints.filter(c => c.status === 'PENDING').length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <header style={{ 
        display: 'flex', 
        flexDirection: 'row',
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ flex: '1', minWidth: '280px' }}>
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', 
            fontWeight: 800, 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Welcome, {session?.user?.name || 'Citizen'}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.8rem, 3vw, 1rem)', margin: 0 }}>
              {isUser ? 'Track your reports and civic impact' : 'Manage city complaints and assignments'}
            </p>
            {isUser && (
              <Link href="/dashboard/profile" className="desktop-only" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} /> View Profile
              </Link>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className="report-btn-container desktop-only" style={{ width: 'auto' }}>
            <Link href="/dashboard/report" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
              <Plus size={18} />
              <span>Report New Issue</span>
            </Link>
          </div>
        )}
      </header>

      {/* Stats Overview */}
      <div className="grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem' 
      }}>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <Clock size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Pending</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {loading ? <Skeleton width="40px" height="2rem" /> : pendingCount}
          </h3>
        </div>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>In Progress</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {loading ? <Skeleton width="40px" height="2rem" /> : inProgressCount}
          </h3>
        </div>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--success)' }}>
            <CheckCircle size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Resolved</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {loading ? <Skeleton width="40px" height="2rem" /> : resolvedCount}
          </h3>
        </div>
        <div className="glass" style={{ padding: '1.5rem', border: '1px solid var(--primary)', cursor: 'pointer' }} onClick={handleOpenHub}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
            <MessageSquare size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Messaging</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            <span style={{ fontSize: '1rem', verticalAlign: 'middle' }}>Open</span>
          </h3>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass" style={{ padding: 'clamp(1rem, 5vw, 2rem)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 700, margin: 0 }}>
            {isUser ? 'My Recent Reports' : 'All Complaints'}
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', flex: '1', minWidth: '280px', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', flex: '1', maxWidth: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search..."
                style={{ 
                  width: '100%',
                  padding: '0.5rem 1rem 0.5rem 2.5rem', 
                  background: 'var(--bg)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem',
                  color: 'var(--text)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <Filter size={16} />
              <span className="desktop-only">Filter</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>REPORTER</th>
                <th style={{ padding: '1rem' }}>ISSUE</th>
                <th style={{ padding: '1rem' }}>CATEGORY</th>
                <th style={{ padding: '1rem' }}>STATUS</th>
                <th style={{ padding: '1rem' }}>DATE</th>
                <th style={{ padding: '1rem' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : complaints.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '1.25rem', textAlign: 'center' }}>No complaints found.</td></tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                          {c.users?.name?.[0] || '?'}
                        </div>
                        <span>{c.users?.name || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>{c.title || c.description.substring(0, 30) + '...'}</td>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', background: 'var(--bg)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>{c.category}</span>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ 
                          color: c.status === 'PENDING' ? 'var(--warning)' : c.status === 'IN_PROGRESS' ? 'var(--primary)' : 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1.25rem' }}>
                      <Link href={`/complaint/${c.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <Skeleton height="100px" width="100%" />
          ) : complaints.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>No complaints found.</p>
          ) : (
            complaints.map((c) => (
              <Link href={`/complaint/${c.id}`} key={c.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>{c.category}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{c.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800 }}>
                        {c.users?.name?.[0] || '?'}
                      </div>
                      <span style={{ fontSize: '0.8rem' }}>{c.users?.name || 'Anonymous'}</span>
                    </div>
                    <span style={{ 
                      color: c.status === 'PENDING' ? 'var(--warning)' : c.status === 'IN_PROGRESS' ? 'var(--primary)' : 'var(--success)',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
