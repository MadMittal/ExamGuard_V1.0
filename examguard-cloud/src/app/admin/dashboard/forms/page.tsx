'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';

type FormRow = Database['public']['Tables']['forms']['Row'];

export default function FormsManagementPage() {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<Partial<FormRow>>({ active: true });

  const supabase = createClient();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      toast.error('Failed to load forms');
    } else {
      setForms(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingForm.id) {
        // Update
        const { error } = await (supabase.from('forms') as any)
          .update({
            form_name: editingForm.form_name,
            google_form_id: editingForm.google_form_id,
            email_field: editingForm.email_field,
            time_limit_minutes: editingForm.time_limit_minutes ? parseInt(editingForm.time_limit_minutes as any) : null,
            allowed_emails: editingForm.allowed_emails || null,
            active: editingForm.active,
          })
          .eq('id', editingForm.id);
        if (error) throw error;
        toast.success('Form updated');
      } else {
        // Insert
        const { error } = await (supabase.from('forms') as any)
          .insert({
            form_name: editingForm.form_name!,
            google_form_id: editingForm.google_form_id!,
            email_field: editingForm.email_field!,
            time_limit_minutes: editingForm.time_limit_minutes ? parseInt(editingForm.time_limit_minutes as any) : null,
            allowed_emails: editingForm.allowed_emails || null,
            active: editingForm.active ?? true,
            sort_order: forms.length + 1,
          });
        if (error) throw error;
        toast.success('Form created');
      }
      setIsModalOpen(false);
      fetchForms();
    } catch (err: any) {
      toast.error('Failed to save form: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>Google Forms</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 4 }}>
            Manage the exams available to students.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingForm({ active: true });
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
          Add Form
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
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Form Name</th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Google Form URL ID</th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Added</th>
              <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Loading...</td></tr>
            ) : forms.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No forms added yet.</td></tr>
            ) : (
              forms.map(form => (
                <tr key={form.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FileText size={18} style={{ color: 'var(--brand)' }} />
                      {form.form_name}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--muted)', fontSize: 14 }}>{form.google_form_id}</td>
                  <td style={{ padding: '16px' }}>
                    {form.active ? (
                      <span style={{ padding: '4px 8px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>Active</span>
                    ) : (
                      <span style={{ padding: '4px 8px', background: 'var(--soft)', color: 'var(--muted)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--muted)', fontSize: 14 }}>
                    {format(new Date(form.created_at), 'MMM d, yyyy')}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setEditingForm(form);
                        setIsModalOpen(true);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Basic Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--panel)', padding: 32, borderRadius: 'var(--radius-lg)', width: 400, maxWidth: '90%' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: 20 }}>{editingForm.id ? 'Edit Form' : 'Add Form'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Form Name</label>
                <input required value={editingForm.form_name || ''} onChange={e => setEditingForm({...editingForm, form_name: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Google Form ID</label>
                <input required value={editingForm.google_form_id || ''} onChange={e => setEditingForm({...editingForm, google_form_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }} placeholder="e.g. 1FAIpQLSc..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Email Field ID (entry.xxxxx)</label>
                <input required value={editingForm.email_field || ''} onChange={e => setEditingForm({...editingForm, email_field: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Time Limit (Minutes, optional)</label>
                <input type="number" min="1" value={editingForm.time_limit_minutes || ''} onChange={e => setEditingForm({...editingForm, time_limit_minutes: e.target.value ? parseInt(e.target.value) as any : null})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }} placeholder="e.g. 60 for 1 hour" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Allowed Emails (Optional Whitelist)</label>
                <textarea 
                  value={editingForm.allowed_emails || ''} 
                  onChange={e => setEditingForm({...editingForm, allowed_emails: e.target.value})} 
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--line)', minHeight: 80, resize: 'vertical' }} 
                  placeholder="Paste emails separated by commas or newlines. Leave blank to allow anyone." 
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={editingForm.active} onChange={e => setEditingForm({...editingForm, active: e.target.checked})} />
                Active (Visible to students)
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
