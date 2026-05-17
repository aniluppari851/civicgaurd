'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ width = '100%', height = '1rem', borderRadius = '0.5rem', className = '', style }: SkeletonProps) {
  return (
    <div 
      className={`skeleton-container ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius, 
        background: 'var(--skeleton-bg)', 
        overflow: 'hidden', 
        position: 'relative',
        ...style
      }}
    >
      <motion.div
        animate={{ 
          x: ['-100%', '100%'] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.5, 
          ease: 'linear' 
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent 0%, var(--skeleton-shimmer) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="120px" height="1rem" />
          <Skeleton width="80px" height="0.75rem" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Skeleton width="80px" height="1.5rem" borderRadius="100px" />
        <Skeleton width="100px" height="1.5rem" borderRadius="100px" />
      </div>
      <Skeleton width="90%" height="1.5rem" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton width="100%" height="0.75rem" />
        <Skeleton width="100%" height="0.75rem" />
        <Skeleton width="60%" height="0.75rem" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <Skeleton width="100px" height="1rem" />
        <Skeleton width="100px" height="1rem" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 7 }: { cols?: number }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '1.25rem 1.5rem' }}>
          <Skeleton width="80%" height="1.25rem" />
        </td>
      ))}
    </tr>
  );
}
export function ProfileSkeleton() {
  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <Skeleton width="100px" height="1.5rem" className="mb-8" />
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <Skeleton width="150px" height="150px" borderRadius="50%" className="mx-auto mb-6" />
            <Skeleton width="180px" height="2rem" className="mx-auto mb-4" />
            <Skeleton width="100%" height="1rem" className="mb-2" />
            <Skeleton width="80%" height="1rem" className="mx-auto mb-6" />
            <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1rem 0', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
              <Skeleton width="60px" height="2.5rem" />
              <Skeleton width="60px" height="2.5rem" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass" style={{ padding: '1.5rem' }}><Skeleton width="100%" height="3rem" /></div>
            <div className="glass" style={{ padding: '1.5rem' }}><Skeleton width="100%" height="3rem" /></div>
          </div>
        </div>
        <div className="glass" style={{ padding: '2.5rem' }}>
          <Skeleton width="250px" height="2rem" className="mb-8" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
