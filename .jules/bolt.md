## 2025-05-15 - [Intl.DateTimeFormat Reuse]
**Learning:** Calling `toLocaleDateString()` or `toLocaleString()` inside a loop or frequent render path is a significant bottleneck. It creates a new `Intl` object on every call, which is computationally expensive.
**Action:** Define static `Intl.DateTimeFormat` instances at the module level for commonly used formats to avoid this overhead.

## 2025-05-15 - [Pre-calculating Display Values]
**Learning:** Repeating complex logic (like status classification via multiple string/regex checks) for every row in a table during React rendering can cause UI lag on large datasets.
**Action:** Shift this logic into the data-processing phase (e.g., inside `useMemo` after a fetch) and store the results as properties on the data objects. This converts O(N) complex work during render into O(N) simple property access.

## 2025-05-15 - [Intl Formatter Caching]
**Learning:** Creating `Intl.DateTimeFormat` and `Intl.NumberFormat` instances is computationally expensive. When used inside React render loops or data table row selectors, it leads to significant UI jank as the dataset size grows.
**Action:** Use the `utils/perf-formatter.ts` utility which implements a `Map`-based cache for these instances. This reduces CPU usage and memory churn during rendering of large datasets.
