# Spec: Gallery Search Bar with Random-Name Fill

## Problem Statement

As a gallery viewer browsing a large image collection, I have no way to find a specific image by name. Scrolling through masonry or uniform grid pages to locate one photo is slow and tedious. I also have no playful way to discover images — I want a single Random action that picks an image name for me, fills the search box with it, and lets me reveal that image with one Search activation.

## Solution

Add a search bar to the library grid header, positioned between the navigation/shuffle group and the density controls. It consists of a text input, a Search submit action, a Clear action, and a Random-name button. Typing a name and submitting filters the grid to matching images and shows a result count. Activating Random fills the input with a randomly chosen image name from the loaded collection (never repeating the immediately previous pick); submitting then reveals that image by filtering the grid to it and opening the detail modal on the exact match. All matching is case-insensitive and ignores file extensions, so typing a bare name still finds the file. No backend or proxy changes are required; this is a client-side view filter.

## User Stories

1. As a gallery visitor, I want a visible search input in the grid header, so that I can discover the search feature without hunting.
2. As a gallery visitor, I want to type an image name into the search input, so that I can look for a specific photo.
3. As a gallery visitor, I want to submit my search with a single click, tap, or Enter key, so that searching feels instant.
4. As a gallery visitor, I want the grid to filter to only matching images after Search, so that I can see results in place.
5. As a gallery visitor, I want search to work in masonry mode, so that my preferred layout still filters.
6. As a gallery visitor, I want search to work in uniform grid mode, so that both layout options behave the same.
7. As a gallery visitor, I want search to match without regard to letter case, so that I do not need to remember exact capitalization.
8. As a gallery visitor, I want search to match with or without the file extension, so that typing a bare name still finds the photo.
9. As a gallery visitor, I want partial-name matching, so that typing a fragment still surfaces candidates.
10. As a gallery visitor, I want to see how many images matched my query, so that I understand the result set size.
11. As a screen-reader user, I want the match count announced politely, so that I receive feedback without interruption.
12. As a gallery visitor, I want a clear empty state when nothing matches, so that I know the search ran and found zero images.
13. As a gallery visitor, I want a one-click Clear action to exit search, so that I can return to the full collection instantly.
14. As a gallery visitor, I want the Escape key to clear the search, so that keyboard dismissal works as expected.
15. As a gallery visitor, I want a Random button next to the search input, so that I can get a surprise image name with one click.
16. As a gallery visitor, I want Random to fill the input with a real image name from the loaded collection, so that submitting always has a match.
17. As a gallery visitor, I want consecutive Random picks to never repeat the same image back-to-back, so that each click feels fresh.
18. As a gallery visitor, I want Random to work repeatedly without reload, so that I can keep discovering.
19. As a gallery visitor, I want submitting a Random-filled name to reveal that image prominently, so that the requested flow pays off immediately.
20. As a gallery visitor, I want the detail modal to open on an exact Random match, so that the image appears without further hunting.
21. As a gallery visitor, I want modal next and previous navigation during search to stay within the filtered results, so that stepping matches what I saw in the grid.
22. As a gallery visitor, I want the modal position indicator to reflect the filtered result set while searching, so that counts stay accurate.
23. As a gallery visitor, I want infinite-scroll loading paused while a search is active, so that paging does not disturb the result set.
24. As a gallery visitor, I want newly loaded collection pages to remain searchable after clearing, so that discovery continues uninterrupted.
25. As a keyboard-only visitor, I want to tab through the search input, Search, Random, and Clear controls and activate each with Enter or Space, so that I have equal access.
26. As a screen-reader user, I want each search control announced with a clear label, so that I understand its purpose.
27. As a mobile visitor, I want the search controls to wrap to their own row at small widths, so that they stay reachable and tappable on my phone.
28. As a gallery visitor, I want the Random and Search controls disabled while the initial collection is loading, so that I cannot trigger a meaningless action.
29. As a gallery visitor, I want the Random control disabled when fewer than two images are loaded, so that the control is honest about when it can act.
30. As a gallery visitor, I want the search view to return to the top on each submitted search or clear, so that results start in view.
31. As a gallery visitor, I want each image card to keep its identity across search filtering, so that images do not flicker, duplicate, or lose loaded state unnecessarily.
32. As a gallery owner, I want search to never alter the underlying collection or server order, so that the canonical order is preserved.
33. As a gallery owner, I want search filtering to compose with the existing shuffle and density controls, so that no feature breaks another.

## Implementation Decisions

