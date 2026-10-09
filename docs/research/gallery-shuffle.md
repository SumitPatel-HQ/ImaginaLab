# Gallery Grid "Shuffle Layout" Button — Research

**Date:** 2026-10-09
**Question:** Can we add a shuffle button to the image-gallery grid header (between Back and density controls) that reshuffles the gallery layout order on click, and what is the correct implementation?
**Stack:** React 19.2.6, Vite 8, Tailwind 4.3, lucide-react 1.16.0, framer-motion 12.39.0 (`package.json:18-24`)

## TL;DR

- **Yes — feasible, 30–60 min.** Pure client-side reorder, no API/data changes needed.
- Shuffle state **must live above `Header`** — in `ImageGrid/index.tsx` (or inside `useImageGrid` with an exposed `shuffle()`). `Header` is presentational and does not own `visibleImages`, so a button wired only inside `Header` cannot reorder the grid.
- Recommended: **Option A — `shuffleSeed`/`shuffledOrder` memo in `index.tsx` + Fisher–Yates on a copy + `onShuffle` prop on `Header`** (smallest diff, infinite-scroll safe, modal-safe). Animate with a cheap fade/stagger first; full FLIP `layout` animation across masonry columns is optional follow-up.
- Keep stable `key={image.id}` on every card; never switch to index keys.

## Findings (every claim sourced)

### 1. React 19 state patterns for shuffling

