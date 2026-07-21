'use client';

import { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { getScoreSeverity } from '@/lib/utils/constants';
import type { Database } from '@/lib/supabase/types';
import { ShieldAlert, ShieldCheck, ShieldBan, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type SessionRow = Database['public']['Tables']['sessions']['Row'];

const columnHelper = createColumnHelper<SessionRow>();

interface Props {
  data: SessionRow[];
  onTerminateSession: (sessionId: string) => void;
  onAllowRetake: (sessionId: string) => void;
  loading: boolean;
}

export function SessionsGrid({ data, onTerminateSession, onAllowRetake, loading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'score', desc: false } // Default sort by lowest score first
  ]);

  const columns = [
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        if (status === 'ACTIVE') return <span style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={16} /> Active</span>;
        if (status === 'COMPLETED') return <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={16} /> Completed</span>;
        if (status === 'TERMINATED') return <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}><ShieldBan size={16} /> Terminated</span>;
        return <span style={{ color: 'var(--muted)' }}>{status}</span>;
      },
    }),
    columnHelper.accessor('email', {
      header: 'Student',
      cell: info => <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{info.getValue() || 'Anonymous'}</div>,
    }),
    columnHelper.accessor('score', {
      header: 'Integrity Score',
      cell: info => {
        const score = info.getValue();
        const severity = getScoreSeverity(score);
        const color = severity === 'ok' ? 'var(--success)' : severity === 'warning' ? 'var(--warning)' : 'var(--danger)';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: color,
            }} />
            <span style={{ fontWeight: 600, color }}>{score}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('violations', {
      header: 'Violations',
      cell: info => {
        const violations = info.getValue();
        return (
          <span style={{ color: violations > 0 ? 'var(--danger)' : 'var(--muted)' }}>
            {violations}
          </span>
        );
      },
    }),
    columnHelper.accessor('last_seen', {
      header: 'Last Seen',
      cell: info => {
        const date = info.getValue();
        if (!date) return '-';
        return <span style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDistanceToNow(new Date(date), { addSuffix: true })}</span>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: info => {
        const session = info.row.original;
        
        if (session.status === 'ACTIVE') {
          return (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to terminate ${session.email}'s exam?`)) {
                  onTerminateSession(session.id);
                }
              }}
              className="focus-ring"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--danger)',
                background: 'transparent',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ShieldAlert size={14} />
              Terminate
            </button>
          );
        }

        return (
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to allow ${session.email} to retake the exam? This will delete their current submission.`)) {
                onAllowRetake(session.id);
              }
            }}
            className="focus-ring"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--brand)',
              background: 'transparent',
              border: '1px solid var(--brand)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RotateCcw size={14} />
            Allow Retake
          </button>
        );
      }
    })
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} style={{ borderBottom: '1px solid var(--line)', background: 'var(--soft)' }}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ 
                      padding: '12px 16px', 
                      fontSize: 13, 
                      fontWeight: 600, 
                      color: 'var(--muted)',
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' ↑',
                        desc: ' ↓',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                  Loading sessions...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                  No active sessions found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{ padding: '12px 16px', fontSize: 14 }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
