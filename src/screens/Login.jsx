import { useEffect, useState } from 'react';
import { login, builtInCredentials } from '../lib/auth.js';
import { errorMessage, IS_DEMO } from '../lib/pb.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preset, setPreset] = useState(null);

  // Standalone mode ships a built-in administrator. Pre-fill it so the app is
  // usable the moment it loads, rather than making you find the credentials.
  useEffect(() => {
    let cancelled = false;
    builtInCredentials().then((credentials) => {
      if (cancelled || !credentials) return;
      setPreset(credentials);
      setEmail(credentials.email);
      setPassword(credentials.password);
    });
    return () => { cancelled = true; };
  }, []);

  async function signIn(withEmail, withPassword) {
    setError('');
    setBusy(true);
    try {
      await login(withEmail.trim(), withPassword);
      // useAuth picks up the authStore change and swaps in the app shell.
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in. Check your email and password.'));
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form
        className="auth-card"
        onSubmit={(event) => { event.preventDefault(); signIn(email, password); }}
      >
        <div className="auth-brand">OMEGA</div>
        <div className="auth-tag">Trader Brothers</div>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        {preset && (
          <div className="auth-preset">
            <strong>Built-in administrator</strong>
            <div className="auth-preset-creds">
              <span>{preset.email}</span>
              <span>{preset.password}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: 10 }}
              disabled={busy}
              onClick={() => signIn(preset.email, preset.password)}
            >
              Sign in as administrator
            </button>
            <p className="auth-preset-note">
              Sample data only — this build has no server behind it, so nothing you
              enter is saved and these credentials protect nothing.
            </p>
          </div>
        )}

        {IS_DEMO && !preset && <div className="spinner" style={{ padding: 12 }}>…</div>}
      </form>
    </div>
  );
}