- **Never mutate state arrays; replace with a copy** (`[...arr]`, `map`, `filter`). Source: React docs `useState` — "Updating arrays in state" pattern (https://react.dev/reference/react/useState#updating-arrays-in-state; Context7 `/reactjs/react.dev` snippet "Managing list state with arrays in useState" confirms `setTodos([...todos, …])` / `map` / `filter` replace-instead-of-mutate).
- **Keys must be stable IDs, not array indices.** Source: React docs "Rendering lists — Keeping list items in order with key" (https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key; Context7 snippet "Render a list of components from an array using map() and keys" shows `<li key={person.id}>`). Repo already complies:
  - `src/components/ImageGrid/index.tsx:140` — masonry `key={image.id}`
  - `src/components/ImageGrid/index.tsx:159` — grid mode `key={image.id}`
  - Masonry column wrappers use `key={masonry-col-${colIndex}}` (`index.tsx:135`) — correct, columns are positional containers.
- **Fisher–Yates on a copy + functional `setState` + `useCallback` with correct deps** is the idiomatic shuffle. `useCallback` caches the handler between renders per the deps array (https://react.dev/reference/react/useCallback; Context7 snippet "Memoizing a function using useCallback"). Derive the shuffled view with `useMemo` on `[visibleImages, shuffleSeed]` so `columns`/`imageIndicesMap` recompute exactly once per shuffle (memo semantics: https://react.dev/reference/react/useMemo).
- Standard Fisher–Yates (no React-doc page for the algorithm itself; it is the canonical unbiased shuffle — copy first, then `for (i = n-1; i > 0; i--) { j = random(0..i); swap }`):
  ```ts
  const fisherYates = <T,>(arr: T[]): T[] => {
    const a = [...arr]; // copy — never mutate state in place (react.dev useState rule above)
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  ```

### 2. lucide-react `Shuffle` icon — precedent already in repo

- `src/components/Gallery/Controls.tsx:2` — `import { ChevronLeft, ChevronRight, Shuffle, Library } from 'lucide-react';`
- `src/components/Gallery/Controls.tsx:46-55` — existing Shuffle button precedent: `onClick={onRandom}`, `disabled={shuffleLoading}`, `aria-label="Random image"`, `<Shuffle className={...} />`.
- `src/components/ImageGrid/Header.tsx:2` — currently `import { ArrowLeft, Minus, Plus } from 'lucide-react';` — just add `Shuffle` to this import.
- Usage pattern (tree-shakable named import, render as component): Lucide React docs (https://lucide.dev/guide/react/getting-started; Context7 `/websites/lucide_dev` snippet "Import and use the Camera icon": `import { Camera } from 'lucide-react'` then `<Camera />`). Same shape for `Shuffle`. Aliased names (`ShuffleIcon` / `LucideShuffle`) also valid (https://lucide.dev/guide/packages/lucide-react#aliases).

### 3. framer-motion layout animation — appropriate but optional

- framer-motion `^12.39.0` is already a dependency (`package.json:18`); no install needed. (Note: the library is now published as "Motion" — docs at https://motion.dev/.)
- Applicable APIs:
  - `layout` prop on `motion.*` auto-animates layout changes: `<motion.div layout />`, with `"position"`/`"size"` variants (https://motion.dev/docs/react-motion-component#layout-props; Context7 `/websites/motion_dev` snippet "<motion /> Layout Props").
  - `LayoutGroup` coordinates sibling layout animations; wrap trees combining layout + exit animations (https://motion.dev/docs/react-layout-group; Context7 snippet "Coordinate sibling layout animations with LayoutGroup").
  - `Reorder.Group`/`Reorder.Item` is for **drag-to-reorder** (https://motion.dev/docs/react-reorder; Context7 snippet "Create a reorderable list with Reorder.Group") — **not** needed here since shuffle is button-triggered, not drag-driven.
- Repo status: current cards are **CSS-only** — `src/components/ImageGrid/animations/HoverAnimation.tsx:1-3,35-44` uses plain `<div>` + CSS classes/vars, no `motion` import. So animation is greenfield: cheapest is a keyed fade/stagger on reshuffle; `layout` FLIP across the flex-column masonry is possible but cross-column moves don't interpolate smoothly without extra work — defer to follow-up.

### 4. Repo architecture — where shuffle must live (read directly)

- `Header` is presentational and owns no image data. Props: `onClose, onToggleLayout, gridDensity, onGridDensityChange, onSliderStart` (`Header.tsx:4-10`). It destructures everything **except** `onToggleLayout` (`Header.tsx:12-17`) — dead prop, layout toggle button isn't even rendered. There is nowhere in `Header` to reorder from; a new `onShuffle` prop is required, placed between the Back block (`Header.tsx:73-81`) and the density block (`Header.tsx:83-127`).
- `visibleImages` is owned by `useImageGrid(images)` and consumed in `index.tsx:29-37`. Initial slice `INITIAL_LOAD=30`, pages of `IMAGES_PER_LOAD=15` (`useImageGrid.ts:16-17,37-40`).
- Both render paths derive from `visibleImages`:
  - Masonry: `columns` memo deps `[visibleImages, columnCount, layoutMode]` → `buildMasonryLayout(visibleImages, columnCount)` (`index.tsx:48-54`); `columnCount` from `getColumnCount(gridDensity, screenWidth)` (`index.tsx:43-45`, `masonry.ts:109-127`).
  - Grid mode maps `visibleImages` directly (`index.tsx:157`).
  - So shuffling the **order** of `visibleImages` (or a memo derived from it) reflows both modes with zero layout-code changes.
- **Masonry prefix-stability does not block shuffle — it is intentionally bypassed.** `appendToMasonryLayout` guarantees "existing images NEVER move on append" and scratch-build on `[batch1, batch2]` matches building `[batch1]` then appending (`masonry.ts:39-46,88-93`). A shuffle changes the input order, so `buildMasonryLayout` runs a full rebuild and every card may move — that is the desired effect, not a bug. Height weights (`masonry.ts:14-25`) are per-image, order-independent.
- **Why not "shuffle inside Header alone":** Header receives no `visibleImages`/setter; local `useState` there would reorder nothing. State must lift to `index.tsx` (or into the hook).
- **Existing shuffle precedent is single-pick, not reorder:** `useRandomImage` (`src/hooks/gallery/random.ts:16-57`) picks one random index via `getFallbackIndex` (`src/hooks/gallery/randomUtils.ts:44-49`, guaranteed-different-index arithmetic) — reusable for "Surprise me" but **not** a full-array shuffle. Do not reuse it for layout shuffle; write Fisher–Yates.

## Implementation options

### Option A (recommended): `shuffleSeed` + shuffled memo in `index.tsx`

```tsx
// index.tsx
const [shuffleSeed, setShuffleSeed] = useState(0);
const orderedImages = useMemo(() => {
  if (shuffleSeed === 0) return visibleImages;
  const a = [...visibleImages];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}, [visibleImages, shuffleSeed]);
const shuffle = useCallback(() => setShuffleSeed(s => s + 1), []);
// Replace visibleImages with orderedImages in columns memo (deps [orderedImages, columnCount, layoutMode]),
// imageIndicesMap, grid map, modal handlers; pass onShuffle={shuffle} to Header.
```

```tsx
// Header.tsx — between Back (line 81) and density block (line 83):
<button onClick={onShuffle} aria-label="Shuffle gallery layout" title="Shuffle layout"
  disabled={shuffleDisabled}
  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
  <Shuffle className="w-5 h-5" />
  <span className="hidden sm:block">Shuffle</span>
</button>
```

- Tradeoffs: **+** smallest diff; `visibleImages`/hook untouched so infinite scroll keeps working; new fetches append unshuffled tail (acceptable, reshuffle any time); modal/nav derive from `orderedImages` so indices stay consistent. **−** new items don't auto-shuffle (fine).
- A11y: `aria-label`, `title`, `disabled={isInitialLoading || visibleImages.length < 2}`, visible focus ring, `aria-live="polite"` status line optional ("Gallery order shuffled").
- Animation: add `key={shuffleSeed}`-driven fade on the gallery container, or stagger via CSS; graduate to `motion` `layout` later.

### Option B: `shuffle()` inside `useImageGrid`

```ts
// useImageGrid.ts
const shuffle = useCallback(() => {
  setVisibleImages(prev => {
    const a = [...prev];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  });
}, []);
// return { ..., shuffle }
```

- Tradeoffs: **+** encapsulates data logic; any consumer gets shuffle. **−** touches the pagination-sensitive hook: must shuffle **only `visibleImages`, never `allImages`** (else `fetchMoreData`'s `allImages.slice(visible.length, …)` in `useImageGrid.ts:117-122` + `mergeUniqueImages` at `:22-32` desyncs — shuffled `allImages` would re-emit already-visible images as "next page" and skip others). Needs a test pinning `allImages` order invariance. Slightly larger blast radius than A.

### Option C: view-only CSS `order` shuffle (not recommended)

Assign each card a random CSS `order` within its column container without changing data order.

- Tradeoffs: **+** zero data risk. **−** only reorders **within** each masonry column (columns are separate flex parents, `index.tsx:133-148`), so the visible change is weak; modal prev/next (`useModal.ts:18-30`) and `currentIndex` (`index.tsx:215`) follow data order, diverging from visual order — confusing. DOM order vs visual order mismatch also harms keyboard/screen-reader navigation. Reject unless as a throwaway prototype.

## Risks

1. **Infinite scroll + shuffle interaction** — `fetchMoreData` slices `allImages` by `visibleImages.length` (`useImageGrid.ts:112-129`) and API pages append via `mergeUniqueImages` (`:22-32,144-145`). Shuffling only the view (A) or only `visibleImages` (B) preserves dedupe invariants; shuffling `allImages` breaks paging. Mitigation: never mutate `allImages`; test: shuffle → scroll → assert no duplicate `id`s, count monotonic.
2. **Masonry full rebuild cost** — shuffle rebuilds all columns (`index.tsx:48-54` → `masonry.ts:94-100`, O(n·c)). n≤~hundreds, c≤6 — trivial. No virtualization in this view to invalidate.
3. **Modal index mapping** — `imageIndicesMap` (`index.tsx:57-61`), `currentIndex={visibleImages.findIndex(…)}` (`index.tsx:215`), `goToNext/PrevImage` via `findIndex` (`useModal.ts:18-30`), `ImageModal key={selectedImage.id}` (`index.tsx:209`). All id-derived → correct post-shuffle **if** every consumer switches to the shuffled array. Risk is partial migration (some spots still reading raw `visibleImages`). Mitigation: rename to `orderedImages` and update all five consumers in one commit.
4. **Fetch-priority churn** — `ImageCard index<6 → eager/high` (`ImageCard.tsx:20-21,32-34`). Post-shuffle a different six become eager; images already cached, negligible. No action.
5. **Scroll jump** — reshuffled masonry heights change page length; user stays at same `scrollY`, landing on different content. Acceptable for explicit shuffle; optionally `window.scrollTo({top:0})` or record/restore anchor. Keep Back-button/scroll-sentinel behavior unchanged.
6. **Animation scope creep** — cross-column FLIP with `layout`/`LayoutGroup` on dynamically-built flex columns can look janky and fight `HoverAnimation` CSS transforms. Ship static shuffle first, animate as follow-up.

## Recommended next step

Implement **Option A** (30–60 min): add `shuffleSeed` state + `orderedImages` memo + `shuffle` callback in `index.tsx`, thread `onShuffle` into `Header` with the `Shuffle` button between Back and density controls (matching `Controls.tsx:46-55` styling/a11y), swap all five `visibleImages` consumers to `orderedImages`, keep `key={image.id}`, add `disabled` when loading/fewer than 2 images, and cover with a Fisher–Yates purity test + manual check (shuffle both modes, scroll-load more, open modal and step next/prev).
