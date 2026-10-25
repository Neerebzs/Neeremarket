import { useState, useId } from 'react';
import styles from './MonthlySalesBarChart.module.css';

export interface MonthlyBarData {
  month: string;
  value: number;
}

export interface MonthlySalesBarChartProps {
  title?: string;
  subtitle?: string;
  data?: MonthlyBarData[];
  currencySymbol?: string;
  onMenuClick?: () => void;
}

const DEFAULT_MONTHLY_DATA: MonthlyBarData[] = [
  { month: 'Jan', value: 165 },
  { month: 'Feb', value: 385 },
  { month: 'Mar', value: 200 },
  { month: 'Apr', value: 280 },
  { month: 'May', value: 195 },
  { month: 'Jun', value: 230 },
  { month: 'Jul', value: 275 },
  { month: 'Aug', value: 160 },
  { month: 'Sep', value: 220 },
  { month: 'Oct', value: 390 },
  { month: 'Nov', value: 270 },
  { month: 'Dec', value: 110 },
];

export function MonthlySalesBarChart({
  title = 'Monthly Sales',
  subtitle,
  data = DEFAULT_MONTHLY_DATA,
  currencySymbol = '',
  onMenuClick,
}: MonthlySalesBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const chartId = useId();

  // Y-axis ticks: 400, 300, 200, 100, 0
  const maxY = 400;
  const yTicks = [400, 300, 200, 100, 0];

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const chartTop = 20;
  const chartBottom = 180;
  const chartHeight = chartBottom - chartTop;
  const chartLeft = 45;
  const chartRight = 580;
  const chartPlotWidth = chartRight - chartLeft;

  const barWidth = 14;
  const numBars = data.length;
  const slotWidth = chartPlotWidth / numBars;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label="Sales options"
          title="More options"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      <div className={styles.chartWrap}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.svg}
          preserveAspectRatio="none"
          role="img"
          aria-label={title}
        >
          {/* Horizontal Grid lines and Y-axis labels */}
          {yTicks.map((tick) => {
            const yPos = chartBottom - (tick / maxY) * chartHeight;
            return (
              <g key={`tick-${tick}`}>
                <text
                  x={chartLeft - 10}
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
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
              </g>
            );
          })}

          {/* Vertical Bars and X-axis Month Labels */}
          {data.map((item, index) => {
            const barHeight = Math.max(4, (item.value / maxY) * chartHeight);
            const xCenter = chartLeft + index * slotWidth + slotWidth / 2;
            const barX = xCenter - barWidth / 2;
            const barY = chartBottom - barHeight;
            const isHovered = hoveredIdx === index;

            return (
              <g
                key={`${chartId}-${item.month}`}
                className={styles.barGroup}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
                tabIndex={0}
                role="button"
                aria-label={`${item.month}: ${item.value} ${currencySymbol}`}
              >
                {/* Invisible hover capture column */}
                <rect
                  x={xCenter - slotWidth / 2}
                  y={chartTop}
                  width={slotWidth}
                  height={chartHeight + 30}
                  fill="transparent"
                />

                {/* Animated Rounded Vertical Bar */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx={5}
                  ry={5}
                  className={`${styles.bar} ${isHovered ? styles.barHovered : ''}`}
                />

                {/* X-axis Label */}
                <text
                  x={xCenter}
                  y={chartBottom + 20}
                  textAnchor="middle"
                  className={`${styles.xLabel} ${isHovered ? styles.xLabelActive : ''}`}
                >
                  {item.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && (
          <div
            className={styles.tooltip}
            style={{
              left: `${((chartLeft + hoveredIdx * slotWidth + slotWidth / 2) / svgWidth) * 100}%`,
              top: `${((chartBottom - (data[hoveredIdx].value / maxY) * chartHeight) / svgHeight) * 100}%`,
            }}
          >
            <strong>{data[hoveredIdx].month}</strong>: {data[hoveredIdx].value} {currencySymbol}
          </div>
        )}
      </div>
    </div>
  );
}
