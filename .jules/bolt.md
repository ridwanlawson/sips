## 2024-05-16 - Server-side filtering for attendance
**Learning:** Moving date filtering from client-side `useMemo` to server-side query parameters significantly reduces the data payload and improves initial rendering performance for the dashboard.
**Action:** Always check if APIs support server-side filtering (especially by date or ID) before implementing client-side filtering.
