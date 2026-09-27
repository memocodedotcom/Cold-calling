'use client';
import Link from 'next/link';
export default function ErrorPage({ retry }: { retry: () => void }) {
  return <main className="setup"><h1>We couldn’t load this page.</h1><p className="muted">Please try again. If this continues, ask your administrator to check your account and database connection.</p><button className="button" onClick={retry}>Try again</button><Link className="text-button" href="/login">Return to sign in</Link></main>;
}

