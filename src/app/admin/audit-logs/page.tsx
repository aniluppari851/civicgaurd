'use client';

import { useEffect, useState } from 'react';
import { History, User, Activity, Clock } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatLog = (log: any) => {
    switch (log.action) {
      case 'OFFICER_UPDATE':
        return `Officer updated complaint. Note: ${log.details.updates?.internal_notes || 'No note added'}`;
      case 'UPDATE_COMPLAINT':
        return `Admin updated status to ${log.details.updates?.status || 'no change'}`;
      case 'UPDATE_USER':
        return `User role changed to ${log.details.updates?.role || 'no change'}`;
      case 'CREATE_COMPLAINT':
        return `New complaint submitted by user`;
      default:
        return `Action: ${log.action}`;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <History size={32} color="var(--primary)" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Administrative Audit Trail</h2>
      </div>

      <div className="glass" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Initiator</th>
              <th style={{ padding: '1rem' }}>Activity Summary</th>
              <th style={{ padding: '1rem' }}>Complaint ID</th>
              <th style={{ padding: '1rem' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Fetching logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>No administrative actions recorded yet.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} />
                      {log.admin_id.substring(0, 8)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 500 }}>
                    {formatLog(log)}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    #{log.target_id.substring(0, 8)}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
