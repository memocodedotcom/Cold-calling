import Link from 'next/link';
import { LoginForm } from '@/components/forms';
export default function LoginPage() {
  return <main className="auth"><section className="auth-story"><Link className="brand" href="/">▰ <span>relay<span className="brand-dot">.</span></span></Link><div><span className="eyebrow">YOUR OUTBOUND WORKSPACE</span><h1>Good conversations<br/>start with focus.</h1><p>A clear workspace for your prospects, conversations, and next steps.</p></div><span className="auth-footer">SMART COLD CALLING CRM</span></section><section className="auth-panel"><div className="login-box"><span className="eyebrow">WELCOME BACK</span><h2>Let’s get to work.</h2><p className="muted">Sign in with your company account.</p><LoginForm/><p className="help">Need an account or a password reset?<br/>Contact your workspace administrator.</p></div></section></main>;
}
