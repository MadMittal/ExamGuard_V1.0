'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

type ConfigRow = Database['public']['Tables']['config']['Row'];

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('config').select('*').order('key');
    if (error) {
      toast.error('Failed to load settings');
    } else {
      setConfig(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Upsert all config values (Supabase update on multiple rows isn't easily batched without upsert)
      const { error } = await (supabase.from('config') as any).upsert(
        config.map(c => ({ key: c.key, value: c.value, notes: c.notes }))
      );
      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateConfigValue = (key: string, value: string) => {
    setConfig(prev => prev.map(c => c.key === key ? { ...c, value } : c));
  };

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--muted)' }}>Loading settings...</div>;
  }

  // Group config logically
  const monitoringGroup = config.filter(c => c.key.startsWith('MONITOR_'));
  const uiGroup = config.filter(c => c.key.startsWith('UI_'));
  const examGroup = config.filter(c => c.key.startsWith('EXAM_') || c.key.startsWith('ALLOW_'));
  const thresholdGroup = config.filter(c => c.key.includes('_SCORE') || c.key.includes('_VIOLATIONS') || c.key.includes('_TIMEOUT'));
  const otherGroup = config.filter(c => !monitoringGroup.includes(c) && !uiGroup.includes(c) && !examGroup.includes(c) && !thresholdGroup.includes(c));

  const renderGroup = (title: string, group: ConfigRow[]) => {
    if (group.length === 0) return null;
    return (
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 16, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
          {title}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {group.map(c => (
            <div key={c.key}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>
                {c.key}
              </label>
              {c.value === 'TRUE' || c.value === 'FALSE' ? (
                <select
                  value={c.value}
                  onChange={e => updateConfigValue(c.key, e.target.value)}
                  className="focus-ring"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', background: 'var(--canvas)' }}
                >
                  <option value="TRUE">TRUE</option>
                  <option value="FALSE">FALSE</option>
                </select>
              ) : (
                <input
                  value={c.value}
                  onChange={e => updateConfigValue(c.key, e.target.value)}
                  className="focus-ring"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', background: 'var(--canvas)' }}
                />
              )}
              {c.notes && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{c.notes}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>Global Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 4 }}>
            Configure monitoring flags, UI toggles, and penalty thresholds.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            background: saving ? 'var(--subtle)' : 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <form onSubmit={handleSave}>
          {renderGroup('Monitoring Modules', monitoringGroup)}
          {renderGroup('Exam & Access Rules', examGroup)}
          {renderGroup('Thresholds & Deductions', thresholdGroup)}
          {renderGroup('Student UI Toggles', uiGroup)}
          {renderGroup('Other Configuration', otherGroup)}
        </form>
      </div>
    </div>
  );
}