- Scope the change to three conceptual areas: the grid header presentation (search form plus Random button), the grid container search state and derived filtered view, and two small pure name utilities (substring filter and random-name pick). No changes to data fetching, pagination, or image services.
- Add a single new test seam: pure name utilities operating on copies of the input list. The filter utility normalizes case and strips extensions before substring comparison and never mutates its input. The random-pick utility reuses the existing guaranteed-different-index selection rule so consecutive picks never repeat. This is the only new test seam; all other behavior reuses existing seams.
- Reuse existing seams and prefer the highest one: the grid container memo that feeds both masonry column building and uniform grid rendering, the masonry layout builder, the paginated image-grid data hook, and the modal navigation helpers remain untouched in logic.
- The header stays presentational: it receives the live query text, change/submit/clear/random callbacks, disabled flags, and an optional result count, renders a native search form with matching pill styling and icon language, and owns no image data or filtering state.
- State and derivation decisions:
  - Live input text and committed (submitted) query are separate pieces of state; the grid filters only on the committed query, not on every keystroke, to avoid layout churn.
  - The filter runs over the widest client truth (everything fetched so far), not just the currently rendered slice, so loaded-but-not-yet-visible names are still found. While a query is active the result list renders directly, bypassing the initial-load and page-size slicing.
  - The filtered view is the single source of truth for rendering, the image-to-index map, modal navigation handlers, and the end-of-collection count. All consumers switch together in one change to avoid split-brain results.
  - Random selection draws from the same source array the search filters, so Random output is searchable by construction. The last-picked index is remembered to enforce the no-immediate-repeat rule.
  - Card identity keys remain stable image identifiers; positional index keys are forbidden.
  - The full collection backing infinite scroll is never reordered or mutated by search; clearing restores the prior ordered view including any shuffle generation.
- Interaction decisions:
  - Submitting an exact filename or title match that yields a single result opens the detail modal on that image; exploratory multi-result submits filter only. Random-originated submits always qualify for modal reveal since they guarantee an exact hit.
  - The infinite-scroll sentinel is hidden and unobserved while a query is active, and the empty-result state replaces it to avoid fetch loops.
  - Each committed search or clear returns the scroll position to the top of the grid region.
  - Disabled state for Search derives from initial loading status; disabled state for Random additionally requires at least two loaded images, with the single-image case filling the only name.
  - When the loaded collection is only a prefix of the server collection, the result count area communicates that only loaded images were searched, with a follow-up affordance to load everything before searching left as a future enhancement.
- Accessibility contract:
  - Native search form semantics with an associated label, search input type, visible focus indicators matching existing header pills, tooltip equivalents, and distinct accessible names for Search, Random-name fill, and Clear actions.
  - Polite live-region status line announcing result counts and empty states, plus a confirmation when Random fills the input.
  - Full keyboard operability including Enter to submit and Escape to clear.

## Testing Decisions

- What makes a good test here: assert externally observable behavior, not implementation details. Prefer: given a list and a query, the filter returns the right members case-insensitively with and without extensions, preserves all members on empty query, returns empty on no match, never mutates the input, and random picks are always members of the source list and never repeat consecutively. Avoid asserting internal state variable names, memo dependency arrays, or exact random sequences.
- Modules to test:
  - The new pure name utilities: filter correctness (case, extension-stripping, substring, empty and no-match cases), purity (input untouched), identity preservation (no loss, no duplicates), and random-pick validity (member of source, uniform coverage over many runs, no immediate repeat, small-list edge cases for zero and one image).
  - The grid container search behavior at the highest feasible seam: submitting filters the rendered cards with stable identity keys, updates the index map, routes modal next and previous through the filtered order, pauses the scroll sentinel during search, and restores the full ordered view on clear. Modal auto-open on exact Random-originated match is covered as observable behavior.
  - Pagination interaction: search runs over the full loaded set rather than the visible slice, and clearing then loading more yields monotonic growth with no duplicate identities.
- Prior art: the shuffle feature established the repo's first runnable precedent with a pure ordering utility plus a Node test-runner script entry, and its spec documents the same container-level manual verification (both layout modes, scroll-load-more, modal stepping). New tests extend that precedent using the same runner for the search seam, with manual verification covering submit-on-Enter, Random-then-Search-to-modal, empty state with Clear, and sentinel pause behavior.

## Out of Scope

- Server-side name search through the image service proxy, tag-based search, or any ingestion work to populate tags.
- Search-everything draining of unfetched server pages, debounced live-as-you-type filtering, or search-term highlighting and scroll-to-card behavior.
- Persisting queries, results, or Random history across reloads, sessions, or share links.
- Search analytics, telemetry, or relevance ranking beyond case-insensitive substring order.
- Changes to density scale, breakpoints, column counts, gaps, fetch page sizes, or the shuffle generation model.
- Visual redesign of the header beyond inserting the search group between the existing navigation/shuffle cluster and the density cluster.

## Further Notes

- Research backing this spec lives alongside repo notes under the research folder as the gallery search plus random-name investigation, including primary-source citations and the rejected alternatives of hook-internal mutation, visible-slice-only filtering, and server-side search for v1.
- Terminology above follows the codebase's own names for gallery, masonry, density, modal, shuffle, and infinite-scroll concepts; no domain glossary or architecture decision records exist in the repo at spec time.
- Issue tracker publication was not possible from this environment: no tracker configuration or triage label vocabulary is present. To enable publishing with the ready-for-agent label, run the project setup flow for engineering skills. This file is saved under the specs folder following the existing shuffle-spec precedent.
