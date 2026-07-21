'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  BarChart
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // If we are on the login page, don't show the sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Live Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Forms', href: '/admin/dashboard/forms', icon: FileText },
    { name: 'Roster', href: '/admin/dashboard/roster', icon: Users },
    { name: 'Reports', href: '/admin/dashboard/reports', icon: BarChart },
    { name: 'Settings', href: '/admin/dashboard/settings', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--canvas)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'block',
          }}
          className="md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside 
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: 256,
          background: 'var(--panel)',
          borderRight: '1px solid var(--line)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s',
        }}
        className="md:translate-x-0"
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>ExamGuard</span>
          </div>
          <button 
            className="md:hidden" 
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="focus-ring"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--brand)' : 'var(--muted)',
                  background: isActive ? 'var(--brand-light)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '20px 12px', borderTop: '1px solid var(--line)' }}>
          <button
            onClick={handleLogout}
            className="focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          marginLeft: 0,
        }}
        className="md:ml-64"
      >
        {/* Mobile Header */}
        <header 
          className="md:hidden"
          style={{
            height: 60,
            background: 'var(--panel)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={24} />
          </button>
          <span style={{ marginLeft: 16, fontWeight: 600 }}>ExamGuard</span>
        </header>

        <main style={{ flex: 1, padding: '24px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
