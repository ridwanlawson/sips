"use client";

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  maxValue?: number;
  color?: string;
  title?: string;
}

export function SimpleBarChart({
  data,
  maxValue,
  color = "bg-blue-500",
  title,
}: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

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
                {(item.value / max) * 100 > 15 && (
                  <span className="text-xs font-semibold text-white">
                    {Math.round((item.value / max) * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  title?: string;
}

export function SimplePieChart({ data, title }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-base-content/60">
        <p>🥧 Tidak ada data tersedia</p>
      </div>
    );
  }

  let cumulativePercentage = 0;
  const gradientStops = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const start = cumulativePercentage;
    cumulativePercentage += percentage;
    return `${item.color} ${start}%, ${item.color} ${cumulativePercentage}%`;
  });

  return (
    <div className="w-full">
      {title && <p className="text-sm font-semibold mb-4">{title}</p>}
      <div className="flex flex-col gap-4">
        {/* Donut Chart */}
        <div className="flex justify-center">
          <div
            className="rounded-full w-48 h-48"
            style={{
              backgroundImage: `conic-gradient(${gradientStops.join(",")})`,
            }}
          >
            <div className="w-full h-full rounded-full flex items-center justify-center bg-base-100">
              <div className="text-center">
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-base-content/60">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {data.map((item, idx) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
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
}

interface LineChartData {
  label: string;
  hadir: number;
  telat: number;
  alpa: number;
}

interface LineChartProps {
  data: LineChartData[];
  title?: string;
}

export function SimpleLineChart({ data, title }: LineChartProps) {
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
              <th className="text-center">Telat</th>
              <th className="text-center">Alpa</th>
              <th className="text-center">% Hadir</th>
              <th className="text-center">% Telat</th>
              <th className="text-center">% Alpa</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const total = item.hadir + item.telat + item.alpa || 1;
              const pHadir = ((item.hadir / total) * 100).toFixed(1);
              const pTelat = ((item.telat / total) * 100).toFixed(1);
              const pAlpa = ((item.alpa / total) * 100).toFixed(1);

              return (
                <tr key={idx} className="hover:bg-base-200">
                  <td className="font-medium">{item.label}</td>
                  <td className="text-center">
                    <span className="badge badge-success badge-sm">
                      {item.hadir}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-warning badge-sm">
                      {item.telat}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-error badge-sm">
                      {item.alpa}
                    </span>
                  </td>
                  <td className="text-center">{pHadir}%</td>
                  <td className="text-center">{pTelat}%</td>
                  <td className="text-center">{pAlpa}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
