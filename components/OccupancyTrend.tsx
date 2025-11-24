import React from 'react';

/**
 * Fake Occupancy Trend chart component.
 * Generates deterministic pseudo‑random data based on the facility id so the chart
 * remains the same across renders.
 */
interface OccupancyTrendProps {
  facilityId: string;
  width?: number;
  height?: number;
}

const generateData = (seed: number, points = 7): number[] => {
  const data: number[] = [];
  let value = 50; // start around 50%
  for (let i = 0; i < points; i++) {
    // simple deterministic pseudo‑random walk
    const delta = ((seed + i * 13) % 20) - 10; // -10 to +9
    value = Math.max(0, Math.min(100, value + delta));
    data.push(value);
  }
  return data;
};

const OccupancyTrend: React.FC<OccupancyTrendProps> = ({ facilityId, width = 200, height = 100 }) => {
  const numericSeed = parseInt(facilityId.replace(/\D/g, ''), 10) || 0;
  const data = generateData(numericSeed);
  const maxVal = 100;
  const minVal = 0;
  const stepX = width / (data.length - 1);
  const points = data
    .map((val, i) => {
      const x = i * stepX;
      const y = height - ((val - minVal) / (maxVal - minVal)) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="mt-2" viewBox={`0 0 ${width} ${height}`}>
      {/* background grid */}
      <rect width="100%" height="100%" fill="#f9fafb" />
      {/* axis lines */}
      <line x1="0" y1={height} x2={width} y2={height} stroke="#d1d5db" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2={height} stroke="#d1d5db" strokeWidth="1" />
      {/* trend line */}
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default OccupancyTrend;
