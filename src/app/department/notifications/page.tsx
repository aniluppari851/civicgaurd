'use client';

import { useEffect, useState } from 'react';
import { Bell, Clock, ArrowLeft, ClipboardList, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useDepartment } from '../layout';

export default function OfficerNotificationsPage() {
  const { selectedDept } = useDepartment();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style jsx>{`
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem;
          }
          .notification-card {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem;
          }
          .notification-badge {
            align-self: flex-end;
          }
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
            <Bell size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Departmental Alerts</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Task assignments and status updates for {selectedDept?.name}</p>
          </div>
        </div>
        <Link href="/department/dashboard" className="btn btn-secondary">
          <ArrowLeft size={18} /> Back to Tasks
        </Link>
      </div>

      <div className="glass" style={{ padding: '1rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Checking for assignments...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '5rem', textAlign: 'center' }}>
            <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--text-muted)' }}>All quiet in the department</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n, idx) => (
              <motion.div 
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className="notification-card"
                style={{ 
                  padding: '1.25rem 1.5rem', 
                  background: n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.05)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: n.is_read ? 'default' : 'pointer',
                  borderLeft: n.is_read ? '1px solid var(--border)' : '4px solid var(--primary)'
                }}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ color: n.is_read ? 'var(--text-muted)' : 'var(--primary)' }}>
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: n.is_read ? 'var(--text-muted)' : 'white' }}>{n.title}</div>
                    <div style={{ fontSize: '0.9rem', color: n.is_read ? 'var(--text-muted)' : 'var(--text)' }}>{n.message}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                {!n.is_read && (
                  <span className="notification-badge" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>NEW TASK</span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
