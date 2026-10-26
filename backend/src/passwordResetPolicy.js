export const PASSWORD_RESET_OTP_TTL_SECONDS = 10 * 60;
export const PASSWORD_RESET_OTP_TTL_MS = PASSWORD_RESET_OTP_TTL_SECONDS * 1000;
export const PASSWORD_RESET_RESEND_WINDOW_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_RESEND_COOLDOWNS_MS = [
  30 * 1000,
  2 * 60 * 1000,
  5 * 60 * 1000,
  30 * 60 * 1000,
];

export function passwordResetResendDelayMs(sendCount) {
  const index = Math.max(0, Math.min(sendCount - 1, PASSWORD_RESET_RESEND_COOLDOWNS_MS.length - 1));
  return PASSWORD_RESET_RESEND_COOLDOWNS_MS[index];
}
