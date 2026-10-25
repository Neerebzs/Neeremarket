import React from 'react';
import styles from './TailMetricCard.module.css';

export interface TailMetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  subtitle?: string;
}

export function TailMetricCard({
  label,
  value,
  trend,
  icon,
  subtitle,
}: TailMetricCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.iconBox} aria-hidden="true">
          {icon || (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )}
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.label}>{label}</span>
      </div>

      <div className={styles.valueRow}>
        <strong className={styles.value}>{value}</strong>
        {trend && (
          <span
            className={`${styles.trendPill} ${
              trend.isPositive ? styles.trendUp : styles.trendDown
            }`}
          >
            {trend.isPositive ? (
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9.5V2.5M2.5 6L6 2.5L9.5 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2.5V9.5M2.5 6L6 9.5L9.5 6" />
              </svg>
            )}
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </article>
  );
}
