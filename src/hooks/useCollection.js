import { useEffect, useSyncExternalStore } from "react";

// { items, loaded, loading, error } – loads the store the first time it's needed.
export function useCollectionState(store) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    if (!snapshot.loaded && !snapshot.loading) store.load();
  }, [store, snapshot.loaded, snapshot.loading]);

  return snapshot;
}

// Just the items – for components that don't care about loading state.
export default function useCollection(store) {
  return useCollectionState(store).items;
}
