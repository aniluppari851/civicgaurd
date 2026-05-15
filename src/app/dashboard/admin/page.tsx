'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, UserCheck, MessageSquare, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Admin Command Center</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage city complaints and assign to departments</p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {[1, 2, 3].map((i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.02 }}
            className="glass" 
            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: i === 1 ? '4px solid var(--danger)' : '4px solid var(--warning)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ 
                background: i === 1 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                color: i === 1 ? 'var(--danger)' : 'var(--warning)', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '100px', 
                fontSize: '0.75rem',
                fontWeight: 700
              }}>{i === 1 ? 'URGENT' : 'HIGH PRIORITY'}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>2 mins ago</span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {i === 1 ? 'Gas Leak Reported in Industrial Zone' : 'Major Water Main Burst on 5th Ave'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Citizen reported a strong smell of gas near the chemical warehouse. Immediate inspection required.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                <UserCheck size={16} /> Assign
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                <CheckCircle size={16} /> Resolve
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.6rem' }}>
                <XCircle size={16} color="var(--danger)" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <section style={{ marginTop: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Departmental Stats</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {['Sanitation', 'Water', 'Electricity', 'Security'].map((dept) => (
            <div key={dept} className="glass" style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{dept}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.floor(Math.random() * 20)}</h4>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>active issues</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
