import { useState } from 'react';
import type { SellerOrder } from '@/api/hooks';
import { formatRwf } from '@/utils/money';
import styles from './OrderValueChart.module.css';

const PAID_STATUSES = new Set(['PAID', 'CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']);
const dayKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

export function OrderValueChart({ orders }: { orders: SellerOrder[] }) {
  const [days, setDays] = useState(7);
  const now = new Date();
  const series = Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getTime() - (days - index - 1) * 86_400_000);
    return { key: dayKey(date), date, value: 0, count: 0 };
  });
  const byDay = new Map(series.map(day => [day.key, day]));
  for (const order of orders) {
    const date = new Date(order.createdAt);
    if (!Number.isFinite(date.getTime()) || !PAID_STATUSES.has(order.status)) continue;
    const day = byDay.get(dayKey(date));
    if (day) { day.value += Number(order.subtotal); day.count++; }
  }
  const max = Math.max(1, ...series.map(day => day.value));
  const total = series.reduce((sum, day) => sum + day.value, 0);
  return <section className={styles.panel} aria-labelledby="order-value-title">
    <header className={styles.head}><div><h2 id="order-value-title">Paid order value</h2><p>By order creation date · Kigali time · excludes cancelled orders</p></div>
      <label>Reporting period<select value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></label>
    </header>
    <strong className={styles.total}>{formatRwf(total)}</strong>
    <p className={styles.hint}>Product subtotals from your order records. Available funds and net earnings are shown separately in finances.</p>
    <div className={styles.chart} role="img" aria-label={`${formatRwf(total)} in paid order value over the last ${days} days. A daily breakdown follows.`}>
      {series.map(day => <div key={day.key} className={styles.column} title={`${day.key}: ${formatRwf(day.value)} (${day.count} orders)`}><span style={{ height: `${day.value / max * 100}%` }} /></div>)}
    </div>
    <div className={styles.axis}><span>{series[0].key}</span><span>{series[series.length - 1].key}</span></div>
    <details className={styles.details}><summary>View daily figures</summary><div className={styles.tableWrap}><table><caption className="sr-only">Daily paid order value</caption><thead><tr><th scope="col">Date</th><th scope="col">Orders</th><th scope="col">Order value</th></tr></thead><tbody>{series.map(day => <tr key={day.key}><td>{day.key}</td><td>{day.count}</td><td>{formatRwf(day.value)}</td></tr>)}</tbody></table></div></details>
  </section>;
}
