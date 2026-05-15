'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Clock, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container" style={{ paddingTop: '4rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '6rem' }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}
        >
          Transparency in <span style={{ color: 'var(--primary)' }}>Action</span>. <br />
          Accountability for <span style={{ color: 'var(--success)' }}>Everyone</span>.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 2.5rem' }}
        >
          CivicGuard empowers citizens to report civic issues and track their resolution in real-time. 
          No more dark holes for complaints. Total visibility. Total impact.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}
        >
          <Link href="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Report an Issue <ArrowRight size={20} />
          </Link>
          <Link href="/public-dashboard" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            View Public Feed
          </Link>
        </motion.div>
      </section>

      {/* Stats Grid */}
      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '8rem' }}>
        {[
          { label: 'Total Complaints', value: '1,284', icon: <Users color="var(--primary)" /> },
          { label: 'Resolved Issues', value: '942', icon: <CheckCircle color="var(--success)" /> },
          { label: 'Active Tasks', value: '342', icon: <Clock color="var(--warning)" /> },
          { label: 'Impact Areas', value: '48', icon: <MapPin color="var(--danger)" /> }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass" 
            style={{ padding: '2rem', textAlign: 'center' }}
          >
            <div style={{ background: 'rgba(255,255,255,0.05)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              {stat.icon}
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </motion.div>
        ))}
      </section>

      {/* Recent Feed Preview */}
      <section>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 700 }}>Live Activity</h2>
            <p style={{ color: 'var(--text-muted)' }}>Real-time updates from across the city</p>
          </div>
          <Link href="/public-dashboard" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>View all activity &rarr;</Link>
        </div>
        
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {[1, 2, 3].map((item) => (
            <div key={item} className="glass" style={{ padding: '1.5rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  color: 'var(--success)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '100px', 
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>Resolved</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>2 hours ago</span>
              </div>
              <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Broken Streetlight at MG Road</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                The streetlight near the metro station has been non-functional for 3 days.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <MapPin size={14} />
                <span>Downtown Sector 4</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
