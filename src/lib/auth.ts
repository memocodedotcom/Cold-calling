import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { hasSupabaseConfig } from './supabase/config';
export type Profile = { id: string; full_name: string; email: string; role: 'admin' | 'sales' };
export const requireProfile = cache(async () => {
  if (!hasSupabaseConfig()) redirect('/setup');
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id,full_name,email,role').eq('id', user.id).single();
  if (profileError || !profile) throw new Error('Your profile could not be loaded. Ask your administrator to check the database setup.');
  return { supabase, profile: profile as Profile };
});
