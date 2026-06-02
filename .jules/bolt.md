## 2025-05-15 - [Intl.DateTimeFormat Reuse]
**Learning:** Calling `toLocaleDateString()` or `toLocaleString()` inside a loop or frequent render path is a significant bottleneck. It creates a new `Intl` object on every call, which is computationally expensive.
**Action:** Define static `Intl.DateTimeFormat` instances at the module level for commonly used formats to avoid this overhead.

## 2025-05-15 - [Pre-calculating Display Values]
**Learning:** Repeating complex logic (like status classification via multiple string/regex checks) for every row in a table during React rendering can cause UI lag on large datasets.
**Action:** Shift this logic into the data-processing phase (e.g., inside `useMemo` after a fetch) and store the results as properties on the data objects. This converts O(N) complex work during render into O(N) simple property access.

## 2025-05-15 - [Intl Formatter Caching]
**Learning:** Creating `Intl.DateTimeFormat` and `Intl.NumberFormat` instances is computationally expensive. When used inside React render loops or data table row selectors, it leads to significant UI jank as the dataset size grows.
**Action:** Use the `utils/perf-formatter.ts` utility which implements a `Map`-based cache for these instances. This reduces CPU usage and memory churn during rendering of large datasets.

## 2026-05-31 - [O(N^2) Row Numbering Anti-pattern]
**Learning:** Calculating unique row numbers inside a React render loop using `data.slice(0, idx).filter()` causes O(N²) complexity. This leads to severe UI lag as the number of rows (N) increases, especially in data-heavy report tables.
**Action:** Pre-calculate row numbers or unique counters during the data processing phase (e.g., inside `fetchData` or `useMemo`) using a single-pass (O(N)) counter. Store the result on the data object itself to allow O(1) access during render.
