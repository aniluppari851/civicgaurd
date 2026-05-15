'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Search, MoreVertical, X, Camera, Bell } from 'lucide-react';
import Link from 'next/link';
import Skeleton, { TableRowSkeleton } from '@/components/Skeleton';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchComplaints();
    fetchDepartments();
    fetchNotifications();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/admin/complaints');
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin complaints', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Failed to fetch departments', error);
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

  const handleUpdateField = async (id: string, field: string, value: any) => {
    try {
      const response = await fetch('/api/admin/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value })
      });

      if (response.ok) {
        setComplaints(complaints.map(c => c.id === id ? { ...c, [field]: value } : c));
      } else {
        alert(`Failed to update ${field}`);
      }
    } catch (error) {
      console.error(`Error updating ${field}`, error);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'PENDING').length,
    inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED').length,
    overdue: complaints.filter(c => c.deadline && new Date(c.deadline) < new Date() && c.status !== 'RESOLVED').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Admin Notification Hub */}
      {notifications.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass" 
          style={{ 
            padding: '0.75rem 1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            borderLeft: '4px solid var(--primary)',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.03)'
          }}
        >
          <Bell size={18} color="var(--primary)" className="pulse" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
              {notifications.slice(0, 5).map((n, i) => (
                <div key={n.id} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ fontWeight: 500 }}>{n.message}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}


      {/* Primary Stats */}
        <div className="admin-stats-grid">
          {[
            { label: 'Total Tasks', value: stats.total, icon: <AlertCircle size={20} />, color: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.1)' },
            { label: 'Overdue', value: stats.overdue, icon: <Clock size={20} />, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' },
            { label: 'In Progress', value: stats.inProgress, icon: <Clock size={20} />, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
            { label: 'Resolved', value: stats.resolved, icon: <CheckCircle size={20} />, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              className="glass stat-card" 
              style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)', borderRadius: '12px' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color, lineHeight: 1 }}>
                  {loading ? <Skeleton width="40px" height="1.5rem" /> : item.value}
                </div>
                <div className="stat-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Metrics Section */}
        <div className="secondary-grid">
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px', minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Task Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['Sanitation', 'Roads', 'Water', 'Electricity'].map(cat => {
                const count = complaints.filter(c => c.category?.includes(cat)).length;
                const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 500 }}>{cat}</span>
                      <span style={{ fontWeight: 700 }}>{count} ({Math.round(percent)}%)</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: 'var(--primary)', transition: 'width 1s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass performance-chart" style={{ padding: '1.25rem', textAlign: 'center', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Performance</div>
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--success)" strokeWidth="4" strokeDasharray={`${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}, 100`} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.2rem', fontWeight: 800 }}>
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                <div style={{ fontWeight: 800 }}>~4h</div>
                <div style={{ color: 'var(--text-muted)' }}>Response</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                <div style={{ fontWeight: 800 }}>2.8d</div>
                <div style={{ color: 'var(--text-muted)' }}>Resolved</div>
              </div>
            </div>
          </div>
        </div>

      {/* Complaint Management Table */}
      <div className="glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minWidth: 0 }}>
        <div className="complaint-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Management Center</h2>
          
          <div className="complaint-controls" style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  width: '200px'
                }}
              />
            </div>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ 
                padding: '0.5rem 0.75rem', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid var(--border)', 
                borderRadius: '10px',
                color: 'var(--text)',
                fontSize: '0.9rem'
              }}
            >
              <option value="ALL" style={{ color: 'black' }}>All Status</option>
              <option value="PENDING" style={{ color: 'black' }}>Pending</option>
              <option value="IN_PROGRESS" style={{ color: 'black' }}>In Progress</option>
              <option value="RESOLVED" style={{ color: 'black' }}>Resolved</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>City Name</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Reporter</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Assignment</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Deadline</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Priority</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : filteredComplaints.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No complaints found.</td></tr>
              ) : (
                filteredComplaints.map((complaint) => {
                  const isOverdue = complaint.deadline && new Date(complaint.deadline) < new Date() && complaint.status !== 'RESOLVED';
                  
                  // Simple duplicate check
                  const isPotentialDuplicate = complaints.some(c => 
                    c.id !== complaint.id && 
                    c.category === complaint.category && 
                    Math.abs(c.lat - complaint.lat) < 0.001 && 
                    Math.abs(c.lng - complaint.lng) < 0.001
                  );

                  return (
                    <tr key={complaint.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }} onMouseOver={e => e.currentTarget.style.background = isOverdue ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <Link href={`/complaint/${complaint.id}`} style={{ color: 'inherit', textDecoration: 'none' }} target="_blank">
                            {complaint.title || complaint.description.substring(0, 30) + '...'}
                          </Link>
                          {isPotentialDuplicate && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--warning)', fontWeight: 800, textTransform: 'uppercase' }}>⚠️ Potential Duplicate</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <Link 
                          href={`/user/${complaint.citizen_id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}
                        >
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: 'var(--primary)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '0.8rem', 
                            fontWeight: 800,
                            overflow: 'hidden'
                          }}>
                            {complaint.users?.image_url ? (
                              <img src={complaint.users.image_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              complaint.users?.name?.[0] || '?'
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>{complaint.users?.name || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{complaint.users?.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select 
                          value={complaint.assigned_department_id || ''}
                          onChange={(e) => handleUpdateField(complaint.id, 'assigned_department_id', e.target.value)}
                          style={{ 
                            padding: '0.4rem 0.5rem', 
                            background: 'var(--bg)', 
                            border: '1px solid var(--border)', 
                            borderRadius: '0.25rem',
                            color: 'var(--text)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <option value="" style={{ color: 'black' }}>Unassigned</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id} style={{ color: 'black' }}>{dept.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 400 }}>
                        {complaint.deadline ? new Date(complaint.deadline).toLocaleDateString() : 'N/A'}
                        {isOverdue && <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Overdue</div>}
                      </td>


                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            background: complaint.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.1)' : complaint.priority === 'HIGH' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)', 
                            color: complaint.priority === 'URGENT' ? 'var(--danger)' : complaint.priority === 'HIGH' ? 'var(--warning)' : 'var(--text)', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '0.25rem', 
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {complaint.priority || 'MEDIUM'}
                          </span>
                          {complaint.priority !== 'URGENT' && complaint.status !== 'RESOLVED' && (
                            <button 
                              onClick={() => handleUpdateField(complaint.id, 'priority', 'URGENT')}
                              title="Escalate to Urgent"
                              style={{ padding: '0.25rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            >
                              <motion.div whileHover={{ scale: 1.2 }}><AlertCircle size={14} /></motion.div>
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select 
                          value={complaint.status}
                          onChange={(e) => handleUpdateField(complaint.id, 'status', e.target.value)}
                          style={{ 
                            padding: '0.4rem 0.5rem', 
                            background: 'var(--bg)', 
                            border: '1px solid var(--border)', 
                            borderRadius: '0.25rem',
                            color: 'var(--text)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}
                        >
                          <option value="PENDING" style={{ color: 'black' }}>Pending</option>
                          <option value="IN_PROGRESS" style={{ color: 'black' }}>In Progress</option>
                          <option value="RESOLVED" style={{ color: 'black' }}>Resolved</option>
                          <option value="REJECTED" style={{ color: 'black' }}>Rejected</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
