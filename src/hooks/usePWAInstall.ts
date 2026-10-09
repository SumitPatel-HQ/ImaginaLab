// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect, useCallback } from 'react';

/**
 * The non-standard BeforeInstallPromptEvent interface exposed by Chromium-based
 * browsers. It is not in the TypeScript DOM lib, so we extend Event manually.
 * Source: https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 */
interface BeforeInstallPromptEvent extends Event {
  /** Show the browser's native install dialog. Can only be called once per event. */
  prompt: () => Promise<void>;
  /** Resolves with the user's response after prompt() is called. */
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * usePWAInstall — React hook that manages the Chrome PWA install prompt lifecycle.
 *
 * Lifecycle:
 *   1. Chrome fires `beforeinstallprompt` when the page meets all PWA criteria.
 *   2. We call `event.preventDefault()` to suppress the automatic browser banner
 *      and stash the event.
 *   3. `isInstallable` becomes true → the install button renders in the UI.
 *   4. When the user clicks install, `installApp()` calls `deferredPrompt.prompt()`.
 *   5. After Chrome's native dialog resolves (accepted or dismissed), the stash
 *      is cleared. If accepted, `isInstalled` becomes true and the button unmounts.
 *   6. `appinstalled` event also sets `isInstalled` (covers omnibox-triggered install).
 *
 * Source: https://web.dev/articles/customize-install
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  /**
   * Initialise from the current display mode so that users who already installed
   * the app (standalone window) never see the install button flash on mount.
   */
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // Safari iOS exposes navigator.standalone (non-standard)
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome's automatic mini-infobar / install banner
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      // Fired by Chrome after the user completes installation (including via
      // the omnibox button, so we must handle this independently of installApp).
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Trigger Chrome's native installation dialog.
   * Must only be called from inside a direct user gesture (e.g. a click handler).
   * Returns `true` if the user accepted, `false` if they dismissed.
   * `.prompt()` can only be called once per event, so the stash is always cleared.
   */
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    // Show Chrome's native install confirmation dialog
    await deferredPrompt.prompt();

    // Wait for user's choice — resolves when the dialog is dismissed either way
    const { outcome } = await deferredPrompt.userChoice;

    // Discard: prompt() can only be called once
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    return outcome === 'accepted';
  }, [deferredPrompt]);

  return {
    /** True when Chrome has confirmed the app is installable and it is not yet installed. */
    isInstallable: !!deferredPrompt && !isInstalled,
    /** True when the app is running in standalone mode or was just installed. */
    isInstalled,
    /** Call this inside a click handler to show Chrome's native install dialog. */
    installApp,
  };
}
