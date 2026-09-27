'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const items = [['Dashboard', '/dashboard', '◫'], ['Leads', '/leads', '☷'], ['Calling', '/calling', '↗'], ['Pipeline', '/pipeline', '▥'], ['Calendar', '/calendar', '▦'], ['Analytics', '/analytics', '▤'], ['Settings', '/settings', '⚙']];
export function Navigation() {
  const path = usePathname();
  return <nav aria-label="Main navigation">{items.map(([label, href, icon]) => <Link key={href} href={href} className={path === href || path.startsWith(href+'/') ? 'nav-item active' : 'nav-item'} aria-current={path === href ? 'page' : undefined}><span aria-hidden="true">{icon}</span>{label}{!['Dashboard','Leads','Calling','Pipeline','Calendar','Analytics','Settings'].includes(label) && <small>Upcoming</small>}</Link>)}</nav>;
}




