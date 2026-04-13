// beforeinstallprompt capture pattern follows the Chromium PWA spec and community-documented approaches.
// See: https://web.dev/customize-install/
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let _deferredPrompt: BeforeInstallPromptEvent | null = null;
let _isInstalled = false;
let _listenersRegistered = false;
const _subscribers: Array<() => void> = [];

function notifySubscribers() {
  _subscribers.forEach(fn => fn());
}

function ensureListenersRegistered() {
  if (_listenersRegistered) return;
  _listenersRegistered = true;

  if (typeof window === "undefined") return;

  if (window.matchMedia("(display-mode: standalone)").matches) {
    _isInstalled = true;
    return;
  }

  window.addEventListener("beforeinstallprompt", (e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    _deferredPrompt = e;
    notifySubscribers();
  });

  window.addEventListener("appinstalled", () => {
    _isInstalled = true;
    _deferredPrompt = null;
    notifySubscribers();
  });
}

export function usePWAInstall() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    ensureListenersRegistered();

    const update = () => forceUpdate(n => n + 1);
    _subscribers.push(update);

    return () => {
      const idx = _subscribers.indexOf(update);
      if (idx !== -1) _subscribers.splice(idx, 1);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!_deferredPrompt) return false;
    try {
      await _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      if (outcome === "accepted") {
        _isInstalled = true;
      }
      _deferredPrompt = null;
      notifySubscribers();
      return outcome === "accepted";
    } catch (err) {
      console.error("PWA install error:", err);
      return false;
    }
  };

  return {
    isInstallable: !_isInstalled && _deferredPrompt !== null,
    isInstalled: _isInstalled,
    promptInstall,
  };
}
