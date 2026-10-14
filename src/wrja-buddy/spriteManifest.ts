const SPRITE_PATHS = {
  idle: "/assets/wrja-buddy/idle.png",
  happy: "/assets/wrja-buddy/happy.png",
  excited: "/assets/wrja-buddy/excited.png",
  surprised: "/assets/wrja-buddy/surprised.png",
  thinking: "/assets/wrja-buddy/thinking.png",
  wink: "/assets/wrja-buddy/wink.png",
  sad: "/assets/wrja-buddy/sad.png",
  angry: "/assets/wrja-buddy/angry.png",
  idleBreathing: "/assets/wrja-buddy/idle.png",
  lookLeft: "/assets/wrja-buddy/idle_look_left.png",
  lookRight: "/assets/wrja-buddy/idle_look_right.png",
  blink: "/assets/wrja-buddy/idle_blink.png",
  weightShift: "/assets/wrja-buddy/idle_shift.png",
  walk: "/assets/wrja-buddy/walk.png",
  run: "/assets/wrja-buddy/run.png",
  crouch: "/assets/wrja-buddy/crouch.png",
  jumpUp: "/assets/wrja-buddy/jump_up.png",
  airborne: "/assets/wrja-buddy/airborne.png",
  land: "/assets/wrja-buddy/landing.png",
  legacyJump: "/assets/wrja-buddy/jump.png",
  wave: "/assets/wrja-buddy/wave.png",
  point: "/assets/wrja-buddy/point.png",
  pointLeft: "/assets/wrja-buddy/point_left.png",
  pointRight: "/assets/wrja-buddy/point_right.png",
  bow: "/assets/wrja-buddy/bow.png",
  readyStance: "/assets/wrja-buddy/ready.png",
  victory: "/assets/wrja-buddy/victory.png",
  celebrationJump: "/assets/wrja-buddy/celebration_jump.png",
  sleep: "/assets/wrja-buddy/sleep.png",
  confused: "/assets/wrja-buddy/confused.png",
  launcherShake: "/assets/wrja-buddy/launcher_shake.png",
  jumpOut: "/assets/wrja-buddy/jump_out.png",
  hurt: "/assets/wrja-buddy/hurt.png",
  proud: "/assets/wrja-buddy/proud.png",
  disappear: "/assets/wrja-buddy/disappear.png",
  reappear: "/assets/wrja-buddy/reappear.png",
  turnAround: "/assets/wrja-buddy/turn_around.png",
  continueWalking: "/assets/wrja-buddy/continue_walking.png",
  walkToElement: "/assets/wrja-buddy/walk.png",
  pointAtElement: "/assets/wrja-buddy/point.png",
  talk: "/assets/wrja-buddy/talk.png",
  celebrate: "/assets/wrja-buddy/celebration_jump.png",
} as const;

export const SPRITE_MANIFEST = Object.fromEntries(
  Object.entries(SPRITE_PATHS).map(([key, src]) => [key, { src, frameCount: 6, fps: 6 }]),
) as Record<string, { src: string; frameCount: number; fps: number }>;

export type SpriteAnimationKey = keyof typeof SPRITE_MANIFEST;

export function resolveSpriteSource(
  animationName: SpriteAnimationKey | string | undefined,
  overrideSprites?: Partial<Record<SpriteAnimationKey, string>>,
) {
  const key = animationName && animationName in SPRITE_MANIFEST ? animationName : "idle";
  return overrideSprites?.[key as SpriteAnimationKey] ?? SPRITE_MANIFEST[key as SpriteAnimationKey].src;
}

export const DEFAULT_SPRITES: Record<SpriteAnimationKey, string> = Object.fromEntries(
  Object.entries(SPRITE_MANIFEST).map(([key, value]) => [key, value.src]),
) as Record<SpriteAnimationKey, string>;
