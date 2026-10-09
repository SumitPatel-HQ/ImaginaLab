# Spec: Google Chrome PWA Installation & In-Page Experience

## Problem Statement

As an ImaginaLab user browsing my photo gallery in Google Chrome (on desktop or mobile), I want to install the gallery directly as a standalone desktop or mobile application so that it feels like a native, distraction-free app without browser address bars, tabs, or bookmarks. 

Currently, Google Chrome does not show the "Install App" button in the address bar (Omnibox), nor does the web app provide any button or banner on its pages to trigger installation. Furthermore, opening the app in Chrome offers no offline shell resiliency or home-screen presence.

## Solution

Transform ImaginaLab into a fully compliant Progressive Web App (PWA) recognized by Chromium-based browsers (Google Chrome, Edge, Brave). 

The app provides a valid Web Application Manifest, standardized icons, and a lean service worker with strict network bypasses for dynamic proxy and media calls. When a user visits the gallery in Google Chrome, Chrome detects that the app is installable and enables the native Omnibox install button. Simultaneously, the gallery interface captures the install prompt event and reveals an elegant, accessible in-page "Install App" action in the header controls. Activating this action invokes Chrome's installation dialog. Once installed, or when launched in standalone window mode, the in-page install control smoothly unmounts so the interface remains pristine and distraction-free.

## User Stories

1. As a desktop Chrome user, I want Chrome's address bar to display the native "Install ImaginaLab" icon, so that I can install the gallery directly from the browser omnibox.
2. As a desktop Chrome user, I want Chrome's three-dots menu to show an "Install ImaginaLab..." option, so that I have a standard browser menu pathway to installation.
3. As a gallery visitor, I want an in-page "Install App" button visible in the gallery controls, so that I can discover and trigger installation without having to search the browser chrome.
4. As a gallery visitor, I want the in-page install button styled consistently with existing frosted-glass controls, so that it looks native to the app design system.
5. As a gallery visitor, I want clicking the in-page install button to launch Google Chrome's native installation confirmation dialog, so that I can complete the installation in one gesture.
6. As a gallery visitor, I want the install dialog to clearly display the app name, icon, and description, so that I know what application is being installed.
7. As a mobile Chrome user, I want the in-page install button to be accessible on small mobile viewports, so that I can install the app directly to my phone's home screen.
8. As an Android user, I want the installed app icon to use an adaptive maskable format, so that the icon fits neatly into my launcher's icon shape without an artificial white border.
9. As a gallery user who installs the app, I want the in-page install button to automatically disappear once installation completes, so that I am never asked to install an already-installed app.
10. As a user running ImaginaLab in standalone mode (from desktop or home screen), I want all install prompts completely hidden, so that the standalone window remains clean and focused.
11. As a keyboard-only user, I want to navigate to the install button with the Tab key and trigger it with Enter or Space, so that the install feature is fully keyboard-accessible.
12. As a screen-reader user, I want the install button announced with a descriptive label (such as "Install ImaginaLab application"), so that I understand its purpose.
13. As a gallery user, I want the install button to display a clear tooltip on hover and focus, so that its function is immediately obvious.
14. As a user who dismisses the install dialog, I want the in-page install button to remain available, so that I can install the app later when I am ready.
15. As a gallery user, I want the app to launch instantly from my OS application launcher (Windows Start Menu, macOS Launchpad, Android App Drawer), so that I can open the gallery like any native program.
16. As a gallery owner, I want the service worker to strictly avoid caching dynamic ImageKit media requests, so that device storage is never exhausted by high-resolution image assets.
17. As a gallery owner, I want the service worker to strictly avoid caching backend API proxy calls, so that real-time credentials, sorting, pagination, and secret proxy headers never become stale.
18. As a gallery owner, I want the service worker to cache the static application shell, so that the app opens reliably even on spotty network connections.
19. As a developer, I want development server hot-module-replacement (HMR) to work without interference from the service worker, so that local development velocity is preserved.
20. As a gallery visitor, I want installation to preserve all existing client-side preferences (such as grid density, layout mode, and shuffle state), so that nothing is reset upon installing.
21. As a gallery visitor, I want the app window to have a branded dark theme color applied to the OS title bar, so that the standalone experience matches the gallery's dark aesthetic.
22. As a gallery owner, I want the PWA setup to require zero heavy build dependencies, so that future Vite and React upgrades remain frictionless.

