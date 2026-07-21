import { Users, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  metrics: {
    active: number;
    completed: number;
    terminated: number;
    alerts: number;
  };
}

export function DashboardMetrics({ metrics }: Props) {
  const cards = [
    { label: 'Active Sessions', value: metrics.active, icon: Users, color: 'var(--brand)', bg: 'var(--brand-light)' },
    { label: 'Completed', value: metrics.completed, icon: CheckCircle, color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' },
    { label: 'Terminated', value: metrics.terminated, icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-light)' },
    { label: 'Critical Alerts', value: metrics.alerts, icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(234, 179, 8, 0.1)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: card.bg,
              color: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                {card.label}
              </div>
              <div style={{ color: 'var(--ink)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                {card.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
