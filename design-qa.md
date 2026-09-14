# FocusTab reference redesign — design QA

## Comparison target

- Source visual truth:
  - `Brave Browser Appshot 2026-09-14T09-57-25.186Z.png` — current live Focus home supplied by the user; spacing and search-overlap issue
  - `/var/folders/hs/3k7ykn7d37l1b_t_d6fmqmtw0000gn/T/TemporaryItems/NSIRD_screencaptureui_jhCCTz/Screenshot 2026-09-12 at 4.11.05 PM.png` — user-selected density and empty-state benchmark
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/ChatGPT Image Sep 12, 2026, 03_38_24 PM (1).png` — Focus
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/ChatGPT Image Sep 12, 2026, 03_38_24 PM (2).png` — Workspaces
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/ChatGPT Image Sep 12, 2026, 03_38_25 PM (3).png` — Insights
- Rendered implementation:
  - Brave CUA full-window capture on 2026-09-14 after opening a fresh `chrome://newtab/`; the capture is preserved inline in the task's browser evidence at 1228 × 768 px
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-home-latest.png`
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-focus-latest.png`
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-settings-latest.png`
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-home-simplified.png`
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-focus-simplified.png`
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-workspaces-simplified.png`
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-insights-simplified.png`
- Combined comparison evidence:
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-focus-user-comparison.png`
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-focus-comparison.png`
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-workspaces-comparison.png`
  - `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-insights-comparison.png`

## Viewport and normalization

- Browser: Brave, unpacked FocusTab extension, normal browser zoom (100%).
- Current refinement pass: 1228 × 768 px native Brave window, 1228 × 629 CSS px extension canvas below browser chrome. Source and implementation were inspected at the same window size, browser zoom, active-session state, and current wallpaper; no scale normalization was needed.
- Native browser screenshot: 1139 × 768 px at density 1.
- Extension content region used for comparison: 1139 × 614 px, cropped below 103 px of Brave chrome and above the 51 px Brave new-tab footer.
- Source images: 1672 × 941 px.
- User-selected Focus screenshot: 2846 × 1490 px, normalized to 1190 × 623 px.
- Latest Brave Focus capture: 1228 × 768 px. Its extension canvas was cropped to 1190 × 618 px below browser chrome, then placed directly beneath the normalized source in a 1190 × 1241 px comparison image.
- Sources were proportionally normalized to 1139 px wide (1139 × 641 px). Implementation captures were kept at native width. The 27 px height difference was retained rather than distorting either image.
- The saved comparison PNGs are encoded at 2× (2278 × 2510 px) by AppKit; both halves use the same output density.
- Earlier comparison CSS viewport: 1139 × 614 CSS px. Workspaces and Insights retain the earlier short-window compaction. Focus now uses purpose-built short-height dimensions instead of scaling the whole canvas, so its alignment grid remains stable.

## State

- Focus: ready state, 50 minutes selected, no task selected, one locally stored session in history.
- Latest user-feedback pass: active 50-minute focus session, no queued task, one session-history row. The running session was intentionally left untouched while navigation and settings were checked.
- Current alignment pass: active session, no queued tasks, two truthful history rows, and the header search launcher closed. The command palette open state was also exercised and dismissed without changing the session.
- Task-picker pass: ready 50-minute state with no queued tasks. The picker was checked closed, open, and in its inline quick-add state; no sample task was persisted during QA.
- Workspaces: truthful first-run empty state. The source shows a populated state, so only the shell, art direction, hierarchy, and empty-state quality were compared; no fake workspaces were inserted.
- Insights: current local browser data, this-week range, Focus Time selected.

## Full-view comparison evidence

- Home: the simplified capture keeps the timer and Start Focus as the only dominant elements. Empty tasks, workspaces, and daily activity are compact rows instead of large panels.
- Latest Home: with an active session, the timer remains the sole hero. Empty Today and Workspaces content now sits in two 62 px quick-action rows, leaving most of the canvas open and scenic.
- Focus: the final comparison confirms a stable two-column composition, large timer ring, narrower queue/history rail, unobstructed full-width metrics strip, quiet header search, consistent centerlines, and dark scenic backdrop. Empty queue and history states no longer reserve fixed-height areas.
- Workspaces: the populated source and truthful empty implementation share the same full-bleed backdrop, central header, translucent olive glass, mint action, typography hierarchy, and search placement. The first-run state is now a single compact horizontal prompt.
- Settings: three secondary feature groups are collapsed into disclosure rows, so the default view is a short, calm list rather than a long settings form. Browser Search was expanded and visually verified in Brave.
- Insights: the final comparison retains the source art direction while reducing the dashboard to four primary metrics, one chart, one contextual pattern, and one slim daily summary. Empty analytics no longer render a large blank chart.

