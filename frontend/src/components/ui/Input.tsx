import { useId, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className = '', ...rest }: Props) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const describedBy = [rest['aria-describedby'], error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <label className={`${styles.field} ${className}`} htmlFor={inputId}>
      <span>{label}</span>
      <input {...rest} id={inputId} aria-invalid={error ? true : rest['aria-invalid']} aria-describedby={describedBy} />
      {error ? (
        <em id={errorId} className={styles.error} role="alert">
          {error}
        </em>
      ) : null}
    </label>
  );
}
