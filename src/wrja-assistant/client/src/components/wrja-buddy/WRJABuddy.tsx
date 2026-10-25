import { useEffect, useMemo, useState } from "react";
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
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [position, setPosition] = useState({
    x: 20,
    y: typeof window !== "undefined" ? window.innerHeight - size - 24 : 20,
  });
  const [bubbleVisible, setBubbleVisible] = useState(Boolean(message));

  const currentAnimation =
    animation && animation in SPRITE_MANIFEST ? (animation as SpriteAnimationKey) : "idle";
  const spriteSource = resolveSpriteSource(currentAnimation, sprites);
  const frameCount = SPRITE_MANIFEST[currentAnimation]?.frameCount ?? 6;
  const frameRate = SPRITE_MANIFEST[currentAnimation]?.fps ?? 5;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;
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
    if (typeof document === "undefined") return;
    const image = new Image();
    const fallbackTimer = window.setTimeout(() => {
      if (!image.complete) {
        setError(true);
        setLoaded(false);
      }
    }, 250);
    image.onload = () => {
      window.clearTimeout(fallbackTimer);
      setError(false);
      setLoaded(true);
    };
    image.onerror = () => {
      window.clearTimeout(fallbackTimer);
      setError(true);
      setLoaded(false);
    };
    image.src = spriteSource;
    return () => {
      window.clearTimeout(fallbackTimer);
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

  useEffect(() => {
    if (!tourTarget || typeof window === "undefined") return;
    let nextX = clamp(tourTarget.x - size / 2, 16, Math.max(16, window.innerWidth - size - 16));
    let nextY = clamp(tourTarget.y - size / 2, 16, Math.max(16, window.innerHeight - size - 16));

    const navigation = document.querySelector(".navigation-bar");
    const openMenu = document.querySelector(".nav-menu-open");
    const blockers = [navigation, openMenu].filter((blocker): blocker is Element => blocker !== null);

    for (const blocker of blockers) {
      const rect = blocker.getBoundingClientRect();
      const overlapsX = nextX < rect.right && nextX + size > rect.left;
      const overlapsY = nextY < rect.bottom && nextY + size > rect.top;
      if (!overlapsX || !overlapsY) continue;

      const below = rect.bottom + 12;
      const above = rect.top - size - 12;
      nextY = below + size <= window.innerHeight - 16
        ? below
        : Math.max(16, above);
    }

    setPosition({ x: nextX, y: nextY });
  }, [size, tourTarget]);

  useEffect(() => {
    if (roaming || tourTarget || typeof window === "undefined") return;
    const reposition = () => {
      const baseX = window.innerWidth - size - 22;
      const baseY = window.innerHeight - size - 24;
      setPosition({
        x: clamp(baseX, 16, Math.max(16, window.innerWidth - size - 16)),
        y: clamp(baseY, 16, Math.max(16, window.innerHeight - size - 16)),
      });
    };
    reposition();
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [roaming, size, tourTarget]);

  const bubblePlacement = useMemo(() => {
    if (typeof window === "undefined") return "top";
    if (position.x < window.innerWidth * 0.55) return "right";
    if (position.y < window.innerHeight * 0.5) return "bottom";
    return "left";
  }, [position.x, position.y]);

  const spriteStyle = {
    width: size,
    height: size,
    backgroundImage: `url("${spriteSource}")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${frameCount * 100}% 100%`,
    backgroundPosition: `${(frameIndex / Math.max(frameCount - 1, 1)) * 100}% 0%`,
    imageRendering: "auto" as const,
  };

  const displayFallback = !loaded && !error;

  return (
    <div
      className="wrja-buddy-layer"
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        transition: reducedMotion ? "none" : "left 900ms ease, top 900ms ease",
      }}
      aria-live="polite"
    >
      <button
        type="button"
        className="wrja-buddy-button"
        onClick={onBuddyClick}
        aria-label="Talk with WRJA Buddy"
        title="WRJA Buddy"
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
  );
}