## Required fidelity surfaces

- Fonts and typography: passed. The implementation uses the existing sans stack with optical weights, tight display tracking, uppercase spaced eyebrows, and readable small UI text matching the source hierarchy. No broken wrapping or truncation is visible in the compared states.
- Spacing and layout rhythm: passed. The heading, task selector, and session actions share a 560 px content column; the right rail is 370 px; both columns align at the top; and the 1120 px metrics strip spans the same composition below them. Search no longer occupies or overlaps the stats region. Short-height sizing is component-specific rather than a whole-screen zoom.
- Colors and visual tokens: passed. The implementation maps the source to charcoal/olive translucent surfaces, restrained white borders, soft navy/black background overlays, and mint active/action states with adequate contrast.
- Image quality and asset fidelity: passed. The generated Scottish-valley background is a full-resolution 1672 × 941 photographic asset, cropped with `cover`, darkened by overlays, and contains no UI or baked-in text. Lucide icons replace interface glyphs consistently; no emoji, CSS drawings, or placeholder art are used.
- Copy and content: passed. Focus and Insights retain the reference tone while using real local values. Workspaces uses a clear first-run message instead of invented user content.
- Interactions and accessibility: passed for the primary visual journey. Home, Focus, Workspaces, and Insights navigation were exercised in Brave. The search pill, Command-K shortcut, and Escape dismissal were verified. Visible buttons have focus-visible rings and semantic labels. Destructive focus/tab actions were not invoked during visual QA.

## Comparison history

### Pass 1 — blocked

- [P2] Short-window composition overflowed below the visible new-tab region.
  - Evidence: `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-focus-pass1.png` and `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-insights-pass1.png` showed lower metrics beneath the Brave footer and the floating search colliding with Focus controls.
  - Fix: added the short-desktop `reference-responsive` canvas scale and moved the compact Focus stats upward while preserving the full layout on taller screens.
- [P1] The non-home search pill was not clickable and two search instances could respond to Command-K.
  - Evidence: the pill was inside a `pointer-events-none` wrapper and the layout mounted controlled and uncontrolled search components together.
  - Fix: unified the layout around one controlled search instance and restored pointer events on both launcher and overlay.

### Pass 2 — initially passed, then reopened from user feedback

- Post-fix visual evidence: `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-focus-final.png`, `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-workspaces-final.png`, and `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-insights-final.png`.
- Post-fix interaction evidence: the search pill opened one palette, Command-K opened one palette, and Escape closed it. The four primary navigation destinations all rendered successfully in Brave.
- Automated comparison found no remaining structural mismatch, but real-use feedback correctly identified excessive density and oversized empty states; the review was reopened for Pass 3.

### Pass 3 — passed after density feedback

- [P1] The reference-faithful dashboard still felt too dense in real use, with too many equal-weight panels competing for attention.
  - Fix: reduced Insights from five top-level KPIs to four, collapsed no-baseline analytics into a short empty chart state, reduced patterns to the one useful next action when there is no focus data, removed decorative quote/location rows, and tightened secondary controls.
- [P1] Empty states occupied too much of the viewport.
  - Fix: replaced the large Workspaces first-run card with one compact horizontal prompt; changed Home task/workspace/activity empties to short rows; removed fixed minimum heights from the Focus queue and history.
- Post-fix evidence: `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-home-simplified.png`, `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-focus-simplified.png`, `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-workspaces-simplified.png`, and `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-insights-simplified.png`.
- No actionable P0, P1, or P2 density or empty-state issues remain at the tested viewport.

### Pass 4 — passed against the user-selected Focus benchmark

- [P1] Home empty cards still gave tasks and workspaces more visual weight than their empty state justified.
  - Fix: replaced both empty panels with 62 px quick-action rows. Today keeps one inline task field and Workspaces keeps one Create action; neither includes decorative filler or explanatory paragraphs.
- [P1] Populated Workspaces and Settings still concentrated too many controls in equal-weight surfaces.
  - Fix: changed Workspaces to a roomier two-column card grid with a narrower detail rail, converted detail empty states into compact action rows, and collapsed Browser Search, Website Blocking, and Browser Cleanup into disclosures.
- [P2] Saved items used a tall centered empty state and text glyph controls.
  - Fix: changed the empty state to a single compact row and replaced the remaining action glyphs with consistent Lucide icons.
