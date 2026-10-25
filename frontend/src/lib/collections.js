// Server-backed lists shared by every component that needs them. A store
// refreshes while it is being observed so database changes appear without a
// page reload, and reloads on auth changes so visitors and members see the
// right fields.

import { api, notifyAdminChanged } from "./api";

const COLLECTION_REFRESH_INTERVAL = 5000;

export function createRemoteCollection(path) {
  const listeners = new Set();
  let snapshot = { items: [], loaded: false, loading: false, error: null };
  let inflight = null;
  let sequence = 0;
  let refreshTimer = null;
  let stopWatching = null;

  const emit = (patch) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };

  const run = () => {
    const mine = (sequence += 1);
    emit({ loading: true });
    const request = api(path)
      .then((data) => {
        if (mine === sequence) emit({ items: data.items, loaded: true, loading: false, error: null });
        return data.items;
      })
      .catch((error) => {
        if (mine === sequence) emit({ items: [], loaded: true, loading: false, error: error.message });
        return [];
      })
      .finally(() => {
        if (inflight === request) inflight = null;
      });
    inflight = request;
    return request;
  };

  const store = {
    path,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && typeof window !== "undefined") {
        const refreshIfVisible = () => {
          if (document.visibilityState === "visible" && !inflight) store.refresh();
        };
        const onAdminChanged = (event) => {
          if (event.detail?.path === path && !event.detail?.crossTab) return;
          if (!inflight) store.refresh();
        };
        window.addEventListener("wrja:admin-changed", onAdminChanged);
        window.addEventListener("focus", refreshIfVisible);
        document.addEventListener("visibilitychange", refreshIfVisible);
        refreshTimer = window.setInterval(refreshIfVisible, COLLECTION_REFRESH_INTERVAL);
        if (snapshot.loaded) refreshIfVisible();
        stopWatching = () => {
          window.removeEventListener("wrja:admin-changed", onAdminChanged);
          window.removeEventListener("focus", refreshIfVisible);
          document.removeEventListener("visibilitychange", refreshIfVisible);
          window.clearInterval(refreshTimer);
          refreshTimer = null;
        };
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size && stopWatching) {
          stopWatching();
          stopWatching = null;
        }
      };
    },
    getSnapshot: () => snapshot,
    load({ force = false } = {}) {
      if (force) return run();
      if (inflight) return inflight;
      if (snapshot.loaded) return Promise.resolve(snapshot.items);
      return run();
    },
    refresh: () => store.load({ force: true }),
    invalidate() {
      sequence += 1;
      inflight = null;
      emit({ items: [], loaded: false, loading: false, error: null });
    },
    // Used by tests to pre-fill a store without a server.
    setItems: (items) => emit({ items, loaded: true, loading: false, error: null }),
  };

  if (typeof window !== "undefined") {
    window.addEventListener("wrja:auth-changed", () => store.invalidate());
  }

  return store;
}

// Create / update / delete against an admin endpoint, then refresh the store.
export function adminCrud(path, store) {
  const finish = async (result) => {
    await store.refresh();
    notifyAdminChanged(store.path);
    return result;
  };
  return {
    create: async (data) => finish((await api(path, { method: "POST", body: data })).item),
    update: async (id, data) => finish((await api(`${path}/${id}`, { method: "PUT", body: data })).item),
    remove: async (id) => finish(await api(`${path}/${id}`, { method: "DELETE" })),
  };
}
