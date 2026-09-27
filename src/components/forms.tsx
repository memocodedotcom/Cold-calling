'use client';
import { useActionState } from 'react';
import { login, updateProfile, updateRole, type ActionState } from '@/app/actions';
import type { Profile } from '@/lib/auth';
function Feedback({ state }: { state: ActionState }) {
  return <div aria-live="polite">{state.error && <p className="feedback error" role="alert">{state.error}</p>}{state.success && <p className="feedback success">{state.success}</p>}</div>;
}
export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return <form action={action} className="form"><label>Email address<input name="email" type="email" autoComplete="username" placeholder="you@company.com" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required maxLength={1024}/></label><Feedback state={state}/><button className="button" disabled={pending}>{pending ? 'Signing in…' : 'Sign in to workspace →'}</button></form>;
}
export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  return <form action={action} className="form"><label>Full name<input name="name" defaultValue={profile.full_name} required minLength={2} maxLength={100}/></label><label>Email address<input value={profile.email} readOnly/></label><p className="muted">Your administrator manages your email and access.</p><Feedback state={state}/><button className="button" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</button></form>;
}
export function RoleForm({ user, self }: { user: Profile; self: boolean }) {
  const [state, action, pending] = useActionState(updateRole, {});
  return <form action={action}><input type="hidden" name="userId" value={user.id}/><div className="role-controls"><select name="role" defaultValue={user.role} aria-label={`Role for ${user.full_name}`} disabled={self || pending}><option value="sales">Sales user</option><option value="admin">Admin</option></select>{!self && <button className="button secondary" disabled={pending}>{pending ? 'Saving…' : 'Update'}</button>}{self && <span className="muted">You</span>}</div><Feedback state={state}/></form>;
}
