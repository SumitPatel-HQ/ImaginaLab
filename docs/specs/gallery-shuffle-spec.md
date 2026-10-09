# Spec: Gallery Grid Shuffle Layout Button

## Problem Statement

As a gallery viewer browsing a large image collection in the library grid view, I see the same images in the same order every time. The top bar only offers Back navigation and density controls, so there is no way to rediscover the collection or break visual monotony without manually scrolling or reloading. I want a one-click control in the header that instantly reshuffles the visible layout.

## Solution

Add a Shuffle control to the library grid header, positioned between the Back control and the density controls. Activating it immediately reorders the currently visible images in both masonry and uniform grid modes, keeps every card stable by identity, keeps infinite scrolling and the full-view modal consistent with the new order, and remains fully keyboard and screen-reader accessible. No data fetching or backend changes are required; this is a client-side view-order change.

## User Stories

1. As a gallery visitor, I want a visible Shuffle button in the grid header, so that I can discover the control without hunting.
2. As a gallery visitor, I want to trigger a reshuffle with a single click or tap, so that reordering feels instant.
3. As a keyboard-only visitor, I want to tab to the Shuffle button and activate it with Enter or Space, so that I have equal access.
4. As a screen-reader user, I want the Shuffle button announced with a clear label, so that I understand its purpose.
5. As a mobile visitor, I want the Shuffle button reachable and tappable at small widths, so that I can use it on my phone.
6. As a gallery visitor, I want every reshuffle to produce a visibly different order, so that the action feels meaningful.
7. As a gallery visitor, I want reshuffle to work in masonry mode, so that my preferred layout still shuffles.
8. As a gallery visitor, I want reshuffle to work in uniform grid mode, so that both layout options behave the same.
9. As a gallery visitor, I want reshuffle to preserve my current density setting, so that card sizing does not unexpectedly change.
10. As a gallery visitor, I want reshuffle to preserve my layout mode choice, so that I am not switched between masonry and grid.
11. As a gallery visitor, I want each image card to keep its identity across shuffles, so that images do not flicker, duplicate, or lose loaded state unnecessarily.
12. As a gallery visitor, I want to keep scrolling to load more images after shuffling, so that discovery continues uninterrupted.
13. As a gallery visitor, I want newly loaded images to append without duplicates after a shuffle, so that the collection stays coherent.
14. As a gallery visitor, I want to open any card in the full-view modal after shuffling, so that detail viewing still works.
15. As a gallery visitor, I want modal next and previous navigation to follow the shuffled order, so that stepping through matches what I saw in the grid.
16. As a gallery visitor, I want the modal position indicator to reflect the shuffled order, so that counts stay accurate.
17. As a gallery visitor, I want the Shuffle button disabled while the initial collection is loading, so that I cannot trigger a meaningless action.
18. As a gallery visitor, I want the Shuffle button disabled when fewer than two images are visible, so that the control is honest about when it can act.
19. As a gallery visitor, I want a polite confirmation that the order changed, so that assistive technology users receive feedback.
20. As a returning visitor, I want reshuffle to be repeatable without reload, so that I can shuffle as often as I like.
21. As a gallery owner, I want shuffle to never alter the underlying collection or server order, so that the canonical order is preserved.
22. As a gallery owner, I want shuffle to avoid breaking image priority loading, so that performance stays acceptable after reorder.

## Implementation Decisions

- Scope the change to three conceptual areas: the grid header presentation, the grid container ordering, and a new pure shuffle-order utility. No changes to data fetching, pagination, or image services.
- Add a single new seam: a pure, unbiased shuffle-order function operating on a copy of the input list. It must not mutate its input. The container derives an ordered view from the currently visible images plus a reshuffle trigger. This is the only new test seam; all other behavior reuses existing seams.
- Reuse existing seams and prefer the highest one: the grid container memo that feeds both masonry column building and uniform grid rendering, the masonry layout builder, and the paginated image-grid data hook remain untouched in logic.
- The header stays presentational: it receives a shuffle callback and a disabled flag, renders the Shuffle icon with matching pill styling, and owns no image data or ordering state.
- Ordering decisions:
  - The ordered view is the single source of truth for rendering, the image-to-index map, modal navigation handlers, and the end-of-collection count. All consumers switch together in one change to avoid split-brain order.
  - Card identity keys remain stable image identifiers; positional index keys are forbidden.
  - The full collection backing infinite scroll is never reordered; only the visible ordered view is shuffled, so paging offsets and deduplication invariants hold.
  - Newly fetched pages append in fetch order after a shuffle; they do not auto-shuffle. The user may reshuffle at any time.
  - Masonry full rebuild on shuffle is intentional and desired; prefix-stability guarantees for appends do not apply to an explicit reorder. Per-image height weights are order-independent.
- Interaction decisions:
  - Shuffle trigger increments a lightweight generation counter; the ordered view recomputes exactly once per activation.
  - Disabled state derives from initial loading status and visible count threshold.
  - Scroll position behavior: retain current scroll offset on shuffle; no forced scroll reset.
  - Animation for this iteration is a simple fade or stagger on the gallery region; cross-column FLIP layout animation is deferred.
- Accessibility contract:
  - Exposed accessible name such as Shuffle gallery layout, tooltip equivalent, and visible focus indicator matching existing header pills.
  - Disabled styling mirrors existing density controls.
  - An optional polite live-region announcement confirms the reorder.

## Testing Decisions

- What makes a good test here: assert externally observable behavior, not implementation details. Prefer: given a visible list, after shuffle the set of identities is unchanged, the order usually changes, no duplicates appear, scrolling still appends, and modal stepping follows the displayed order. Avoid asserting internal state variable names, memo dependency arrays, or exact random permutations.
- Modules to test:
  - The new pure shuffle-order utility: purity (input untouched), identity preservation (same members, no loss, no duplicates), and statistical sanity over repeated runs (order varies across runs for lists longer than one).
  - The grid container ordering behavior at the highest feasible seam: activating shuffle re-renders all cards with stable identity keys, updates the index map, and routes modal next and previous through the shuffled order.
  - Pagination interaction: shuffle then fetch-more yields monotonic growth with no duplicate identities.
- Prior art: the masonry layout module documents deterministic shortest-column placement with prefix stability and carries a Node test-runner script entry, but no test directory currently exists in the repo, so there is no runnable suite to extend. New tests should establish the first runnable precedent for the shuffle seam using the repo's declared Node test runner, and manual verification covers both layout modes, scroll-load-more, and modal stepping.

## Out of Scope

- Persisting shuffled order across reloads, sessions, or share links.
- Server-side shuffling, API ordering parameters, or collection mutation.
- Drag-to-reorder, custom ordering, favorites, or saved arrangements.
- Full FLIP cross-column layout animation with motion primitives.
- Changes to density scale, breakpoints, column counts, gaps, or fetch page sizes.
- Reset or undo-shuffle control; reshuffling again is the accepted path.
- Telemetry, A-B testing, or performance benchmarking beyond casual verification.

## Further Notes

- Research backing this spec lives alongside repo notes under the research folder as the gallery shuffle investigation, including primary-source citations and the rejected alternatives of hook-internal mutation and CSS-only reordering.
- The header currently carries an unused layout-toggle callback prop with no rendered control; this spec does not repurpose or remove it. A separate cleanup may address it.
- No domain glossary or architecture decision records exist in the repo at spec time; terminology above follows the codebase's own names for gallery, masonry, density, and modal concepts.
- Issue tracker publication was not possible from this environment: no tracker configuration or triage label vocabulary is present. To enable publishing with the ready-for-agent label, run the project setup flow for engineering skills.
