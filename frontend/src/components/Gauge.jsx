import React from 'react';

export default function Gauge({ probability, riskLevel, size = 180, strokeWidth = 14 }) {
  // probability is 0 to 1
  const percentage = Math.min(100, Math.max(0, probability * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = 'var(--color-safe)';
  let glowColor = 'var(--color-safe-glow)';
  let statusText = 'SAFE';

  if (riskLevel === 'high') {
    strokeColor = 'var(--color-danger)';
    glowColor = 'var(--color-danger-glow)';
    statusText = 'HIGH RISK';
  } else if (riskLevel === 'medium') {
    strokeColor = 'var(--color-warn)';
    glowColor = 'var(--color-warn-glow)';
    statusText = 'WARNING';
  }

  return (
    <div style={{
      position: 'relative',
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto'
    }}>
      <svg width={size} height={size} className="gauge-svg">
        {/* Background Track */}
        <circle
          className="gauge-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Ring */}
        <circle
          className="gauge-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={strokeColor}
          fill="none"
          style={{
            filter: `drop-shadow(0 0 10px ${glowColor})`
          }}
        />
      </svg>

      {/* Center Readout */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: strokeColor,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '2px'
        }}>
          {statusText}
        </span>
        <span className="font-mono" style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          lineHeight: 1,
          color: 'var(--text-main)'
        }}>
          {percentage.toFixed(1)}%
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '4px'
        }}>
          Failure Risk
        </span>
      </div>
    </div>
  );
}
