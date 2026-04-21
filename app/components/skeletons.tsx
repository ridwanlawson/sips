export const SkeletonCard = () => (
  <div className="card bg-base-100 shadow-sm border border-base-200 animate-pulse">
    <div className="card-body p-4">
      <div className="h-4 bg-base-300 rounded w-1/3 mb-2"></div>
      <div className="h-8 bg-base-200 rounded w-3/4"></div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="overflow-x-auto w-full animate-pulse">
    <table className="table table-sm">
      <thead>
        <tr>
          {Array.from({ length: 5 }).map((_, i) => (
            <th key={i}><div className="h-4 bg-base-300 rounded w-full"></div></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            {Array.from({ length: 5 }).map((_, j) => (
              <td key={j}><div className="h-4 bg-base-200 rounded w-full"></div></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonChart = () => (
  <div className="w-full h-64 bg-base-100 rounded-xl border border-base-200 p-4 animate-pulse">
    <div className="h-4 bg-base-300 rounded w-1/4 mb-4"></div>
    <div className="flex items-end gap-2 h-40">
      {[35, 65, 40, 80, 50, 95, 60].map((height, i) => (
        <div key={i} className="flex-1 bg-base-200 rounded-t" style={{ height: `${height}%` }}></div>
      ))}
    </div>
  </div>
);
