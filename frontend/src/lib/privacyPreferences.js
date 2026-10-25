import { useSyncExternalStore } from "react";

const STORAGE_KEY = "wrja-privacy-preferences-v1";
const CHANGE_EVENT = "wrja:privacy-preferences-change";
const OPEN_EVENT = "wrja:open-privacy-settings";
const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(callback) {
  const onStorage = (event) => {
    if (!event.key || event.key === STORAGE_KEY) callback();
  };

  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePrivacyPreferences() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (!raw) return { saved: false, analytics: false, externalContent: false };

  try {
    const preferences = JSON.parse(raw);
    const consentedAt = Date.parse(preferences.consentedAt);
    if (
      preferences.version !== 1 ||
      !Number.isFinite(consentedAt) ||
      Date.now() - consentedAt > CONSENT_MAX_AGE
    ) {
      return { saved: false, analytics: false, externalContent: false };
    }

    return {
      saved: true,
      analytics: preferences.analytics === true,
      externalContent: preferences.externalContent === true,
    };
  } catch {
    return { saved: false, analytics: false, externalContent: false };
  }
}

export function savePrivacyPreferences({ analytics, externalContent }) {
  const preferences = {
    version: 1,
    analytics: Boolean(analytics),
    externalContent: Boolean(externalContent),
    consentedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function openPrivacySettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function subscribeToPrivacySettings(callback) {
  window.addEventListener(OPEN_EVENT, callback);
  return () => window.removeEventListener(OPEN_EVENT, callback);
}
