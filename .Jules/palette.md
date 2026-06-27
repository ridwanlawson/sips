## 2025-05-15 - [Keyboard Shortcut for Quick Search]
**Learning:** Operational pages with large data tables benefit significantly from quick access to search. Adding a '/' keyboard shortcut improves speed for power users, but it needs a visual cue so it's discoverable.

**Action:** Implement the `useSearchShortcut` hook and pair it with a visual `<kbd>` hint that toggles visibility based on focus and input state. Ensure the hook ignores key presses when the user is already typing in other inputs to avoid accidental focus hijacking.

## 2025-05-16 - [Accessible Form Feedback & Context]
**Learning:** For authentication forms, providing immediate and linked context is crucial for accessibility. Screen readers need explicit labels for icon-only inputs, immediate feedback on error messages via ARIA roles, and clear linkage between input fields and their requirement hints (like password length) using `aria-describedby`. Additionally, keeping text visible in loading buttons prevents layout shifts and maintains user context.

**Action:** Always link form requirement hints to inputs using `aria-describedby`. Use `role="alert"` and `aria-live="polite"` for dynamic error messages. Ensure buttons maintain their dimensions or provide descriptive text during loading states.

## 2025-05-17 - [Accessible Custom Selects & Localization]
**Learning:** Custom components like `SearchSelect` need explicit keyboard handling (like the `Escape` key) to meet accessibility standards. Closing a dropdown should ideally return focus to its trigger button to maintain the user's place. Additionally, all `aria-label` attributes must be localized via translation files to ensure a consistent experience for screen reader users across all supported languages.

**Action:** Implement `Escape` key listeners in custom dropdowns that close the menu and return focus to the trigger. Always use localized strings for `aria-label` and `title` attributes.

## 2025-06-21 - [Standardized Independent Password Toggles]
**Learning:** Using a single global checkbox to toggle multiple password fields (like "Current", "New", and "Confirm") is a sub-optimal UX pattern. Independent toggles on each field, implemented via local component state, provide better control and follow modern security standards. Consistency in input styling (icons, borders) between login and profile pages creates a more cohesive user experience.

**Action:** Replace form-level password visibility checkboxes with individual toggle buttons inside each password input. Ensure these toggles have localized ARIA labels and titles, and use a consistent flex-based input container (e.g., DaisyUI's `label.input.input-bordered`) for grouping icons with inputs.

## 2025-07-23 - [Localized Profile Management & Accessible Hints]
**Learning:** Extending accessibility patterns (like `aria-describedby` for hints and `aria-live` for alerts) to all user-facing forms, including Profile and Change Password, ensures a consistent and predictable experience for assistive technology users. Using a dedicated `Profile` translation namespace helps centralize management of account-related strings and prevents duplication across components.

**Action:** Consistently apply `aria-describedby` for field-specific requirements and `aria-live="polite"` for form-level status alerts across all operational and profile-related forms. Always utilize the centralized `Profile` namespace for account management UI strings.

## 2025-08-25 - [Caps Lock Detection for Password Fields]
**Learning:** Entering passwords with Caps Lock inadvertently active is a common user error. Providing a localized, accessible warning (using 'role="alert"' and 'aria-live="polite"') significantly improves the login and password-change experience by offering immediate corrective feedback.

**Action:** Use 'getModifierState("CapsLock")' on 'keydown' and 'keyup' events to detect Caps Lock state. Display the warning message (localized via the 'Auth' namespace) below the input field, utilizing existing 'text-warning' and 'animate-fadeIn' classes for visual consistency.

## 2025-09-10 - [Handling Multiple ARIA Descriptions for Inputs]
**Learning:** Inputs often require both a persistent hint (e.g., character requirements) and a dynamic error message. Accessibility is compromised if the error message replaces the hint in `aria-describedby`. Concatenating multiple IDs in the attribute ensures the screen reader provides full context to the user.

**Action:** Dynamically compute the `aria-describedby` value by filtering and joining all applicable IDs (hints, errors, status messages). Ensure each piece of feedback has a unique, stable ID.

## 2025-09-20 - [Enhanced LanguageSwitcher UX & Affordance]
**Learning:** For global components like a language switcher, visual affordance (like a globe icon) is critical for immediate recognition across different locales. Furthermore, CSS-only dropdowns (like DaisyUI's) can feel "sticky" after a selection is made; programmatically blurring the active element provides immediate visual confirmation that the action was triggered.
**Action:** Always pair language selection triggers with a globe icon for universal recognition. Use `document.activeElement.blur()` in selection handlers for CSS-only dropdowns to ensure they close immediately upon user interaction.

## 2025-06-27 - [Accessible Scroll-to-Top with Progress & Focus Management]
**Learning:** A standard "Scroll to Top" button can leave keyboard and screen reader users "stranded" at the bottom of the DOM even after the viewport has moved. Combining visual scroll progress with programmatic focus management significantly improves both delight and accessibility.

**Action:** Implement a progress ring (SVG circle with `stroke-dashoffset`) that fills as the user scrolls. Crucially, move focus to the `#main-content` element after scrolling to the top (using a short delay to account for smooth scroll duration) to provide a predictable landing point for assistive technologies.
