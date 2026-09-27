import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { Navigation } from '@/components/navigation';
import { logout } from '@/app/actions';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  return <div className="workspace"><a href="#main" className="skip-link">Skip to content</a><aside className="sidebar"><Link href="/dashboard" className="brand">▰ <span>relay.</span></Link><div className="workspace-label">SALES WORKSPACE</div><Navigation/><div className="sidebar-bottom"><span className="avatar">{profile.full_name.slice(0, 1).toUpperCase() || 'U'}</span><div><strong>{profile.full_name || 'Team member'}</strong><span>{profile.role === 'admin' ? 'Administrator' : 'Sales user'}</span></div></div></aside><div className="workspace-body"><header className="header"><span>Workspace <span className="header-slash">/</span> Outbound sales</span><form action={logout}><button className="text-button">Sign out ↗</button></form></header><main id="main" className="main">{children}</main><footer className="workspace-footer">RELAY / OUTBOUND OPERATING SYSTEM <span>Your daily sales workspace</span></footer></div></div>;
}



