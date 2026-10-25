// Server-backed lists ("collections") shared by every component that needs them.
// A store loads once, all components using it re-render together, and it
// reloads itself when someone logs in or out (visitors and members can see
// different fields).

import { api, notifyAdminChanged } from "./api";

export function createRemoteCollection(path) {
  const listeners = new Set();
  let snapshot = { items: [], loaded: false, loading: false, error: null };
  let inflight = null;
  let sequence = 0;

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
      return () => listeners.delete(listener);
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
    notifyAdminChanged();
    return result;
  };
  return {
    create: async (data) => finish((await api(path, { method: "POST", body: data })).item),
    update: async (id, data) => finish((await api(`${path}/${id}`, { method: "PUT", body: data })).item),
    remove: async (id) => finish(await api(`${path}/${id}`, { method: "DELETE" })),
  };
}
