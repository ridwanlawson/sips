## 2025-05-15 - [Keyboard Shortcut for Quick Search]
**Learning:** Operational pages with large data tables benefit significantly from quick access to search. Adding a '/' keyboard shortcut improves speed for power users, but it needs a visual cue so it's discoverable.

**Action:** Implement the `useSearchShortcut` hook and pair it with a visual `<kbd>` hint that toggles visibility based on focus and input state. Ensure the hook ignores key presses when the user is already typing in other inputs to avoid accidental focus hijacking.

## 2025-05-16 - [Accessible Form Feedback & Context]
**Learning:** For authentication forms, providing immediate and linked context is crucial for accessibility. Screen readers need explicit labels for icon-only inputs, immediate feedback on error messages via ARIA roles, and clear linkage between input fields and their requirement hints (like password length) using `aria-describedby`. Additionally, keeping text visible in loading buttons prevents layout shifts and maintains user context.

**Action:** Always link form requirement hints to inputs using `aria-describedby`. Use `role="alert"` and `aria-live="polite"` for dynamic error messages. Ensure buttons maintain their dimensions or provide descriptive text during loading states.

## 2025-05-17 - [Accessible Custom Selects & Localization]
**Learning:** Custom components like `SearchSelect` need explicit keyboard handling (like the `Escape` key) to meet accessibility standards. Closing a dropdown should ideally return focus to its trigger button to maintain the user's place. Additionally, all `aria-label` attributes must be localized via translation files to ensure a consistent experience for screen reader users across all supported languages.

**Action:** Implement `Escape` key listeners in custom dropdowns that close the menu and return focus to the trigger. Always use localized strings for `aria-label` and `title` attributes.
