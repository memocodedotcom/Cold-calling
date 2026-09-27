import type { Metadata } from 'next';
import './globals.css';
import './leads.css';
import './import.css';
import './calling.css';
import './pipeline.css';
import './calendar.css';
import './analytics.css';
import './mobile.css';
export const metadata: Metadata = { title: 'Relay — Sales workspace', description: 'Your workspace for focused outbound sales.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
