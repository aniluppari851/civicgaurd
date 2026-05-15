'use client';

import { useEffect, useState } from 'react';
import { User, ShieldAlert, ShieldCheck, Ban, CheckCircle, Search, Filter, Trash2 } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const res = await fetch('/api/admin/departments');
    if (res.ok) setDepartments(await res.json());
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUpdateUser = async (id: string, updates: any) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      if (response.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
      } else {
        const errorData = await response.json();
        alert(`Failed to update user: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user', error);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete user "${name}"? They will have to register again.`)) return;
    
    try {
      const response = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const data = await response.json();
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const toggleDepartment = (userId: string, currentDepts: string[], deptId: string) => {
    const newDepts = currentDepts.includes(deptId) 
      ? currentDepts.filter(id => id !== deptId)
      : [...currentDepts, deptId];
    
    handleUpdateUser(userId, { departments: newDepts });
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
          .page-controls {
            flex-direction: column !important;
            width: 100% !important;
            gap: 0.75rem !important;
          }
          .page-controls > div,
          .page-controls input,
          .page-controls select {
            width: 100% !important;
            max-width: none !important;
          }
          .admin-table-container {
            padding: 1rem !important;
            width: 100%;
            min-width: 0;
            max-width: 100%;
          }
          .table-wrapper {
            margin: 0 -1rem;
            padding: 0 1rem;
          }
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Account & Officer Management</h2>
        
        <div className="page-controls" style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                padding: '0.6rem 1rem 0.6rem 2.5rem', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--border)', 
                borderRadius: '0.5rem',
                color: 'var(--text)',
                width: '300px'
              }}
            />
          </div>

          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ 
              padding: '0.6rem 1rem', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border)', 
              borderRadius: '0.5rem',
              color: 'var(--text)'
            }}
          >
            <option value="ALL" style={{ color: 'black' }}>All Roles</option>
            <option value="USER" style={{ color: 'black' }}>Citizens Only</option>
            <option value="DEPARTMENT_OFFICER" style={{ color: 'black' }}>Officers Only</option>
          </select>
        </div>
      </div>
      
      <div className="glass admin-table-container" style={{ padding: '2rem' }}>
        <div className="table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>User Profile</th>
              <th style={{ padding: '1rem' }}>Identity</th>
              <th style={{ padding: '1rem' }}>Department Access</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Control</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>No users found matching your search.</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {user.name?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name || 'Anonymous'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '100px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      background: user.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.1)' : user.role === 'DEPARTMENT_OFFICER' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: user.role === 'ADMIN' ? 'var(--danger)' : user.role === 'DEPARTMENT_OFFICER' ? 'var(--primary)' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {user.role === 'ADMIN' ? 'System Admin' : user.role === 'DEPARTMENT_OFFICER' ? 'Dept Officer' : 'Citizen'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {user.role === 'DEPARTMENT_OFFICER' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {departments.map(dept => {
                          const isSelected = user.departments?.includes(dept.id);
                          return (
                            <button 
                              key={dept.id}
                              onClick={() => toggleDepartment(user.id, user.departments || [], dept.id)}
                              style={{ 
                                padding: '0.2rem 0.5rem', 
                                fontSize: '0.7rem', 
                                borderRadius: '4px', 
                                border: '1px solid var(--border)',
                                background: isSelected ? 'var(--primary)' : 'transparent',
                                color: isSelected ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                            >
                              {dept.name}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A (Citizen)</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: user.is_blocked ? 'var(--danger)' : 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>
                      {user.is_blocked ? 'BLOCKED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleUpdateUser(user.id, { is_blocked: !user.is_blocked })}
                        style={{ 
                          background: user.is_blocked ? 'var(--success)' : 'rgba(239, 68, 68, 0.1)', 
                          color: user.is_blocked ? 'white' : 'var(--danger)', 
                          border: user.is_blocked ? 'none' : '1px solid var(--danger)', 
                          padding: '0.4rem 0.8rem', 
                          borderRadius: '0.25rem', 
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          flex: 1
                        }}
                      >
                        {user.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        title="Delete User Permanently"
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.05)', 
                          color: 'var(--danger)', 
                          border: '1px solid rgba(239, 68, 68, 0.2)', 
                          padding: '0.4rem', 
                          borderRadius: '0.25rem', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
