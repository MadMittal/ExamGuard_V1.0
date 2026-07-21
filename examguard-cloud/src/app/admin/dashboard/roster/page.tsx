'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

type StudentRow = Database['public']['Tables']['students']['Row'];

export default function RosterManagementPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<StudentRow>>({ allowed: true });

  const supabase = createClient();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('email', { ascending: true });
    
    if (error) {
      toast.error('Failed to load roster');
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent.id) {
        // Update
        const { error } = await (supabase.from('students') as any)
          .update({
            email: editingStudent.email,
            name: editingStudent.name,
            roll_no: editingStudent.roll_no,
            section: editingStudent.section,
            allowed: editingStudent.allowed,
          })
          .eq('id', editingStudent.id);
        if (error) throw error;
        toast.success('Student updated');
      } else {
        // Insert
        const { error } = await (supabase.from('students') as any)
          .insert({
            email: editingStudent.email!,
            name: editingStudent.name || '',
            roll_no: editingStudent.roll_no || '',
            section: editingStudent.section || '',
            allowed: editingStudent.allowed ?? true,
          });
        if (error) throw error;
        toast.success('Student added');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error('Failed to save student: ' + err.message);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the roster?`)) return;
    try {
      const { error } = await (supabase.from('students') as any).delete().eq('id', id);
      if (error) throw error;
      toast.success('Student removed');
      fetchStudents();
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>Student Roster</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 4 }}>
            Manage the whitelist of students allowed to take exams.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingStudent({ allowed: true });
            setIsModalOpen(true);
          }}
          className="focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--soft)' }}>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Student</th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Roll No / Section</th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Access</th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Added On</th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No students in roster. They will be auto-added upon first login if open access is enabled.</td></tr>
            ) : (
              students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{student.name || 'Unknown'}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{student.email}</div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--muted)', fontSize: 14 }}>
                    {student.roll_no || '-'} / {student.section || '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {student.allowed ? (
                      <span style={{ padding: '4px 8px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>Allowed</span>
                    ) : (
                      <span style={{ padding: '4px 8px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>Blocked</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--muted)', fontSize: 14 }}>
                    {format(new Date(student.created_at), 'MMM d, yyyy')}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setEditingStudent(student);
                        setIsModalOpen(true);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 8 }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id, student.email)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 8 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--panel)', padding: 32, borderRadius: 'var(--radius-lg)', width: 400, maxWidth: '90%' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: 20 }}>{editingStudent.id ? 'Edit Student' : 'Add Student'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Email</label>
                <input type="email" required value={editingStudent.email || ''} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Full Name</label>
                <input value={editingStudent.name || ''} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Roll No</label>
                  <input value={editingStudent.roll_no || ''} onChange={e => setEditingStudent({...editingStudent, roll_no: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Section</label>
                  <input value={editingStudent.section || ''} onChange={e => setEditingStudent({...editingStudent, section: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={editingStudent.allowed} onChange={e => setEditingStudent({...editingStudent, allowed: e.target.checked})} />
                Allowed to take exams
              </label>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid var(--line)', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
