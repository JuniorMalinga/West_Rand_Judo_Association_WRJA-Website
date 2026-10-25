import { useEffect, useRef, useState } from "react";

export default function FormStatus({ status }) {
  const dialogRef = useRef(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status?.type === "success") setDismissed(false);
  }, [status]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (status?.type === "success" && !dismissed && !dialog.open) {
      dialog.showModal();
    } else if ((status?.type !== "success" || dismissed) && dialog.open) {
      dialog.close();
    }
  }, [status, dismissed]);

  if (!status) return null;
  if (status.type !== "success") {
    return <p className="form-status form-status-error" role="alert">{status.text}</p>;
  }

  return (
    <dialog
      ref={dialogRef}
      className="form-status-dialog"
      aria-labelledby="form-status-title"
      aria-describedby="form-status-message"
      onCancel={(event) => {
        event.preventDefault();
        setDismissed(true);
      }}
    >
      <button
        type="button"
        className="form-status-dismiss"
        aria-label="Dismiss message"
        onClick={() => setDismissed(true)}
      >
        &times;
      </button>
      <span className="form-status-mark" aria-hidden="true">&#10003;</span>
      <h2 id="form-status-title">Message sent</h2>
      <p id="form-status-message">{status.text}</p>
    </dialog>
  );
}
