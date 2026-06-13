## 2025-05-15 - [Keyboard Shortcut for Quick Search]
**Learning:** Operational pages with large data tables benefit significantly from quick access to search. Adding a '/' keyboard shortcut improves speed for power users, but it needs a visual cue so it's discoverable.

**Action:** Implement the `useSearchShortcut` hook and pair it with a visual `<kbd>` hint that toggles visibility based on focus and input state. Ensure the hook ignores key presses when the user is already typing in other inputs to avoid accidental focus hijacking.
