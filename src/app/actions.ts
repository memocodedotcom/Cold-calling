'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
export type ActionState = { error?: string; success?: string };
export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || email.length > 254 || !password || password.length > 1024) return { error: 'Enter a valid email and password.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Unable to sign in. Check your details or contact your administrator.' };
  redirect('/dashboard');
}
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Sign out failed. Please try again.');
  redirect('/login');
}
export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireProfile();
  const name = String(form.get('name') ?? '').trim();
  if (name.length < 2 || name.length > 100) return { error: 'Use a name between 2 and 100 characters.' };
  const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
  if (error) return { error: 'Your changes could not be saved. Please try again.' };
  revalidatePath('/', 'layout');
  return { success: 'Profile updated.' };
}
export async function updateRole(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== 'admin') return { error: 'Administrator access required.' };
  const id = String(form.get('userId') ?? '');
  const role = String(form.get('role') ?? '');
  if (!/^[\da-f-]{36}$/i.test(id) || !['admin', 'sales'].includes(role)) return { error: 'Choose a valid user and role.' };
  const { error } = await supabase.rpc('set_user_role', { target_id: id, new_role: role });
  if (error) return { error: 'Role could not be changed. You cannot change your own role.' };
  revalidatePath('/settings');
  return { success: 'Role updated.' };
}
