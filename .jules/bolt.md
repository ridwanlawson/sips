## 2024-05-14 - [Consolidated Dashboard Aggregation]
**Learning:** Multiple redundant O(n) iterations over large datasets (like attendance records) in separate `useMemo` hooks can significantly degrade client-side performance. Server-side filtering combined with a single-pass aggregation logic is much more efficient.
**Action:** Consolidate data processing into a single `useMemo` block that performs all classifications and summaries in one loop.
