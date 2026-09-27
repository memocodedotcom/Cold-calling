import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabaseConfig, supabaseConfig } from '@/lib/supabase/config';
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!hasSupabaseConfig()) {
    const setup = path === '/setup' ? NextResponse.next() : NextResponse.redirect(new URL('/setup', request.url));
    setup.headers.set('Cache-Control', 'private, no-store');
    return setup;
  }
  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (items) => {
      items.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });
  const { data, error } = await supabase.auth.getClaims();
  const authenticated = !error && Boolean(data?.claims);
  let destination: string | undefined;
  if (!authenticated && path !== '/login' && path !== '/setup') destination = '/login';
  if (authenticated && (path === '/login' || path === '/setup')) destination = '/dashboard';
  if (destination) {
    const redirect = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    redirect.headers.set('Cache-Control', 'private, no-store');
    return redirect;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'] };
