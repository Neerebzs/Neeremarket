import { useState } from 'react';
import type { SellerOrder } from '@/api/hooks';
import { formatRwf } from '@/utils/money';
import styles from './OrderValueChart.module.css';

const PAID_STATUSES = new Set([
  'PAID',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_SHIPMENT',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
]);

const dayKey = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const dayLabel = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);

export function OrderValueChart({ orders }: { orders: SellerOrder[] }) {
  const [days, setDays] = useState<7 | 30>(7);
  const [activeDay, setActiveDay] = useState<{
    key: string;
    label: string;
    value: number;
    count: number;
  } | null>(null);

  const now = new Date();
  const series = Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getTime() - (days - index - 1) * 86_400_000);
    return {
      key: dayKey(date),
      label: dayLabel(date),
      date,
      value: 0,
      count: 0,
    };
  });

  const byDay = new Map(series.map((day) => [day.key, day]));
  for (const order of orders) {
    const date = new Date(order.createdAt);
    if (!Number.isFinite(date.getTime()) || !PAID_STATUSES.has(order.status)) continue;
    const day = byDay.get(dayKey(date));
    if (day) {
      day.value += Number(order.subtotal);
      day.count++;
    }
  }

  const max = Math.max(1, ...series.map((day) => day.value));
  const total = series.reduce((sum, day) => sum + day.value, 0);
  const totalOrders = series.reduce((sum, day) => sum + day.count, 0);
  const avgDaily = Math.round(total / days);

  return (
    <section className={styles.card} aria-labelledby="order-value-title">
      <header className={styles.head}>
        <div className={styles.headInfo}>
          <div className={styles.taglineRow}>
            <span className={styles.kicker}>Sales Analytics</span>
            <span className={styles.timeZoneBadge}>Africa/Kigali Time</span>
          </div>
          <h2 id="order-value-title" className={styles.title}>
            Paid Order Revenue
          </h2>
          <p className={styles.subtitle}>
            Order volume and transaction subtotals across Kigali and Rwandan delivery routes.
          </p>
        </div>

        {/* Segmented Period Switcher */}
        <div className={styles.segmentedControls} role="radiogroup" aria-label="Reporting period">
          <button
            type="button"
            className={`${styles.segmentBtn} ${days === 7 ? styles.segmentActive : ''}`}
            onClick={() => setDays(7)}
            aria-checked={days === 7}
            role="radio"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${days === 30 ? styles.segmentActive : ''}`}
            onClick={() => setDays(30)}
            aria-checked={days === 30}
            role="radio"
          >
            Last 30 Days
          </button>
        </div>
      </header>

      {/* Highlights summary banner */}
      <div className={styles.summaryBar}>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Total Period Revenue</span>
          <strong className={styles.statValue}>{formatRwf(total)}</strong>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Paid Orders</span>
          <strong className={styles.statValueSecondary}>{totalOrders} orders</strong>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Daily Average</span>
          <strong className={styles.statValueSecondary}>{formatRwf(avgDaily)}/day</strong>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div
        className={styles.chartArea}
        role="img"
        aria-label={`${formatRwf(total)} in paid order revenue across ${days} days.`}
      >
        <div className={styles.gridLines}>
          <span className={styles.gridLine} />
          <span className={styles.gridLine} />
          <span className={styles.gridLine} />
        </div>

        <div className={styles.barsContainer}>
          {series.map((day) => {
            const heightPercent = day.value > 0 ? Math.max(6, (day.value / max) * 100) : 0;
            const isHovered = activeDay?.key === day.key;

            return (
              <div
                key={day.key}
                className={styles.barColumn}
                onMouseEnter={() => setActiveDay(day)}
                onMouseLeave={() => setActiveDay(null)}
                tabIndex={0}
                role="button"
                aria-label={`${day.label}: ${formatRwf(day.value)} (${day.count} orders)`}
              >
                <div className={styles.barTrack}>
                  {heightPercent > 0 ? (
                    <div
                      className={`${styles.barFill} ${isHovered ? styles.barFillActive : ''}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  ) : (
                    <div className={styles.barZeroDot} />
                  )}
                </div>

                {/* Individual Bar Floating Tooltip */}
                {isHovered && (
                  <div className={styles.tooltip}>
                    <strong className={styles.tooltipDate}>{day.label}</strong>
                    <div className={styles.tooltipValue}>{formatRwf(day.value)}</div>
                    <div className={styles.tooltipCount}>{day.count} {day.count === 1 ? 'order' : 'orders'}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Horizontal Axis Labels */}
      <div className={styles.axisLabels}>
        <span>{series[0].label}</span>
        {days === 30 && <span>{series[Math.floor(series.length / 2)].label}</span>}
        <span>{series[series.length - 1].label}</span>
      </div>

      {/* Accessible Table Breakdown Details */}
      <details className={styles.details}>
        <summary className={styles.summaryToggle}>
          <span>View daily transaction figures</span>
          <svg viewBox="0 0 24 24" className={styles.summaryChevron} aria-hidden="true">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Completed Orders</th>
                <th scope="col">Order Value (RWF)</th>
              </tr>
            </thead>
            <tbody>
              {series.map((day) => (
                <tr key={day.key}>
                  <td>{day.label}</td>
                  <td>{day.count}</td>
                  <td className={styles.num}>{formatRwf(day.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
