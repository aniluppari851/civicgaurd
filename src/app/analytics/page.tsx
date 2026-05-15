'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, Timer } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="container" style={{ paddingTop: '3rem' }}>
      <div style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Resolution Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Monitoring efficiency and performance of civic departments.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '4rem' }}>
        {[
          { label: 'Avg. Resolution Time', value: '4.2 Days', icon: <Timer />, color: 'var(--primary)' },
          { label: 'Resolution Rate', value: '92%', icon: <TrendingUp />, color: 'var(--success)' },
          { label: 'Citizen Satisfaction', value: '4.8/5', icon: <BarChart3 />, color: 'var(--warning)' },
          { label: 'Total Impact Score', value: '8.4k', icon: <PieChart />, color: 'var(--danger)' }
        ].map((stat, i) => (
          <div key={i} className="glass" style={{ padding: '2rem' }}>
            <div style={{ color: stat.color, marginBottom: '1rem' }}>{stat.icon}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{stat.label}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="glass" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Monthly Resolution Trend</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
            {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1 }}
                style={{ 
                  flex: 1, 
                  background: 'linear-gradient(to top, var(--primary), var(--primary-hover))', 
                  borderRadius: '0.5rem',
                  opacity: 0.8
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
          </div>
        </div>

        <div className="glass" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Issues by Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { label: 'Sanitation', value: 35, color: 'var(--success)' },
              { label: 'Roads', value: 25, color: 'var(--primary)' },
              { label: 'Electricity', value: 20, color: 'var(--warning)' },
              { label: 'Water', value: 15, color: 'var(--danger)' },
              { label: 'Others', value: 5, color: 'var(--text-muted)' }
            ].map((cat, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <span>{cat.label}</span>
                  <span>{cat.value}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.value}%` }}
                    style={{ height: '100%', background: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
