import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const SIGN_OUT_GRACE_SECONDS = 60;
const SIGN_OUT_GRACE_MS = SIGN_OUT_GRACE_SECONDS * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart", "wheel"];

export default function SessionIdlePrompt() {
  const { profile, signOut } = useAuth();
  const dialogRef = useRef(null);
  const lastActivityAt = useRef(Date.now());
  const signOutDeadline = useRef(0);
  const [open, setOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(SIGN_OUT_GRACE_SECONDS);

  useEffect(() => {
    if (!profile) {
      signOutDeadline.current = 0;
      setOpen(false);
      return undefined;
    }

    lastActivityAt.current = Date.now();
    const recordActivity = () => {
      if (!signOutDeadline.current) lastActivityAt.current = Date.now();
    };
    const checkIdle = () => {
      const now = Date.now();
      if (signOutDeadline.current) {
        const remaining = Math.max(0, Math.ceil((signOutDeadline.current - now) / 1000));
        setSecondsRemaining(remaining);
        if (remaining === 0) {
          signOutDeadline.current = 0;
          setOpen(false);
          signOut().catch(() => {});
        }
        return;
      }
      if (now - lastActivityAt.current >= IDLE_TIMEOUT_MS) {
        signOutDeadline.current = now + SIGN_OUT_GRACE_MS;
        setSecondsRemaining(SIGN_OUT_GRACE_SECONDS);
        setOpen(true);
      }
    };

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    const interval = window.setInterval(checkIdle, 1000);
    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.clearInterval(interval);
    };
  }, [profile?.id, signOut]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const staySignedIn = () => {
    signOutDeadline.current = 0;
    lastActivityAt.current = Date.now();
    setSecondsRemaining(SIGN_OUT_GRACE_SECONDS);
    setOpen(false);
  };

  const signOutNow = () => {
    signOutDeadline.current = 0;
    setOpen(false);
    signOut().catch(() => {});
  };

  return (
    <dialog
      ref={dialogRef}
      className="session-idle-dialog"
      aria-labelledby="session-idle-title"
      aria-describedby="session-idle-description"
      onCancel={(event) => {
        event.preventDefault();
        staySignedIn();
      }}
    >
      <div className="session-idle-content">
        <p className="eyebrow">SESSION SECURITY</p>
        <h2 id="session-idle-title">Still using WRJA?</h2>
        <p id="session-idle-description">
          You have been inactive for 10 minutes. We will sign you out in {secondsRemaining} seconds to protect your account.
        </p>
        <div className="session-idle-actions">
          <button type="button" className="btn btn-accent" onClick={staySignedIn} autoFocus>Stay signed in</button>
          <button type="button" className="btn btn-outline-dark" onClick={signOutNow}>Sign out now</button>
        </div>
      </div>
    </dialog>
  );
}