- Source-to-implementation evidence: `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-focus-user-comparison.png`. The normalized pair confirms the same scenic shell, quiet navigation, left timer/right context split, compact queue/history, and restrained bottom utility strip. The implementation intentionally makes secondary empty states slightly shorter than the source to honor the user's latest density feedback.
- Post-fix Brave evidence: `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-home-latest.png`, `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-focus-latest.png`, `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-workspaces-simplified.png`, `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-insights-simplified.png`, and `/Users/deepak/Desktop/02 Development/Dev/chrome-extension/design-qa-settings-latest.png`.
- Primary interactions checked: Home/Focus/Workspaces/Insights navigation, active-session continuity, Settings open/close, and Browser Search disclosure expansion. No console error surface appeared during the checked flows.
- No actionable P0, P1, or P2 differences remain at the tested desktop viewport.

### Pass 5 — passed after Focus home alignment refinement

- [P1] The persistent bottom search launcher overlaid the metrics strip and became the screen's strongest secondary element.
  - Evidence: `Brave Browser Appshot 2026-09-14T09-57-25.186Z.png` showed the 580 px search pill covering the center of the daily summary rail.
  - Fix: removed the persistent bottom launcher and added a compact Search / Command-K action to the header. The full command palette still opens on click and retains keyboard access.
- [P1] The left focus controls, right context rail, and bottom metrics used different container widths and did not resolve to one alignment system.
  - Evidence: the supplied appshot showed the stats container starting and ending independently of the two-column content, while the whole-canvas 0.8 zoom made spacing harder to tune.
  - Fix: introduced a 1120 px composition grid, a centered 560 px left content column, a 370 px right rail, a shared 44 px short-window gutter, and a 1120 px stats strip.
- [P2] Whole-canvas short-window scaling reduced legibility and created indirect alignment drift.
  - Fix: Focus now uses targeted short-height timer, field, action, and padding sizes; Workspaces and Insights remain unchanged.
- Post-fix visual evidence: live Brave CUA capture at 1228 × 768 px. The final closed-search capture shows clear separation between controls and stats, equal top alignment for the two main columns, and no clipped or overlapping controls. A second capture verified the command palette opens from the new header action.
- No actionable P0, P1, or P2 differences remain at the tested desktop viewport.

### Pass 6 — passed after task-picker refinement

- [P1] The native task `select` visually broke the otherwise custom glass interface and exposed browser-default menu styling.
  - Fix: replaced it with a purpose-built `TaskPicker` that uses the same olive glass surface, mint state color, border opacity, radii, typography, and Lucide icon language as the Focus screen.
- [P2] The old control had no designed empty, selected, or creation states.
  - Fix: added a compact queue-clear message, a clear “Focus without a task” option, estimated-duration metadata for populated options, selection indicators, and an inline quick-add row that stays within the popover.
- [P2] Reassigning a task while a focus session is active could create an ambiguous session record.
  - Fix: the picker remains inspectable during a session, but existing task choices are locked and a short notice explains that newly added tasks will be queued for later.
- Post-fix Brave evidence: live CUA captures at 1228 × 768 px, preserved inline in the task transcript, show the closed trigger, open empty state, active-session lock state, and inline quick-add state. The open picker remains inside the left focus column, uses the same glass treatment as the right rail, and does not cover the session actions or daily metrics.
- Primary interactions checked: trigger open, close button, no-task selection, inline quick-add expansion, disabled Add state for an empty title, closed-state restoration, and active-session lock messaging. No user task was created and no focus session was paused, ended, or abandoned during this pass.
- No actionable P0, P1, or P2 task-picker differences remain at the tested desktop viewport.

## Focused region evidence

Separate crops were not needed because the full-window 1228 × 768 captures keep the header search, title, timer, selectors, actions, right rail, and four metrics legible together. The command palette and task picker were additionally inspected open at the same viewport; the latter is large enough in the full capture to judge its type scale, spacing, borders, icons, empty-state density, and quick-add controls.

## Follow-up polish

- [P3] The Workspaces populated-state comparison can be repeated later with real saved workspaces; the first-run empty state was retained to avoid seeding misleading data.

## Implementation checklist

- [x] Reference-like full-bleed scenic background and overlays
- [x] Shared glass, mint, border, radius, and typography tokens
- [x] Focus, Workspaces, and Insights layouts
- [x] Short-desktop responsive composition
- [x] Compact first-run and no-data states
- [x] Reduced empty analytics and secondary chrome
- [x] Brave navigation and search interaction checks
- [x] Header search placement and command-palette open/dismiss checks
- [x] Shared Focus composition grid and unobstructed metrics strip
- [x] Custom Focus task picker with empty, selected, locked-session, and quick-add states
- [x] Typecheck and production build

final result: passed
