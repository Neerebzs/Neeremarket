import { useEffect, useRef } from 'react';
import styles from '@/pages/auth/Auth.module.css';

type GoogleCredentialResponse = { credential?: string };

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let googleScript: Promise<void> | null = null;

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScript) return googleScript;
  googleScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-gsi="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
  return googleScript;
}

type Props = {
  onCredential: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  label?: string;
};

export function GoogleSignIn({
  onCredential,
  onError,
  disabled,
  label = 'or continue with',
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId || !hostRef.current) return;
    const el = hostRef.current;
    let cancelled = false;

    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !el) return;
        el.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: (response) => {
            if (response.credential) void callbackRef.current(response.credential);
          },
        });
        window.google.accounts.id.renderButton(el, {
          type: 'standard',
          shape: 'rectangular',
          text: 'continue_with',
          width: String(Math.min(320, Math.max(200, Math.floor(el.getBoundingClientRect().width)))),
          theme: 'outline',
          size: 'large',
        });
      })
      .catch(() => {
        if (!cancelled) onError?.('Could not load Google Sign-In');
      });

    return () => {
      cancelled = true;
      el.innerHTML = '';
    };
  }, [clientId, onError]);

  useEffect(() => {
    if (hostRef.current) hostRef.current.inert = Boolean(disabled);
  }, [disabled]);

  if (!clientId) return null;

  return (
    <div className={styles.social}>
      <p className={styles.socialLabel}>{label}</p>
      <div className={styles.socialLogos}>
        <div className={styles.googleWrap} aria-disabled={disabled || undefined}>
          <div ref={hostRef} className={styles.googleHit} aria-label="Continue with Google" />
        </div>
      </div>
    </div>
  );
}
