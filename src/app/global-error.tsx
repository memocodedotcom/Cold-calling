'use client';

export default function GlobalError() {
  return <html lang="en"><body style={{ fontFamily: 'system-ui, sans-serif', margin: '4rem auto', padding: '1.5rem', maxWidth: '36rem' }}>
    <main><h1>Relay could not load.</h1>
      <p>Please reload this page. If the problem continues, contact your administrator.</p>
      <button style={{ minHeight: 44, padding: '0.75rem 1.25rem', fontSize: 16 }} onClick={() => window.location.reload()}>Reload page</button>
    </main>
  </body></html>;
}
