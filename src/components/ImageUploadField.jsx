import { useRef, useState } from "react";
import { api } from "../lib/api";
import { processImageFile } from "../lib/images";

// Upload control used by every admin form. Shows a preview, accepts an image
// file (never a URL), shrinks it in the browser and hands back a data URL.
export default function ImageUploadField({
  label,
  value,
  onChange,
  hint = "JPG, PNG or WebP. Large photos are resized before uploading.",
  removeLabel = "Remove image",
  format = "photo", // "photo" -> compressed JPEG, "qr" -> lossless PNG
  onError,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setError("");
    try {
      const options = format === "qr"
        ? { maxSize: 700, type: "image/png" }
        : { maxSize: 1400, type: "image/jpeg", quality: 0.82 };
      const dataUrl = await processImageFile(file, options);
      // The image is stored on the server; the form only keeps the returned path.
      const { url } = await api("/api/admin/uploads", { method: "POST", body: { dataUrl } });
      onChange(url);
    } catch (uploadError) {
      setError(uploadError.message);
      onError?.(uploadError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`admin-upload admin-upload-${format}`}>
      <span className="admin-upload-label">{label}</span>
      <div className="admin-upload-body">
        <div className="admin-upload-preview">
          {value ? <img src={value} alt={`${label} preview`} /> : <span>No image</span>}
        </div>
        <div className="admin-upload-controls">
          <div className="admin-upload-buttons">
            <button type="button" className="btn btn-outline-dark" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
            </button>
            {value && (
              <button type="button" className="admin-link-button" onClick={() => { setError(""); onChange(""); }}>
                {removeLabel}
              </button>
            )}
          </div>
          <small>{hint}</small>
          {error && <small className="admin-upload-error">{error}</small>}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} hidden />
      </div>
    </div>
  );
}
