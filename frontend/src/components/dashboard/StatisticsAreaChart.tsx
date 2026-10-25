import { useState, useId } from 'react';
import styles from './StatisticsAreaChart.module.css';

export type StatisticsTab = 'Overview' | 'Sales' | 'Revenue';

export interface StatisticsPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface StatisticsAreaChartProps {
  title?: string;
  subtitle?: string;
  dateRangeText?: string;
  activeTab?: StatisticsTab;
  onTabChange?: (tab: StatisticsTab) => void;
  currencySymbol?: string;
}

const DEFAULT_POINTS: StatisticsPoint[] = [
  { label: 'Mon', value: 165, secondaryValue: 140 },
  { label: 'Tue', value: 190, secondaryValue: 175 },
  { label: 'Wed', value: 172, secondaryValue: 155 },
  { label: 'Thu', value: 182, secondaryValue: 168 },
  { label: 'Fri', value: 178, secondaryValue: 160 },
  { label: 'Sat', value: 215, secondaryValue: 195 },
  { label: 'Sun', value: 235, secondaryValue: 205 },
];

export function StatisticsAreaChart({
  title = 'Statistics',
  subtitle = "Target you've set for each month",
  dateRangeText = 'Mar 6, 2025 - Mar 12, 2025',
  activeTab = 'Overview',
  onTabChange,
  currencySymbol = '',
}: StatisticsAreaChartProps) {
  const [selectedTab, setSelectedTab] = useState<StatisticsTab>(activeTab);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const gradientId = useId();

  const handleTabClick = (tab: StatisticsTab) => {
    setSelectedTab(tab);
    onTabChange?.(tab);
  };

  const points = DEFAULT_POINTS;

  // Chart coordinate space
  const svgWidth = 800;
  const svgHeight = 260;
  const chartTop = 20;
  const chartBottom = 220;
  const chartLeft = 50;
  const chartRight = 770;
  const chartPlotWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const minY = 100;
  const maxY = 250;
  const yTicks = [250, 200, 150];

  const scaleY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return chartBottom - ((clamped - minY) / (maxY - minY)) * chartHeight;
  };

  const scaleX = (idx: number) => {
    return chartLeft + (idx / (points.length - 1)) * chartPlotWidth;
  };

  // Generate smooth cubic bezier curve path for SVG
  const generateSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const controlX1 = current.x + (next.x - current.x) * 0.45;
      const controlY1 = current.y;
      const controlX2 = current.x + (next.x - current.x) * 0.55;
      const controlY2 = next.y;
      d += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const mainPoints = points.map((p, i) => ({ x: scaleX(i), y: scaleY(p.value) }));
  const mainLinePath = generateSmoothPath(mainPoints);
  const areaPath = `${mainLinePath} L ${chartRight} ${chartBottom} L ${chartLeft} ${chartBottom} Z`;

  // Secondary soft line path
  const secPoints = points.map((p, i) => ({
    x: scaleX(i),
    y: scaleY(p.secondaryValue ?? p.value * 0.88),
  }));
  const secLinePath = generateSmoothPath(secPoints);

  return (
    <div className={styles.card}>
      {/* Header with Title + Controls (Tabs + Date Range) */}
      <div className={styles.head}>
        <div className={styles.headText}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.controlsRow}>
          {/* Segmented Pill Tabs */}
          <div className={styles.tabsWrap} role="tablist">
            {(['Overview', 'Sales', 'Revenue'] as StatisticsTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selectedTab === tab}
                className={`${styles.tabBtn} ${selectedTab === tab ? styles.tabBtnActive : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Date Range Pill */}
          <button
            type="button"
            className={styles.dateRangeBtn}
            aria-label="Filter date range"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{dateRangeText}</span>
          </button>
        </div>
      </div>

      {/* Main SVG Area Chart */}
      <div className={styles.chartWrap}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.svg}
          preserveAspectRatio="none"
          role="img"
          aria-label="Statistics chart"
        >
          <defs>
            <linearGradient id={`fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#465FFF" stopOpacity="0.22" />
              <stop offset="90%" stopColor="#465FFF" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#465FFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {yTicks.map((tick) => {
            const yPos = scaleY(tick);
            return (
              <g key={`ytick-${tick}`}>
                <text
                  x={chartLeft - 12}
                  y={yPos + 4}
                  textAnchor="end"
                  className={styles.yTickText}
                >
                  {tick}
                </text>
                <line
                  x1={chartLeft}
                  y1={yPos}
                  x2={chartRight}
                  y2={yPos}
                  className={styles.gridLine}
                />
              </g>
            );
          })}

          {/* Gradient Under-Fill Area */}
          <path d={areaPath} fill={`url(#fill-${gradientId})`} />

          {/* Secondary Soft Line */}
          <path
            d={secLinePath}
            fill="none"
            stroke="#C7D2FE"
            strokeWidth="2"
            strokeDasharray="4 4"
            className={styles.secLine}
          />

          {/* Primary Main Line */}
          <path
            d={mainLinePath}
            fill="none"
            stroke="#465FFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={styles.mainLine}
          />

          {/* Data Points on Main Line */}
          {mainPoints.map((pt, idx) => {
            const isHovered = hoveredPoint === idx;
            return (
              <g
                key={`point-${points[idx].label}`}
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
                tabIndex={0}
                role="button"
                aria-label={`${points[idx].label}: ${points[idx].value} ${currencySymbol}`}
                className={styles.pointGroup}
              >
                {/* Invisible hover hotspot */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  className={`${styles.pointCircle} ${
                    isHovered ? styles.pointCircleHovered : ''
                  }`}
                />

                {/* X-axis Day Label */}
                <text
                  x={pt.x}
                  y={chartBottom + 22}
                  textAnchor="middle"
                  className={`${styles.xLabel} ${isHovered ? styles.xLabelActive : ''}`}
                >
                  {points[idx].label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint !== null && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(mainPoints[hoveredPoint].x / svgWidth) * 100}%`,
              top: `${(mainPoints[hoveredPoint].y / svgHeight) * 100}%`,
            }}
          >
            <strong>{points[hoveredPoint].label}</strong>: {points[hoveredPoint].value} {currencySymbol}
          </div>
        )}
      </div>
    </div>
  );
}
