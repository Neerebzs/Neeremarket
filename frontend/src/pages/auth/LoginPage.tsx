import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLogin, useGoogleAuth } from '@/api/hooks';
import { getErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { APP_NAME } from '@/config/brand';
import { postLoginPath } from '@/utils/auth';
import { PasswordToggle } from './PasswordToggle';
import styles from './Auth.module.css';

function isEmail(value: string) {
  return value.includes('@');
}

export function LoginPage() {
  const login = useLogin();
  const googleAuth = useGoogleAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextParam = params.get('next');
  const joinTo = nextParam ? `/register?next=${encodeURIComponent(nextParam)}` : '/register';

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = login.isPending || googleAuth.isPending;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = account.trim();
    try {
      const data = await login.mutateAsync(
        isEmail(trimmed) ? { email: trimmed, password } : { phone: trimmed, password },
      );
      navigate(postLoginPath(data.user.roles, nextParam), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Sign in failed'));
    }
  }

  async function onGoogle(idToken: string) {
    setError(null);
    try {
      const data = await googleAuth.mutateAsync({ idToken });
      navigate(postLoginPath(data.user.roles, nextParam), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Google sign-in failed'));
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <Helmet>
        <title>{`Sign In | ${APP_NAME}`}</title>
      </Helmet>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>YOUR MARKETPLACE, CONNECTED</p>
        <h1>Welcome back.</h1>
        <p>Sign in to shop, manage your store, and keep things moving.</p>
      </div>
      {error ? (
        <div className={styles.alert}>
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <label className={styles.field}>
        <span className={styles.label}>Email or phone number</span>
        <input
          className={styles.input}
          type="text"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          required
          autoComplete="username"
          placeholder="Enter your email or phone number"
          autoCapitalize="none"
          spellCheck={false}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          Password
          <Link to="/help" className={styles.forgot}>
            Forgot password?
          </Link>
        </span>
        <span className={styles.passwordWrap}>
          <input
            className={styles.input}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
          <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        </span>
      </label>

      <div className={styles.actions}>
        <button type="submit" className={styles.signIn} disabled={busy}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </div>

      <GoogleSignIn onCredential={onGoogle} onError={setError} disabled={busy} />

      <p className={styles.footHelp}>
        <span>
          New to {APP_NAME}? <Link to={joinTo}>Create an account</Link>
        </span>
      </p>
    </form>
  );
}
