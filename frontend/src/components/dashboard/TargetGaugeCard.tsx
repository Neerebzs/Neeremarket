import styles from './TargetGaugeCard.module.css';

export interface TargetGaugeCardProps {
  title?: string;
  subtitle?: string;
  percentage?: number;
  trendPercentage?: string;
  feedbackMessage?: string;
  targetLabel?: string;
  targetValue?: string;
  targetTrend?: 'up' | 'down';
  revenueLabel?: string;
  revenueValue?: string;
  revenueTrend?: 'up' | 'down';
  todayLabel?: string;
  todayValue?: string;
  todayTrend?: 'up' | 'down';
  onMenuClick?: () => void;
}

export function TargetGaugeCard({
  title = 'Monthly Target',
  subtitle = "Target you've set for each month",
  percentage = 75.55,
  trendPercentage = '+10%',
  feedbackMessage = "Store revenue is trending higher than last month. Keep up your good work!",
  targetLabel = 'Target',
  targetValue = '$20K',
  targetTrend = 'down',
  revenueLabel = 'Revenue',
  revenueValue = '$20K',
  revenueTrend = 'up',
  todayLabel = 'Today',
  todayValue = '$20K',
  todayTrend = 'up',
  onMenuClick,
}: TargetGaugeCardProps) {
  // Arc calculation: Radius = 95, length = Math.PI * 95 = 298.45
  const radius = 95;
  const arcLength = Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeOffset = arcLength - (clampedPercentage / 100) * arcLength;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.head}>
        <div className={styles.headText}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label="Target options"
          title="More options"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      {/* Semi-circle Gauge Center */}
      <div className={styles.gaugeContainer}>
        <div className={styles.gaugeWrap}>
          <svg
            viewBox="0 0 240 135"
            className={styles.gaugeSvg}
            aria-label={`Target progress: ${percentage}%`}
          >
            {/* Background Arc */}
            <path
              d="M 25 125 A 95 95 0 0 1 215 125"
              fill="none"
              stroke="#E4E7EC"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Active Filled Arc */}
            <path
              d="M 25 125 A 95 95 0 0 1 215 125"
              fill="none"
              stroke="#465FFF"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeOffset}
              className={styles.activeArc}
            />
          </svg>

          {/* Central metrics inside the semi-circle */}
          <div className={styles.gaugeCenter}>
            <span className={styles.percentText}>{percentage}%</span>
            {trendPercentage && (
              <span className={styles.trendBadge}>{trendPercentage}</span>
            )}
          </div>
        </div>

        {/* Motivational Feedback Message */}
        {feedbackMessage && (
          <p className={styles.feedbackMessage}>{feedbackMessage}</p>
        )}
      </div>

      {/* Footer 3 Metrics with vertical dividers */}
      <div className={styles.footerRow}>
        <div className={styles.statCol}>
          <span className={styles.statLabel}>{targetLabel}</span>
          <div className={styles.statValueRow}>
            <strong>{targetValue}</strong>
            <span className={targetTrend === 'up' ? styles.arrowUp : styles.arrowDown}>
              {targetTrend === 'up' ? '↑' : '↓'}
            </span>
          </div>
        </div>

        <span className={styles.divider} aria-hidden="true" />

        <div className={styles.statCol}>
          <span className={styles.statLabel}>{revenueLabel}</span>
          <div className={styles.statValueRow}>
            <strong>{revenueValue}</strong>
            <span className={revenueTrend === 'up' ? styles.arrowUp : styles.arrowDown}>
              {revenueTrend === 'up' ? '↑' : '↓'}
            </span>
          </div>
        </div>

        <span className={styles.divider} aria-hidden="true" />

        <div className={styles.statCol}>
          <span className={styles.statLabel}>{todayLabel}</span>
          <div className={styles.statValueRow}>
            <strong>{todayValue}</strong>
            <span className={todayTrend === 'up' ? styles.arrowUp : styles.arrowDown}>
              {todayTrend === 'up' ? '↑' : '↓'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
