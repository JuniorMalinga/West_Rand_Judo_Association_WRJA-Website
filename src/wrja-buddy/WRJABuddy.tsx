import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import "./styles.css";
import {
  DEFAULT_SPRITES,
  resolveSpriteSource,
  SPRITE_MANIFEST,
  type SpriteAnimationKey,
} from "./spriteManifest";

type BuddyTarget = {
  x: number;
  y: number;
};

type BuddyActionButton = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

type BuddyProps = {
  animation?: SpriteAnimationKey | string;
  animationKey?: string | number;
  sprites?: Partial<Record<SpriteAnimationKey, string>>;
  size?: number;
  message?: string;
  roaming?: boolean;
  tourTarget?: BuddyTarget | null;
  onBuddyClick?: () => void;
  actionButtons?: BuddyActionButton[];
  onDismiss?: () => void;
  onSkip?: () => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function WRJABuddy({
  animation = "idle",
  animationKey,
  sprites = DEFAULT_SPRITES,
  size = 128,
  message,
  roaming = false,
  tourTarget,
  onBuddyClick,
  actionButtons = [],
  onDismiss,
  onSkip,
}: BuddyProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [readySpriteSource, setReadySpriteSource] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [scrollReaction, setScrollReaction] = useState<SpriteAnimationKey | null>(null);
  const scrollTimerRef = useRef<number | undefined>(undefined);
  const scrollFrameRef = useRef<number | undefined>(undefined);
  const pendingScrollRef = useRef<{ deltaY: number } | null>(null);
  const lastScrollYRef = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const trackedTargetRef = useRef<BuddyTarget | null>(tourTarget ?? null);
  const manualPositionRef = useRef(false);
  const clickTimerRef = useRef<number | undefined>(undefined);
  const suppressClickRef = useRef(false);
  const pointerDragRef = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    positionX: number;
    positionY: number;
    moved: boolean;
  } | null>(null);
  const [position, setPosition] = useState({
    x: 20,
    y: typeof window !== "undefined" ? window.innerHeight - size - 24 : 20,
  });
  const [bubbleVisible, setBubbleVisible] = useState(Boolean(message));
  const [isDragging, setIsDragging] = useState(false);

  const currentAnimation =
    scrollReaction ?? (animation && animation in SPRITE_MANIFEST ? (animation as SpriteAnimationKey) : "idle");
  const spriteSource = resolveSpriteSource(currentAnimation, sprites);
  const frameCount = SPRITE_MANIFEST[currentAnimation]?.frameCount ?? 6;
  const frameRate = SPRITE_MANIFEST[currentAnimation]?.fps ?? 5;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    syncMotion();
    media.addEventListener?.("change", syncMotion);
    return () => media.removeEventListener?.("change", syncMotion);
  }, []);

  useEffect(() => {
    setFrameIndex(0);
  }, [animationKey, currentAnimation]);

  useEffect(() => {
    trackedTargetRef.current = tourTarget ? { ...tourTarget } : null;
  }, [tourTarget]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      image.decode?.().catch(() => undefined).finally(() => {
        if (cancelled) return;
        setError(false);
        setReadySpriteSource(spriteSource);
      });
    };
    image.onerror = () => {
      if (cancelled) return;
      setError(true);
      setReadySpriteSource(null);
    };
    image.src = spriteSource;
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [spriteSource]);

  useEffect(() => {
    if (reducedMotion) {
      setFrameIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setFrameIndex((previous) => (previous + 1) % frameCount);
    }, 1000 / frameRate);

    return () => window.clearInterval(timer);
  }, [frameCount, frameRate, reducedMotion]);

  useEffect(() => {
    if (!message) {
      setBubbleVisible(false);
      return;
    }
    setBubbleVisible(true);
  }, [message]);

  const hasSkip = Boolean(onSkip);
  const updatePosition = useCallback(() => {
    if (typeof window === "undefined") return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxX = Math.max(16, viewportWidth - size - 16);
    const reservedControls = hasSkip ? 62 : 16;
    const maxY = Math.max(16, viewportHeight - size - reservedControls);
    if (manualPositionRef.current) {
      setPosition((previous) => ({
        x: clamp(previous.x, 16, maxX),
        y: clamp(previous.y, 16, maxY),
      }));
      return;
    }
    const trackedTarget = trackedTargetRef.current;
    // Treat the target as a small ledge: Buddy sits just above it rather than
    // covering the heading, card, or navigation control he is describing.
    let nextX = trackedTarget ? trackedTarget.x - size / 2 : viewportWidth - size - 22;
    let nextY = trackedTarget ? trackedTarget.y - size - 14 : viewportHeight - size - 24;
    if (trackedTarget && nextY < 16) nextY = trackedTarget.y + 14;

    nextX = clamp(nextX, 16, maxX);
    nextY = clamp(nextY, 16, maxY);

    // Avoid the fixed navigation and mobile menu. Re-run this calculation on
    // scroll/resize so a moving target can never push Buddy off-screen.
    const blockers = [
      document.querySelector(".navigation-bar"),
      document.querySelector(".nav-menu-open"),
    ].filter(Boolean);
    for (const blocker of blockers) {
      const rect = blocker.getBoundingClientRect();
      const overlapsX = nextX < rect.right && nextX + size > rect.left;
      const overlapsY = nextY < rect.bottom && nextY + size > rect.top;
      if (!overlapsX || !overlapsY) continue;
      const below = rect.bottom + 12;
      const above = rect.top - size - 12;
      nextY = below <= maxY ? below : above;
      nextY = clamp(nextY, 16, maxY);
    }
    setPosition({ x: clamp(nextX, 16, maxX), y: clamp(nextY, 16, maxY) });
  }, [hasSkip, size]);

  const handleBuddyPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerDragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      positionX: position.x,
      positionY: position.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [position.x, position.y]);

  const handleBuddyPointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.originX;
    const deltaY = event.clientY - drag.originY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    if (!drag.moved) setIsDragging(true);
    drag.moved = true;
    manualPositionRef.current = true;
    setPosition({
      x: clamp(drag.positionX + deltaX, 16, Math.max(16, window.innerWidth - size - 16)),
      y: clamp(drag.positionY + deltaY, 16, Math.max(16, window.innerHeight - size - 62)),
    });
  }, [size]);

  const handleBuddyPointerUp = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    pointerDragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleBuddyPointerCancel = useCallback(() => {
    pointerDragRef.current = null;
    setIsDragging(false);
  }, []);

  const handleBuddyClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (clickTimerRef.current !== undefined) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = undefined;
      manualPositionRef.current = true;
      setPosition((previous) => ({
        ...previous,
        x: previous.x + size / 2 < window.innerWidth / 2
          ? Math.max(16, window.innerWidth - size - 16)
          : 16,
      }));
      return;
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = undefined;
      onBuddyClick?.();
    }, 280);
  }, [onBuddyClick, size]);

  useEffect(() => {
    updatePosition();
    if (typeof window === "undefined") return undefined;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const deltaY = currentY - lastScrollYRef.current;
      lastScrollYRef.current = currentY;
      pendingScrollRef.current = { deltaY };
      if (scrollFrameRef.current == null) {
        scrollFrameRef.current = window.requestAnimationFrame(() => {
          scrollFrameRef.current = undefined;
          const pending = pendingScrollRef.current;
          if (!pending) return;
          const direction = pending.deltaY >= 0 ? "down" : "up";
          const speed = Math.abs(pending.deltaY);
          if (trackedTargetRef.current) {
            trackedTargetRef.current = {
              ...trackedTargetRef.current,
              y: trackedTargetRef.current.y - pending.deltaY,
            };
          }
          const reaction: SpriteAnimationKey = speed > 22
            ? (direction === "down" ? "run" : "jumpUp")
            : (direction === "down" ? "walk" : "turnAround");
          setScrollReaction(reaction);
          updatePosition();
        });
      }
      window.clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = window.setTimeout(() => {
        setScrollReaction(null);
        updatePosition();
      }, 520);
    };
    window.addEventListener("resize", updatePosition, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(scrollTimerRef.current);
      window.clearTimeout(clickTimerRef.current);
      if (scrollFrameRef.current != null) window.cancelAnimationFrame(scrollFrameRef.current);
    };
  }, [updatePosition, roaming]);

  const bubblePlacement = useMemo(() => {
    if (typeof window === "undefined") return "top";
    if (position.x < window.innerWidth * 0.55) return "right";
    if (position.y < window.innerHeight * 0.5) return "bottom";
    return "left";
  }, [position.x, position.y]);

  const spriteReady = readySpriteSource === spriteSource;
  const spriteStyle = {
    width: size,
    height: size,
    backgroundImage: `url("${spriteSource}")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${frameCount * 100}% 100%`,
    backgroundPosition: `${(frameIndex / Math.max(frameCount - 1, 1)) * 100}% 0%`,
    imageRendering: "auto" as const,
    opacity: spriteReady ? 1 : 0,
  };

  const displayFallback = !spriteReady && !error;

  return (
    <div
      className="wrja-buddy-layer"
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        transition: reducedMotion || isDragging ? "none" : "left 900ms ease, top 900ms ease",
      }}
      aria-live="polite"
    >
      <button
        type="button"
        className="wrja-buddy-button"
        onPointerDown={handleBuddyPointerDown}
        onPointerMove={handleBuddyPointerMove}
        onPointerUp={handleBuddyPointerUp}
        onPointerCancel={handleBuddyPointerCancel}
        onClick={handleBuddyClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onBuddyClick?.();
          }
        }}
        aria-label="Talk with WRJA Buddy; drag to move or double-tap to switch sides"
        title="Drag to move; double-tap to switch sides"
      >
        {displayFallback ? (
          <span className="wrja-buddy-sprite wrja-buddy-sprite--loading" style={spriteStyle} aria-hidden="true" />
        ) : error ? (
          <svg
            className="wrja-buddy-fallback"
            viewBox="0 0 96 96"
            role="img"
            aria-label="WRJA Buddy fallback illustration"
          >
            <circle cx="48" cy="32" r="18" fill="#c9a227" />
            <path d="M32 40 L48 68 L64 40 Z" fill="#c9a227" />
            <circle cx="41" cy="29" r="2" fill="#111111" />
            <circle cx="55" cy="29" r="2" fill="#111111" />
            <path d="M41 37 Q48 42 55 37" stroke="#111111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        ) : (
          <span className="wrja-buddy-sprite" style={spriteStyle} aria-hidden="true" />
        )}
      </button>

      {bubbleVisible && message && (
        <div className={`wrja-buddy-bubble wrja-buddy-bubble--${bubblePlacement}`} role="status" aria-live="polite">
          <button
            type="button"
            className="wrja-buddy-bubble-close"
            onClick={() => {
              setBubbleVisible(false);
              onDismiss?.();
            }}
            aria-label="Dismiss WRJA Buddy message"
          >
            ×
          </button>
          <p>{message}</p>

          {actionButtons.length > 0 && (
            <div className="wrja-buddy-actions">
              {actionButtons.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`wrja-buddy-action wrja-buddy-action--${action.variant ?? "secondary"}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    action.onClick();
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {onSkip && (
            <button
              type="button"
              className="wrja-buddy-skip"
              onClick={onSkip}
              aria-label="Skip Buddy"
            >
              Skip
            </button>
          )}
        </div>
      )}
    </div>
  );
}
