'use client';

import { useEffect, useState } from 'react';
import { useDepartment } from '../layout';
import { AlertCircle, CheckCircle, Clock, MapPin, Camera, MessageSquare, User, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CardSkeleton } from '@/components/Skeleton';

export default function OfficerDashboard() {
  const { selectedDept } = useDepartment();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedDept) {
      fetchComplaints();
      fetchNotifications();
    } else {
      setLoading(false);
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

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    try {
      const response = await fetch('/api/department/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates, deptId: selectedDept.id })
      });
      if (response.ok) {
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      }
    } catch (error) {
      console.error('Update failed', error);
    }
  };

  const [editingNote, setEditingNote] = useState<{id: string, text: string} | null>(null);

  const handleUploadProof = async (id: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-proof-${Math.random()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      // Upload to storage (assuming bucket 'complaint-images' exists or using a new one)
      const { data: uploadData, error: uploadError } = await (await import('@/lib/supabase')).supabaseAdmin
        .storage
        .from('complaint-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = (await import('@/lib/supabase')).supabaseAdmin
        .storage
        .from('complaint-images')
        .getPublicUrl(filePath);

      await handleUpdate(id, { resolution_proof_url: publicUrl });
      alert('Proof uploaded successfully!');
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload proof');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Officer Notification Hub */}
      {notifications.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass" 
          style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--primary)' }}
        >
          <div style={{ position: 'relative' }}>
            <Bell size={20} color="var(--primary)" />
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid rgba(0,0,0,0.5)', animation: 'pulse 2s infinite' }} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Recent Department Updates</div>
            <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
                  <span>{n.message}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.5rem;
          }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          70% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Assigned Tasks: {selectedDept?.name}</h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {complaints.length} Active Complaints
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : complaints.length === 0 ? (
          <div className="glass" style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center' }}>
            <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3>No complaints assigned!</h3>
            <p style={{ color: 'var(--text-muted)' }}>Everything in your department is currently up to date.</p>
          </div>
        ) : (
          complaints.map(complaint => (
            <div key={complaint.id} className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ 
                  background: complaint.priority === 'URGENT' ? 'var(--danger)' : 'rgba(255,255,255,0.1)', 
                  fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.5rem', borderRadius: '4px' 
                }}>
                  {complaint.priority}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  #{complaint.id.substring(0,6)}
                </span>
              </div>

              {/* Reporter Info */}
              <Link href={`/user/${complaint.citizen_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, overflow: 'hidden' }}>
                  {complaint.users?.image_url ? (
                    <img src={complaint.users.image_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    complaint.users?.name?.[0] || '?'
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{complaint.users?.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reported by</div>
                </div>
              </Link>

              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{complaint.title || 'Untitled Report'}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>{complaint.description}</p>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={14} /> {complaint.category}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={14} /> {new Date(complaint.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Status and Verification Controls */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleUpdate(complaint.id, { is_visited: !complaint.is_visited })}
                  style={{ 
                    flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)',
                    background: complaint.is_visited ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: complaint.is_visited ? 'var(--success)' : 'var(--text)', cursor: 'pointer', fontSize: '0.8rem'
                  }}
                >
                  {complaint.is_visited ? '✓ Site Visited' : 'Verify On-Site'}
                </button>
                <select 
                  value={complaint.status}
                  onChange={(e) => handleUpdate(complaint.id, { status: e.target.value })}
                  style={{ 
                    flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)',
                    background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem'
                  }}
                >
                  <option value="PENDING" style={{ color: 'black' }}>Pending</option>
                  <option value="IN_PROGRESS" style={{ color: 'black' }}>In Progress</option>
                  <option value="RESOLVED" style={{ color: 'black' }}>Resolved</option>
                  <option value="REJECTED" style={{ color: 'black' }}>Rejected</option>
                </select>
              </div>

              {/* Internal Notes Section */}
              {editingNote?.id === complaint.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea 
                    value={editingNote.text}
                    onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                    placeholder="Enter resolution notes..."
                    style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--text)', padding: '0.5rem', fontSize: '0.85rem', minHeight: '60px' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { handleUpdate(complaint.id, { internal_notes: editingNote.text }); setEditingNote(null); }} className="btn btn-primary" style={{ padding: '0.4rem', flex: 1, fontSize: '0.8rem' }}>Save Note</button>
                    <button onClick={() => setEditingNote(null)} className="btn btn-secondary" style={{ padding: '0.4rem', flex: 1, fontSize: '0.8rem' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                complaint.internal_notes && (
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid var(--primary)' }}>
                    {complaint.internal_notes}
                  </div>
                )
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
                  <Camera size={14} /> {complaint.resolution_proof_url ? 'Update Proof' : 'Add Proof'}
                  <input type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleUploadProof(complaint.id, e.target.files[0])} />
                </label>
                <button 
                  onClick={() => setEditingNote({ id: complaint.id, text: complaint.internal_notes || '' })}
                  className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', justifyContent: 'center' }}
                >
                  <MessageSquare size={14} /> {complaint.internal_notes ? 'Edit Note' : 'Add Note'}
                </button>
              </div>
              
              {complaint.resolution_proof_url && (
                <a href={complaint.resolution_proof_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                  View Resolution Proof →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
