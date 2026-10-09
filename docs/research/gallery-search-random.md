# Gallery Search Bar + Random-Name Button — Research

**Date:** 2026-10-09
**Question:** Can we add a search bar where a single Random button fills the input with a random image name, and clicking Search shows that image?
**Stack:** React 19.2.6, Vite 8, Tailwind 4.3, lucide-react 1.16.0, framer-motion 12.39.0 (`package.json:18-24`), ImageKit List Files API via `/api/files` proxy (`src/services/ImageKit/api.ts:4-5,46-75`)

## TL;DR

- **Yes — feasible, 1–3 hours.** Pure client-side work; no backend change required for v1.
- Search state **must live in `src/components/ImageGrid/index.tsx`** (or a small `useGallerySearch` hook it owns) — `Header` is presentational and owns no image data, same constraint as the shuffle button (`Header.tsx:4-21`; see `gallery-shuffle.md:54-61`).
- Recommended: **Option A — controlled search input in `Header` + `query`/`submittedQuery` state lifted to `index.tsx` + `useMemo` filter over `allImages` + Random (Dices/Shuffle) button reusing `getFallbackIndex` + Search filters the grid and scroll-to/highlights the exact match.** Server-side ImageKit `searchQuery` is a follow-up, not v1.
- Searchable name fields already exist on every image: `fileName` (with extension), `title` (without extension), `filePath` — populated in `loader.ts:76-89` and `getImagesPageFromAPI` at `loader.ts:121-139`, typed in `types.ts:2-17`.

## Findings (every claim sourced)

### 1. React 19 pattern — lift the query state to the list owner

