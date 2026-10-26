import { useEffect, useRef, useState } from "react";

const revealSubscriptions = new Map();
let revealObserver = null;

// Reuse one observer for all reveal wrappers rather than listening to every scroll event.
function shouldRevealImmediately() {
  if (typeof window === "undefined") return true;
  return !("IntersectionObserver" in window)
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function observeReveal(node, onReveal) {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const reveal = revealSubscriptions.get(entry.target);
        revealSubscriptions.delete(entry.target);
        revealObserver?.unobserve(entry.target);
        reveal?.();
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -8% 0px" });
  }

  const observer = revealObserver;
  revealSubscriptions.set(node, onReveal);
  observer.observe(node);

  return () => {
    revealSubscriptions.delete(node);
    observer.unobserve(node);
    if (revealSubscriptions.size === 0 && revealObserver === observer) {
      observer.disconnect();
      revealObserver = null;
    }
  };
}

export default function useScrollReveal() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(shouldRevealImmediately);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!("IntersectionObserver" in window) || motionPreference.matches) {
      setIsVisible(true);
      return undefined;
    }

    const stopObserving = observeReveal(node, () => setIsVisible(true));

    const handleMotionPreference = (event) => {
      if (!event.matches) return;
      setIsVisible(true);
      stopObserving();
    };

    motionPreference.addEventListener?.("change", handleMotionPreference);
    return () => {
      stopObserving();
      motionPreference.removeEventListener?.("change", handleMotionPreference);
    };
  }, []);

  return [ref, isVisible];
}
