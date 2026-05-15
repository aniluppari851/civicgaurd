'use client';

import { Settings as SettingsIcon, Shield, Database, Bell } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <SettingsIcon size={32} color="var(--primary)" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>System Control Panel</h2>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Shield size={24} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Security Settings</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Strict Mode (Auto-Block Spam)</span>
              <div style={{ width: '40px', height: '20px', background: 'var(--border)', borderRadius: '10px' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Force Evidence Attachment</span>
              <div style={{ width: '40px', height: '20px', background: 'var(--primary)', borderRadius: '10px', position: 'relative' }}>
                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Database size={24} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>SLA Configuration</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Urgent Priority Deadline</span>
              <span style={{ fontWeight: 700 }}>24 Hours</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>High Priority Deadline</span>
              <span style={{ fontWeight: 700 }}>3 Days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Standard Deadline</span>
              <span style={{ fontWeight: 700 }}>7 Days</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="glass" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Active Complaint Categories</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {['Sanitation', 'Roads & Infrastructure', 'Water Supply', 'Electricity', 'Public Safety', 'Others'].map(cat => (
            <span key={cat} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '2rem', fontSize: '0.9rem' }}>
              {cat}
            </span>
          ))}
          <button style={{ padding: '0.5rem 1rem', background: 'none', border: '1px dashed var(--primary)', color: 'var(--primary)', borderRadius: '2rem', cursor: 'pointer' }}>+ Add Category</button>
        </div>
      </div>
    </div>
  );
}
