import Link from 'next/link';

export default function NotFound() {
  return <main className="setup"><h1>This page is unavailable.</h1>
    <p className="muted">The link may be outdated, or this record may no longer be available to your account.</p>
    <Link className="button" href="/dashboard">Return to dashboard</Link>
  </main>;
}