- **Controlled input + lifted state is the canonical React search pattern.** Source: React docs "Sharing state between components — Filtering a list" (https://react.dev/learn/sharing-state-between-components; Context7 `/reactjs/react.dev` snippet "Filtering a list"): `SearchBar` must NOT own `query` alone — move `query`/`setQuery` to the parent (`FilterableList`) and pass `query` + `onChange` down, then derive the visible list with `filterItems(items, query)`.
- Applied here: `Header` is the `SearchBar`; `ImageGrid/index.tsx` is the `FilterableList`. It owns `visibleImages`/`allImages` via `useImageGrid(images)` (`index.tsx:29-37`) and renders both `Header` (`index.tsx:108-114`) and both grid paths (`index.tsx:126-167`). A search box wired only inside `Header` (local `useState` there) can display text but cannot filter anything — same "why not inside Header alone" argument as `gallery-shuffle.md:61`.
- **Derive the filtered view with `useMemo` on `[sourceList, submittedQuery]`** so masonry columns / `imageIndicesMap` recompute exactly once per search. Memo semantics: https://react.dev/reference/react/useMemo (Context7 snippet "Memoizing an object dependency before passing to useMemo": `visibleItems = useMemo(() => searchItems(allItems, …), [allItems, …])`).
- **Never mutate; case-insensitive compare on copies.** `filterItems` reference does `query.toLowerCase()` + `item.name…toLowerCase()` word matching (Context7 `/reactjs/react.dev` "Filtering a list challenge" data.js). Use `.toLowerCase().includes(...)` (substring, friendlier for filenames than the docs' `startsWith`) and strip extensions for matching.

### 2. What is searchable — fields already on the client

- `ImageKitImage` carries `title`, `fileName`, `fileType`, `filePath` (`types.ts:2-17`).
- Populated from the API file record: `title: getFileNameWithoutExtension(file.name)` (`loader.ts:78`), `fileName: file.name` (`loader.ts:84`), `fileType`/`filePath`/`width`/`height` (`loader.ts:85-88`). Same mapping in the paged path `getImagesPageFromAPI` (`loader.ts:121-139`).
- Filename helpers exist: `getFileExtension`, `getFileNameWithoutExtension` (`api.ts:163-177`); `extractImageFilename` falls back to `src` URL parsing when `fileName` is absent (`randomUtils.ts:12-24`).
- So the Random button has a ready name pool: `allImages.map(i => i.fileName ?? i.title)`. No new data plumbing.

### 3. Client-side filter vs ImageKit server-side search

- **Client-side (v1):** filter the already-loaded array in `index.tsx`. Zero API/proxy changes, instant, case-insensitive, substring-capable. Limitation: can only match what has been loaded (see §5 pagination).
- **Server-side exists but is restricted:**
  - `ListFilesParams` already supports `searchQuery`, `tags`, `fileType`, `path`, `limit`, `skip`, `sort` (`api.ts:24-32`), forwarded as query params to `${IMAGEKIT_API_ENDPOINT}?…` (`api.ts:59-74`).
  - ImageKit `searchQuery` name syntax: exact match `name="file-name.jpg"` is **always case-sensitive**; operators `=`, `:`, `IN`, `NOT =`, `NOT IN`, `HAS` exist (`name = "file.jpg"` exact, `name: "file"` prefix, `name HAS "red"` substring). Source: ImageKit docs "List and Search Assets" (https://imagekit.io/docs/api-reference/digital-asset-management-dam/list-and-search-assets; Context7 `/websites/imagekit_io` snippets "Search media library files by name" + "name parameter allows filtering…").
  - **But `getImagesPageFromAPI` does not expose `searchQuery`** — it hardcodes `{ path, fileType: 'all', limit, skip, sort: 'ASC_NAME' }` (`loader.ts:113-119`). Wiring server search means threading a param through `loader.ts:108-119` → `api.ts:46-68` → the `/api/files` proxy, plus handling case-sensitivity (exact `=` would miss `Photo.JPG` vs `photo.jpg`) and paged search results. Defer to follow-up; client filter covers the asked flow.
- `tags` param exists (`api.ts:28,68`) but nothing in `loader.ts:76-89` populates tags on `ImageKitImage`, so tag search is not currently viable without ingestion work.

### 4. Random-name button — reuse the guaranteed-different-index precedent

- `getFallbackIndex(images, currentIndex)` returns `(safe + 1 + random(len-1)) % len` — uniform over all indices except the current one, never repeats, O(1) (`randomUtils.ts:44-49`).
- `useRandomImage` wraps it with `shuffleLoading` guard, single/empty-array handling (`random.ts:20-57`); `Main` view's dice precedent is the `Shuffle` button with `disabled={shuffleLoading}`, `aria-label="Random image"` (`Controls.tsx:46-55`).
- Grid-header precedent: `Header` already imports `Shuffle` and renders an `onShuffle`/`isShuffleDisabled` button between Back and density (`Header.tsx:2,10-11,85-94`).
- For "randomize the input": pick `idx = getFallbackIndex(sourceList, lastRandomIdx)`, set `query` to `fileName` (or `title`) of `sourceList[idx]`, remember `lastRandomIdx` to avoid repeats. No API call — same list the search filters, so Random output is always searchable (self-consistent by construction).
- Icon: `Search` for the search affordance, `Dices` (or reuse `Shuffle`) for random — same tree-shakable named-import pattern as `Shuffle` (`import { Search, Dices } from 'lucide-react'`; Lucide React docs https://lucide.dev/guide/react/getting-started; repo precedent `Controls.tsx:2`, `Header.tsx:2`).

### 5. Pagination — the one correctness trap: search `allImages`, not `visibleImages`

- `useImageGrid` keeps two arrays: `allImages` (everything fetched) vs `visibleImages` (rendered slice; `INITIAL_LOAD=30`, `IMAGES_PER_LOAD=15`, `useImageGrid.ts:16-17,37-43`).
- `fetchMoreData` first slices in-memory remainder, then pages the API by `skip = allImages.length` and merges via id-dedupe `mergeUniqueImages` (`useImageGrid.ts:102-159`, `22-32`).
- Consequence: filtering only `visibleImages` misses names that are loaded-but-not-yet-visible AND names not yet fetched at all. **Filter `allImages`** (the widest client truth), render the matches directly (bypassing the 30/15 slicing while a query is active), and pause the infinite-scroll sentinel during search. Note `allImages` itself can still be a prefix when `hasMore` is true — surface "N of ? loaded; clear search or load all to search everything" or a "search in all" affordance that drains `fetchMoreData` first (see Option B).
- Modal nav (`useModal.ts:18-30` findIndex-based next/prev) and `imageIndicesMap` (`index.tsx:57-61`) must derive from the **filtered** array while searching, or next/prev jumps to images outside the result set (same partial-migration risk as `gallery-shuffle.md:128` Risks §3).

### 6. Search behaviors — filter vs scroll-to vs modal (pick per UX)

- **Filter grid (recommended default):** `submittedQuery` → `filteredImages` memo → feed columns/grid/modal maps. Predictable with masonry (full rebuild is the norm; `buildMasonryLayout` rebuild per input order), composes with density toggle, empty state is natural ("No images match X" + Clear button).
- **Scroll-to + highlight:** keep full grid, on Search `document.getElementById(img-id)?.scrollIntoView({behavior:'smooth', block:'center'})` + temporary ring highlight. Better for "where is it" but fights infinite scroll (target may not be rendered yet) and masonry reflow; needs `id={`grid-${image.id}`}` anchors on `ImageCard` wrappers first.
- **Open modal directly on exact match:** fastest "it will appear" payoff for the Random→Search flow (Random guarantees an exact `fileName`, so exact match always exists). Combine: exact match → open modal AND keep filtered grid behind it. Modal path already exists (`openModal(image)`, `index.tsx:39,140-144,159-164`).
- Recommended v1: filter grid + auto-open modal on exact single match (covers the user's literal flow), scroll-to as follow-up.

### 7. A11y + styling notes

- Search is a `<form role="search" onSubmit={…}>` with `<label htmlFor>` (visually hidden ok), `type="search"`, `aria-label`, clear button (`aria-label="Clear search"`), `aria-live="polite"` result-count status, `Escape` clears. Random button: `aria-label="Fill search with a random image name"`, `title` tooltip, `disabled` when list empty/loading.
- Header bar is already `sticky top-2 z-50 … rounded-full` flex-wrap (`Header.tsx:76`); place the search form between the Back/Shuffle group (`Header.tsx:77-95`) and density controls (`Header.tsx:97-141`), wrapping to its own row on mobile (`flex-wrap` already handles it). Icons `Search`/`Dices`/`X` match existing `w-5 h-5` + `bg-white/5 hover:bg-white/10 rounded-full` button language (`Header.tsx:78-94`).

## Implementation options

### Option A (recommended): client-side filter over `allImages` + exact-match modal (1–3 h)

```tsx
// index.tsx
const { allImages, visibleImages, hasMore, /* … */ } = useImageGrid(images);
const [query, setQuery] = useState('');             // live input text
const [submittedQuery, setSubmittedQuery] = useState(''); // committed on Search
const [lastRandomIdx, setLastRandomIdx] = useState<number | null>(null);

const randomizeName = useCallback(() => {
  if (allImages.length === 0) return;
  const idx = getFallbackIndex(allImages, lastRandomIdx ?? -1) ?? 0; // randomUtils.ts:44-49 (accepts any currentIndex; -1 → safe 0 path)
  setLastRandomIdx(idx);
  const name = allImages[idx].fileName ?? allImages[idx].title;
  setQuery(name);            // fills the input; user hits Search (or auto-submit — decide, see Risks §6)
}, [allImages, lastRandomIdx]);

const commitSearch = useCallback((raw: string) => {
  setSubmittedQuery(raw.trim().toLowerCase());
}, []);

const baseList = submittedQuery ? allImages : visibleImages; // search across everything loaded
const filteredImages = useMemo(() => {
  if (!submittedQuery) return baseList;
  const stripExt = (n: string) => n.replace(/\.[a-z0-9]+$/i, '');
  return allImages.filter(img => {
    const names = [img.fileName ?? '', img.title, stripExt(img.fileName ?? ''), img.filePath ?? ''];
    return names.some(n => n.toLowerCase().includes(submittedQuery));
  });
}, [allImages, baseList, submittedQuery]);

// exact match → open modal on submit:
const submitAndReveal = (raw: string) => {
  commitSearch(raw);
  const norm = raw.trim().toLowerCase();
  const exact = allImages.find(img =>
    img.fileName?.toLowerCase() === norm || img.title.toLowerCase() === norm);
  if (exact) openModal(exact);
};
// Feed filteredImages (not visibleImages) into columns memo, imageIndicesMap,
// grid map, modal handlers, sentinel visibility, and result count.
```

```tsx
// Header.tsx — new props: query, onQueryChange, onSubmitSearch, onRandomName, onClearSearch, resultCount
<form role="search" onSubmit={(e) => { e.preventDefault(); onSubmitSearch(query); }}
  className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
  <label htmlFor="gallery-search" className="sr-only">Search images by name</label>
  <div className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-full text-white/80 focus-within:bg-white/10">
    <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
    <input id="gallery-search" type="search" value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder="Search image name…"
      className="bg-transparent outline-none text-sm placeholder:text-white/40 w-36 sm:w-48" />
    {query && (
      <button type="button" onClick={onClearSearch} aria-label="Clear search">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
  <button type="submit" aria-label="Search" className="…pill…">Search</button>
  <button type="button" onClick={onRandomName} aria-label="Fill search with a random image name"
    title="Random image name" disabled={randomDisabled} className="…pill…">
    <Dices className="w-5 h-5" aria-hidden="true" />
  </button>
</form>
<p aria-live="polite" className="sr-only">{statusLine /* e.g. "3 results for photo" */}</p>
```

- Tradeoffs: **+** no backend/proxy change; case-insensitive substring; Random output always matches (same source array); modal auto-open nails the requested flow; sentinel paused during search avoids paging weirdness. **−** only searches loaded images when `hasMore` (mitigate with hint text + "load all" affordance); exact-match modal on every keystroke-submit may annoy for exploratory typing (only auto-open when the query came from Random or is an exact `fileName` hit — see Risks §6).

### Option B: Option A + "search everything" drain (A + 30–60 min)

Same as A, plus when `submittedQuery && hasMore`, offer "Search all (load N more)" which loops `fetchMoreData()` until `!hasMore` (or a cap, e.g. 2000 items) before filtering, with a loading state on the Search button.

- Tradeoffs: **+** closes the loaded-prefix gap without server work; reuses `getImagesPageFromAPI(skip, limit)` paging (`loader.ts:108-150`) and `mergeUniqueImages` dedupe (`useImageGrid.ts:22-32`). **−** slow on huge libraries (sequential `skip`-paged fetches); needs cancellation + cap; still client-side so fine to add later behind the same UI.

### Option C: server-side `searchQuery` via `/api/files` (half-day, not recommended for v1)

Thread `searchQuery` through `getImagesPageFromAPI(skip, limit, searchQuery?)` (`loader.ts:108-119`) → `listImageKitFiles` (`api.ts:46-68`) → proxy, using `name HAS "x"` substring (case-sensitive) or exact `name="f.jpg"`.

- Tradeoffs: **+** searches the whole library regardless of load state; correct long-term for 10k+ assets. **−** case-sensitive misses (`PHOTO.jpg` vs `photo.jpg`); needs proxy/backend change + new paged-search UI state + debounce; Random-name→Search flow gains nothing (client already has the name). Reject for v1; revisit if the library outgrows client-side filtering.

## Risks

1. **Searching `visibleImages` instead of `allImages`** — misses loaded-but-unrendered names and everything past the 30/15 slices (`useImageGrid.ts:16-17,37-43,102-129`). Mitigation: filter `allImages`; while searching, render matches directly and hide/disable the sentinel (`index.tsx:170-198`).
2. **Partial migration of consumers** — columns memo (`index.tsx:48-54`), `imageIndicesMap` (`index.tsx:57-61`), grid map (`index.tsx:157`), modal `totalImages`/`currentIndex` (`index.tsx:214-215`), `handleGoToNext/Prev` (`index.tsx:103-104` → `useModal.ts:18-30`) must ALL read the filtered array during search or next/prev and counts disagree with what's on screen. Mitigation: single `displayImages` variable; rename in one commit.
3. **Masonry + live filtering churn** — filtering on every keystroke rebuilds all columns per keystroke. Mitigation: filter only on committed submit (`submittedQuery`), not on `query`; keep the input uncontrolled-live but the grid submit-gated.
4. **Empty / no-match state** — a filter with zero hits renders an empty grid + still-armed sentinel (infinite loop risk if sentinel keeps firing `fetchMoreData`). Mitigation: when `submittedQuery && filtered.length === 0`, show "No images match 'x'" + Clear button, and skip rendering/observing the sentinel.
5. **Random with tiny lists** — `getFallbackIndex` returns `null` for ≤1 image (`randomUtils.ts:45`); `useRandomImage` short-circuits 0/1-image cases (`random.ts:23-31`). Mitigation: disable Random when `allImages.length < 2`; single-image case fills the only name.
6. **Auto-open modal surprise** — auto-opening the modal on every exact submit hijacks exploratory search. Mitigation: auto-open only when (a) the submit came from the Random button, or (b) exactly one result and it is an exact `fileName` hit; otherwise just filter. Pass an `openOnExact` flag from the Random handler.
7. **Scroll position jump on submit** — filtered masonry changes page height while user stays at same `scrollY`. Mitigation: `window.scrollTo({ top: 0 })` (grid view owns its scroll; `ScrollToTop` component precedent at `index.tsx:204`) on each committed search/clear.

## Recommended next step

Implement **Option A** (1–3 h): lift `query`/`submittedQuery` into `ImageGrid/index.tsx` with a `filteredImages` memo over `allImages` (case-insensitive, extension-stripped); add the search form + Random (`Dices`) button to `Header` between the Back/Shuffle group and density controls reusing existing pill styling; wire Random via `getFallbackIndex` over `allImages` filling `fileName`; on Search filter the grid, show `aria-live` count + empty state with Clear, pause the sentinel while searching, point all five `visibleImages` consumers at the display array, and auto-open the modal only on Random-originated exact matches. Add Option B's "load all then search" only if testers hit the unloaded-prefix gap.
