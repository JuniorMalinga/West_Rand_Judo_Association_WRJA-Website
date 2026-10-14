import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTourRoute, normalizeTourPath, TOUR_ORDER } from "./tourConfig";

const STORAGE_KEY = "wrja.buddy.tour.v3";

const initialState = {
  open: false,
  mode: "idle",
  route: "/",
  sectionId: null,
  step: 0,
  visited: [],
  explained: [],
  skipped: [],
  authPendingRoute: null,
  completed: false,
  dismissed: false,
};

const unique = (items) => [...new Set(items)];
const sectionKey = (route, sectionId) => `${route}:${sectionId}`;

function readSavedState() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
      explained: Array.isArray(parsed.explained) ? parsed.explained : [],
      skipped: Array.isArray(parsed.skipped) ? parsed.skipped : [],
    };
  } catch {
    return initialState;
  }
}

export function useBuddyTour() {
  const { user, loginTransitionId } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const routeKey = normalizeTourPath(pathname);
  const routeConfig = getTourRoute(pathname);

  const [state, setState] = useState(() => (typeof window === "undefined" ? initialState : readSavedState()));
  const stateRef = useRef(state);
  const [message, setMessage] = useState("Need a hand with WRJA?");
  const [animation, setAnimation] = useState("idle");
  const [animationKey, setAnimationKey] = useState(0);
  const [target, setTarget] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const lastMessageAtRef = useRef(0);
  const lastScrollRef = useRef({ y: 0, time: 0 });
  const scrollStopTimerRef = useRef(null);
  const sectionTimerRef = useRef(null);
  const farewellTimersRef = useRef([]);
  const rapidReactionRouteRef = useRef(null);
  const lastLoginTransitionRef = useRef(loginTransitionId);

  const persist = useCallback((recipe) => {
    setState((previous) => {
      const next = typeof recipe === "function" ? recipe(previous) : recipe;
      stateRef.current = next;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage is helpful for auth redirects and refreshes, but never required for the tour to work.
      }
      return next;
    });
  }, []);

  const resolveTarget = useCallback((selector) => {
    if (!selector || typeof document === "undefined") return null;
    const element = document.querySelector(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + Math.min(rect.height / 2, 86) };
  }, []);

  const speak = useCallback((text, nextAnimation = "talk", mode = "explaining", priority = "normal") => {
    const now = Date.now();
    if (priority !== "high" && now - lastMessageAtRef.current < 1000) return false;
    lastMessageAtRef.current = now;
    setMessage(text);
    setAnimation(nextAnimation);
    setAnimationKey((value) => value + 1);
    persist((previous) => ({ ...previous, mode }));
    return true;
  }, [persist]);

  const markExplained = useCallback((route, sectionId) => {
    if (!sectionId) return;
    persist((previous) => {
      const key = sectionKey(route, sectionId);
      if (previous.explained.includes(key)) return previous;
      return {
        ...previous,
        visited: unique([...previous.visited, key]),
        explained: unique([...previous.explained, key]),
        skipped: previous.skipped.filter((skippedKey) => skippedKey !== key),
        mode: "waiting",
      };
    });
  }, [persist]);

  const markSkipped = useCallback((route, sectionIds) => {
    if (!sectionIds.length) return;
    persist((previous) => {
      const fresh = sectionIds
        .map((sectionId) => sectionKey(route, sectionId))
        .filter((key) => !previous.explained.includes(key));
      if (!fresh.length) return previous;
      return { ...previous, skipped: unique([...previous.skipped, ...fresh]) };
    });
  }, [persist]);

  const dismiss = useCallback((reason = "dismissed") => {
    window.clearTimeout(scrollStopTimerRef.current);
    window.clearTimeout(sectionTimerRef.current);
    farewellTimersRef.current.forEach(window.clearTimeout);
    farewellTimersRef.current = [];
    setTarget(null);
    persist((previous) => ({
      ...previous,
      open: false,
      dismissed: reason === "skip" || reason === "close",
      mode: "dismissed",
    }));
  }, [persist]);

  const pauseForAuthentication = useCallback((destination = routeKey) => {
    const normalizedDestination = normalizeTourPath(destination);
    const current = stateRef.current;
    if (!current.open || user) return;
    if (current.mode === "waiting-auth" && current.authPendingRoute === normalizedDestination) return;
    persist((previous) => ({
      ...previous,
      mode: "waiting-auth",
      authPendingRoute: normalizedDestination,
    }));
    speak(
      "Ooh, this is a members-only area. I’ll save our place while you sign in, then we can pick up here.",
      "curious",
      "waiting-auth",
      "high",
    );
  }, [persist, routeKey, speak, user]);

  const continueToLogin = useCallback(() => {
    const destination = stateRef.current.authPendingRoute || routeKey;
    navigate("/login", { state: { from: { pathname: destination }, buddyReturn: true } });
  }, [navigate, routeKey]);

  const keepExploring = useCallback(() => {
    persist((previous) => ({ ...previous, authPendingRoute: null, mode: "waiting" }));
    speak("No problem. The public pages are still yours to explore at your own pace.", "wave", "waiting", "high");
  }, [persist, speak]);

  const showRecap = useCallback(() => {
    const skippedHere = stateRef.current.skipped.filter((key) => key.startsWith(`${routeKey}:`));
    const count = skippedHere.length;
    speak(
      count > 1
        ? `Quick version: there are ${count} sections you flew past on this page. You can keep moving, or use Next and I’ll take them one at a time.`
        : "Quick version: there’s one useful section just above. Use Next whenever you want the guided version.",
      "thinking",
      "waiting",
      "high",
    );
  }, [routeKey, speak]);

  const finishTour = useCallback((leftMembersAreaForLater = false) => {
    const current = stateRef.current;
    if (current.completed || current.mode === "farewell") return;
    persist((previous) => ({ ...previous, completed: true, mode: "farewell", open: true }));
    speak(
      leftMembersAreaForLater
        ? "You’ve seen the main public areas. I’ll leave the members’ features for another time."
        : "Well, would you look at that — I think we’ve covered everything useful for now.",
      "happy",
      "farewell",
      "high",
    );
    farewellTimersRef.current.forEach(window.clearTimeout);
    farewellTimersRef.current = [
      window.setTimeout(() => {
        setMessage("Aw, I didn’t realise we were at the end already. Take care, and enjoy exploring WRJA.");
        setAnimation("sad");
        setAnimationKey((value) => value + 1);
      }, 3000),
      window.setTimeout(() => {
        persist((previous) => ({ ...previous, open: false, mode: "completed" }));
        setTarget(null);
      }, 10500),
    ];
  }, [persist, speak]);

  const start = useCallback(() => {
    const currentRoute = getTourRoute(pathname) ? normalizeTourPath(pathname) : "/";
    const currentConfig = getTourRoute(currentRoute);
    window.clearTimeout(scrollStopTimerRef.current);
    window.clearTimeout(sectionTimerRef.current);
    farewellTimersRef.current.forEach(window.clearTimeout);
    farewellTimersRef.current = [];
    rapidReactionRouteRef.current = null;
    lastScrollRef.current = { y: window.scrollY, time: performance.now() };
    persist({
      ...initialState,
      open: true,
      route: currentRoute,
      mode: "introducing",
    });
    setTarget(resolveTarget(currentConfig?.sections[0]?.selector));
    setMessage(currentConfig?.intro || "A quick tour, at your pace. I’ll explain useful things and stay out of your way.");
    setAnimation("wave");
    setAnimationKey((value) => value + 1);
    lastMessageAtRef.current = Date.now();
  }, [pathname, persist, resolveTarget]);

  const advance = useCallback(() => {
    const current = stateRef.current;
    const config = getTourRoute(pathname);
    const currentRoute = normalizeTourPath(pathname);
    if (!config || !current.open || current.mode === "farewell") return;
    if (current.mode === "waiting-auth") {
      continueToLogin();
      return;
    }

    const currentIndex = current.sectionId
      ? Math.max(
        0,
        config.sections.findIndex((section) => section.id === current.sectionId),
        current.step,
      )
      : -1;
    const currentSection = config.sections[currentIndex];
    if (currentSection) markExplained(currentRoute, currentSection.id);

    const nextSection = config.sections[currentIndex + 1];
    if (nextSection) {
      persist((previous) => ({
        ...previous,
        route: currentRoute,
        step: currentIndex + 1,
        sectionId: nextSection.id,
        mode: "explaining",
      }));
      const element = typeof document === "undefined" ? null : document.querySelector(nextSection.selector);
      setTarget(resolveTarget(nextSection.selector));
      if (element) element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      window.setTimeout(() => {
        if (!stateRef.current.open || normalizeTourPath(window.location.pathname) !== currentRoute) return;
        speak(nextSection.message, nextSection.animation, "explaining", "high");
        markExplained(currentRoute, nextSection.id);
      }, reducedMotion ? 0 : 260);
      return;
    }

    const currentOrderIndex = TOUR_ORDER.indexOf(currentRoute);
    const nextRoute = TOUR_ORDER[currentOrderIndex + 1];
    if (!nextRoute) {
      finishTour(current.skipped.length > 0 && !user);
      return;
    }
    if (getTourRoute(nextRoute)?.protected && !user) {
      pauseForAuthentication(nextRoute);
      return;
    }
    persist((previous) => ({ ...previous, route: currentRoute, step: 0, sectionId: null, mode: "resuming" }));
    navigate(nextRoute);
  }, [continueToLogin, finishTour, markExplained, navigate, pathname, pauseForAuthentication, persist, reducedMotion, resolveTarget, speak, user]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Session storage can be blocked by the browser; in-memory state remains valid.
    }
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (!state.open) return;
    if (routeConfig?.protected && !user) {
      pauseForAuthentication(routeKey);
      return;
    }
    if (!routeConfig) return;

    if (state.route !== routeKey) {
      persist((previous) => ({ ...previous, route: routeKey, step: 0, sectionId: null, mode: "resuming" }));
      setTarget(resolveTarget(routeConfig.sections[0]?.selector));
      speak(
        user && state.authPendingRoute
          ? "Oh, you’re back! This part wasn’t available before, so let’s see what it can do."
          : `We’re on ${routeConfig.label}. I’ll point out the useful parts as you explore.`,
        "curious",
        "resuming",
        "high",
      );
    } else if (state.mode === "resuming") {
      setTarget(resolveTarget(routeConfig.sections[state.step]?.selector || routeConfig.sections[0]?.selector));
    }
  }, [pauseForAuthentication, persist, resolveTarget, routeConfig, routeKey, speak, state.authPendingRoute, state.mode, state.open, state.route, state.step, user]);

  useEffect(() => {
    if (!state.open || !user || !state.authPendingRoute || pathname === "/login") return;
    const currentRoute = normalizeTourPath(pathname);
    if (currentRoute !== state.authPendingRoute && loginTransitionId === lastLoginTransitionRef.current) return;
    lastLoginTransitionRef.current = loginTransitionId;
    persist((previous) => ({
      ...previous,
      authPendingRoute: null,
      route: currentRoute,
      step: 0,
      sectionId: null,
      mode: "resuming",
    }));
    speak("Oh, you’re back! I saved our place. Let’s explore what just opened up.", "excited", "resuming", "high");
  }, [loginTransitionId, pathname, persist, routeKey, speak, state.authPendingRoute, state.open, user]);

  useEffect(() => {
    if (!state.open || !routeConfig || typeof document === "undefined") return undefined;

    let sectionObserver;
    let observedElements = [];
    const observeSections = () => {
      const bindings = routeConfig.sections
        .map((section, index) => ({ section, index, element: document.querySelector(section.selector) }))
        .filter((binding) => binding.element);
      if (!bindings.length) return () => {};
      if (bindings.length === observedElements.length && bindings.every((binding, index) => binding.element === observedElements[index])) return;
      sectionObserver?.disconnect();
      observedElements = bindings.map((binding) => binding.element);

      const reveal = (binding) => {
        const snapshot = stateRef.current;
        const key = sectionKey(routeKey, binding.section.id);
        setTarget(resolveTarget(binding.section.selector));
        persist((previous) => ({
          ...previous,
          route: routeKey,
          step: binding.index,
          sectionId: binding.section.id,
          visited: unique([...previous.visited, key]),
        }));
        if (snapshot.explained.includes(key) || snapshot.mode === "reacting" || snapshot.mode === "farewell" || snapshot.mode === "waiting-auth") return;
        window.clearTimeout(sectionTimerRef.current);
        sectionTimerRef.current = window.setTimeout(() => {
          const latest = stateRef.current;
          if (!latest.open || latest.explained.includes(key) || latest.mode === "waiting-auth") return;
          if (speak(binding.section.message, binding.section.animation, "explaining")) {
            markExplained(routeKey, binding.section.id);
          }
        }, reducedMotion ? 0 : 1150);
      };

      if (!window.IntersectionObserver) {
        reveal(bindings[0]);
        return () => {};
      }

      sectionObserver = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const binding = bindings.find((item) => item.element === visible.target);
        if (binding) reveal(binding);
      }, { threshold: [0.28, 0.55], rootMargin: "-12% 0px -28% 0px" });

      bindings.forEach(({ element }) => sectionObserver.observe(element));
    };

    observeSections();
    const mutationObserver = new MutationObserver(observeSections);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutationObserver.disconnect();
      sectionObserver?.disconnect();
      window.clearTimeout(sectionTimerRef.current);
    };
  }, [markExplained, persist, reducedMotion, resolveTarget, routeConfig, routeKey, speak, state.open]);

  const handleScroll = useCallback(() => {
    const now = performance.now();
    const y = window.scrollY;
    const previous = lastScrollRef.current;
    const delta = y - previous.y;
    const elapsed = Math.max(now - previous.time, 16);
    const speed = (Math.abs(delta) / elapsed) * 1000;
    lastScrollRef.current = { y, time: now };
    const snapshot = stateRef.current;
    if (!snapshot.open || !routeConfig || snapshot.mode === "farewell" || snapshot.mode === "waiting-auth") return;

    const fast = speed > 1200 || Math.abs(delta) > 280;
    if (fast) {
      const skippedIds = routeConfig.sections
        .filter((section) => {
          const element = document.querySelector(section.selector);
          const key = sectionKey(routeKey, section.id);
          return element && element.getBoundingClientRect().top < -36 && !snapshot.explained.includes(key);
        })
        .map((section) => section.id);
      markSkipped(routeKey, skippedIds);
      if (rapidReactionRouteRef.current !== routeKey) {
        rapidReactionRouteRef.current = routeKey;
        speak(
          speed > 1800
            ? "Hey, too fast! You just flew past a few sections. I’ll slow down and catch us up."
            : "Hey, that was quick! I’ll catch us up on the useful sections one at a time.",
          "surprised",
          "reacting",
          "high",
        );
      }
    }

    window.clearTimeout(scrollStopTimerRef.current);
    scrollStopTimerRef.current = window.setTimeout(() => {
      const latest = stateRef.current;
      if (!latest.open || latest.mode === "farewell" || latest.mode === "waiting-auth") return;
      const pendingKeys = latest.skipped.filter((key) => key.startsWith(`${routeKey}:`) && !latest.explained.includes(key));
      const catchUp = routeConfig.sections.find((section) => pendingKeys.includes(sectionKey(routeKey, section.id)));
      const visibleSections = routeConfig.sections
        .map((section, index) => ({ section, index, element: document.querySelector(section.selector) }))
        .filter(({ element }) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.bottom > window.innerHeight * 0.18 && rect.top < window.innerHeight * 0.82;
        })
        .sort((a, b) => {
          const center = window.innerHeight / 2;
          const aRect = a.element.getBoundingClientRect();
          const bRect = b.element.getBoundingClientRect();
          return Math.abs(aRect.top + aRect.height / 2 - center) - Math.abs(bRect.top + bRect.height / 2 - center);
        });
      const active = catchUp || visibleSections[0]?.section;
      if (!active) {
        rapidReactionRouteRef.current = null;
        return;
      }
      const index = routeConfig.sections.indexOf(active);
      const element = document.querySelector(active.selector);
      persist((previous) => ({
        ...previous,
        route: routeKey,
        step: index,
        sectionId: active.id,
        visited: unique([...previous.visited, sectionKey(routeKey, active.id)]),
        mode: "explaining",
      }));
      setTarget(resolveTarget(active.selector));
      if (catchUp && element) element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      if (!latest.explained.includes(sectionKey(routeKey, active.id))) {
        const message = catchUp ? `Hey, that was quick. Let’s catch up here: ${active.message}` : active.message;
        if (speak(message, catchUp ? "surprised" : active.animation, "explaining", "high")) {
          markExplained(routeKey, active.id);
        }
      }
      rapidReactionRouteRef.current = null;
    }, 950);
  }, [markExplained, markSkipped, persist, reducedMotion, resolveTarget, routeConfig, routeKey, speak]);

  useEffect(() => {
    if (!state.open) return undefined;
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.clearTimeout(scrollStopTimerRef.current);
    };
  }, [handleScroll, state.open]);

  const activeSection = routeConfig?.sections.find((section) => section.id === state.sectionId)
    || routeConfig?.sections[state.step]
    || null;

  const actionButtons = useMemo(() => {
    if (!state.open || state.mode === "farewell") return [];
    if (state.mode === "waiting-auth") {
      return [
        { label: "Go to sign in", variant: "primary", onClick: continueToLogin },
        { label: "Keep exploring", variant: "secondary", onClick: keepExploring },
      ];
    }
    const buttons = [];
    if (state.mode === "reacting" && state.skipped.some((key) => key.startsWith(`${routeKey}:`))) {
      buttons.push({ label: "Give me the highlights", variant: "secondary", onClick: showRecap });
    }
    buttons.push({ label: activeSection ? "Next" : "Continue", variant: "primary", onClick: advance });
    return buttons;
  }, [activeSection, advance, continueToLogin, keepExploring, routeKey, showRecap, state.mode, state.open, state.skipped]);

  useEffect(() => () => {
    window.clearTimeout(scrollStopTimerRef.current);
    window.clearTimeout(sectionTimerRef.current);
    farewellTimersRef.current.forEach(window.clearTimeout);
  }, []);

  return {
    buddyOpen: state.open,
    buddyAnimation: reducedMotion ? "idle" : animation,
    buddyAnimationKey: animationKey,
    buddyMessage: message,
    tourTarget: target,
    actionButtons,
    start,
    handleBuddyAdvance: advance,
    closeBuddy: () => dismiss("close"),
    skipBuddy: () => dismiss("skip"),
    pauseForAuthentication,
    state,
  };
}
