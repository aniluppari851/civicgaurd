'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';

export default function NotificationsPage() {
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
    <div className="container" style={{ paddingTop: '3rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Bell size={32} color="var(--primary)" />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Notifications</h1>
      </div>

      <div className="glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading updates...</p>
        ) : notifications.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No new updates yet.</p>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              onClick={() => !n.is_read && markAsRead(n.id)}
              style={{ 
                padding: '1.5rem', 
                background: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.05)', 
                border: '1px solid var(--border)', 
                borderRadius: '0.75rem',
                cursor: n.is_read ? 'default' : 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ fontWeight: 700, margin: 0, color: n.is_read ? 'var(--text-muted)' : 'var(--text)' }}>{n.title}</h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: n.is_read ? 'var(--text-muted)' : 'var(--text)' }}>{n.message}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</span>
              </div>
              {!n.is_read && (
                <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%' }}></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
