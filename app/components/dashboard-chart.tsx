'use client';

import { memo } from 'react';

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  maxValue?: number;
  color?: string;
  title?: string;
}

export const SimpleBarChart = memo(function SimpleBarChart({
  data,
  maxValue,
  color = 'bg-blue-500',
  title,
}: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-base-content/60">
        <p>📊 Tidak ada data tersedia</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && <p className="text-sm font-semibold mb-4">{title}</p>}
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-medium">{item.label}</span>
              <span className="badge badge-sm badge-ghost">{item.value}</span>
            </div>
            <div className="w-full bg-base-300 rounded-full h-6 overflow-hidden">
              <div
                className={`h-full ${color} transition-all duration-500 ease-out flex items-center justify-center`}
                style={{ width: `${(item.value / max) * 100}%` }}
              >
                <span className="text-xs font-semibold text-white">
                  {Math.round((item.value / max) * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  title?: string;
}

export const SimplePieChart = memo(function SimplePieChart({ data, title }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-base-content/60">
        <p>🥧 Tidak ada data tersedia</p>
      </div>
    );
  }

  // SVG Pie Chart with separated slices
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const holeRadius = 50; // Donut hole
  const separation = 3; // Gap between slices in degrees

  let currentAngle = -90; // Start from top

  const slices = data.map(item => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;

    // Add separation gap
    const startAngle = currentAngle + separation / 2;
    const endAngle = currentAngle + angle - separation / 2;

    // Calculate path for donut slice
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const x3 = center + holeRadius * Math.cos(endRad);
    const y3 = center + holeRadius * Math.sin(endRad);
    const x4 = center + holeRadius * Math.cos(startRad);
    const y4 = center + holeRadius * Math.sin(startRad);

    const largeArc = angle - separation > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${holeRadius} ${holeRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    currentAngle += angle;

    return {
      path: pathData,
      color: item.color,
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1),
    };
  });

  return (
    <div className="w-full">
      {title && <p className="text-sm font-semibold mb-4">{title}</p>}
      <div className="flex flex-col gap-4">
        {/* SVG Pie Chart */}
        <div className="flex justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((slice, idx) => (
              <g key={idx}>
                <path
                  d={slice.path}
                  fill={slice.color}
                  className="transition-all duration-300 hover:opacity-80"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  }}
                />
              </g>
            ))}
            {/* Center text */}
            <text
              x={center}
              y={center - 5}
              textAnchor="middle"
              className="text-2xl font-bold fill-current"
            >
              {total}
            </text>
            <text
              x={center}
              y={center + 15}
              textAnchor="middle"
              className="text-xs fill-current opacity-60"
            >
              Total
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {data.map((item, idx) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-xs">
                  {item.label}: {item.value} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* =========================
   L I N E   "C H A R T"
   (tabel tren dengan Pulang Awal)
========================= */

interface LineChartData {
  label: string;
  hadir: number;
  tepatWaktu: number;
  telat: number;
  pulangAwal: number;
  alpa: number;
}

interface LineChartProps {
  data: LineChartData[];
  title?: string;
}

export const SimpleLineChart = memo(function SimpleLineChart({ data, title }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-base-content/60">
        <p>📈 Tidak ada data tersedia</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && <p className="text-sm font-semibold mb-4">{title}</p>}
      <div className="overflow-x-auto">
        <table className="table table-compact w-full text-xs">
          <thead>
            <tr>
              <th>Periode</th>
              <th className="text-center">Hadir</th>
              <th className="text-center">Tepat Waktu</th>
              <th className="text-center">Telat</th>
              <th className="text-center">Pulang Awal</th>
              <th className="text-center">Alpa</th>
              <th className="text-center">% Tepat Waktu</th>
              <th className="text-center">% Telat</th>
              <th className="text-center">% Pulang Awal</th>
              <th className="text-center">% Alpa</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              // Use mutually-exclusive categories for percentage: tepatWaktu + telat + pulangAwal + alpa
              const total = item.tepatWaktu + item.telat + item.pulangAwal + item.alpa || 1;

              const pTepat = ((item.tepatWaktu / total) * 100).toFixed(1);
              const pTelat = ((item.telat / total) * 100).toFixed(1);
              const pPulangAwal = ((item.pulangAwal / total) * 100).toFixed(1);
              const pAlpa = ((item.alpa / total) * 100).toFixed(1);

              return (
                <tr key={idx} className="hover:bg-base-200">
                  <td className="font-medium">{item.label}</td>

                  <td className="text-center">
                    <span className="badge badge-primary badge-sm">{item.hadir}</span>
                  </td>

                  <td className="text-center">
                    <span className="badge badge-success badge-sm">{item.tepatWaktu}</span>
                  </td>

                  <td className="text-center">
                    <span className="badge badge-warning badge-sm">{item.telat}</span>
                  </td>

                  <td className="text-center">
                    <span className="badge badge-error badge-sm">{item.pulangAwal}</span>
                  </td>

                  <td className="text-center">
                    <span
                      className="badge badge-sm"
                      style={{ backgroundColor: '#000', color: '#fff' }}
                    >
                      {item.alpa}
                    </span>
                  </td>

                  <td className="text-center">{pTepat}%</td>
                  <td className="text-center">{pTelat}%</td>
                  <td className="text-center">{pPulangAwal}%</td>
                  <td className="text-center">{pAlpa}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