## Implementation Decisions

- **Scope of modifications:**
  - Application HTML entry: metadata, theme color, apple-touch-icon, and manifest link declaration.
  - Public static assets: Web App Manifest file and standardized PNG application icons.
  - Service Worker layer: a lean, dedicated service worker handling app-shell caching and strict network-only passthrough for proxy and media endpoints.
  - Install state management: a dedicated React hook encapsulating installation detection, event suppression, and execution.
  - Presentation layer: an optional install action placed inside the gallery header controls.

- **Seams and Boundaries:**
  - Single primary test seam: the install state hook. It encapsulates the browser lifecycle events (`beforeinstallprompt`, `appinstalled`) and display-mode media queries, exposing a simple state interface (`isInstallable`, `isInstalled`, `promptInstall`).
  - Network-boundary seam: the service worker fetch interceptor, which establishes a strict allowlist/denylist boundary:
    - Internal static shell requests follow a cache-then-network or cache-fallback strategy.
    - External image delivery hostnames and internal API proxy paths are strictly excluded from service worker caching.

- **State and Prompt Lifecycle Decisions:**
  - Capture and stash: when the browser triggers the install prompt event, the event default behavior is prevented and the event is retained in state.
  - User gesture execution: triggering the browser prompt must only occur inside a direct user click/tap handler, as required by browser security policies.
  - Single-use consumption: once the prompt is called, the saved event reference is cleared.
  - Display mode detection: initial state detects whether the window is already running in standalone display mode or if the application has already been installed, immediately suppressing promotional UI.

- **Manifest Specifications:**
  - Identity: unique application ID, human-readable name ("ImaginaLab Gallery"), and compact short name ("ImaginaLab").
  - Presentation mode: `standalone` display mode with dark background and theme colors matching the application's dark palette.
  - Scope and entry: root scope with root start URL.
  - Icons: standard 192×192 PNG, 512×512 PNG, and 512×512 maskable PNG.

- **UI Presentation Decisions:**
  - The install control is conditionally mounted in the top navigation bar alongside existing header controls (between navigation/shuffle and grid density controls).
  - The icon uses a standard download or desktop install symbol from the existing icon set.
  - The button uses the existing pill design language with glassmorphism hover and focus rings.
  - If the browser does not support install prompts or the app is already running in standalone mode, the button does not render at all.

- **"Soft Hands" Architecture Safeguards:**
  - No new external npm build dependencies or plugins; uses native browser capabilities.
  - Existing Vite proxy configuration, Tailwind styles, and React 19 rendering remain unchanged.
  - Service worker registration is gated or configured so it does not hijack local development reload cycles.

## Testing Decisions

- **What makes a good test:**
  - Tests must assert observable behavior across the seam, not internal variable names or browser implementation quirks.
  - The install state seam must be tested for correct status transitions (e.g., installable when prompt event fires, uninstalled to installed transition when completed, hidden when running standalone).
  - The network-boundary seam must be tested to ensure that API requests and ImageKit media requests are never intercepted or cached by the service worker.
- **Modules to test:**
  - The install state hook (using simulated browser events and media queries).
  - The service worker fetch routing logic (verifying URL pattern matching and cache bypass rules).
  - The header presentation component (asserting conditional rendering based on installability state).
- **Prior art:**
  - The repository contains unit tests using the native Node test runner (`package.json:10` running `test/masonry.test.ts`).
  - New automated tests for the install state logic and service worker routing rules should adhere to the same native Node test runner setup.

## Out of Scope

- Packaging the application for native app stores (Google Play Store via TWA / Microsoft Store via MSIX / Apple App Store).
- Full offline caching of high-resolution user image libraries.
- Background sync or push notifications.
- Custom installation UI dialogs that replace Chrome's native system confirmation sheet.

## Further Notes

- Chrome DevTools provides an Application panel with dedicated Manifest, Service Workers, and Storage debugging tools that will be used to manually verify compliance against Chrome's Installability criteria.
- On macOS and Windows, Google Chrome 108+ automatically upgrades the installation confirmation dialog to Richer Install UI when screenshots are included in the manifest. Adding desktop and mobile preview screenshots can be explored as a cosmetic enhancement in a follow-up iteration.
