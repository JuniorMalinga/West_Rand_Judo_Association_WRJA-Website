import { useEffect, useMemo, useRef, useState } from "react";
import ImageUploadField from "./ImageUploadField";
import { useCollectionState } from "../hooks/useCollection";
import useNotice from "../hooks/useNotice";
import { adminGalleryStore, galleryAdmin } from "../data/gallery";
import { galleryCategories } from "../data/galleryItems";

const categories = galleryCategories.filter((category) => category.slug !== "all");
const emptyItem = {
  category: "training",
  caption: "",
  altText: "",
  displayOrder: 100,
  photoUrl: "",
};

export default function AdminGalleryPanel() {
  const { items, loaded, error: loadError } = useCollectionState(adminGalleryStore);
  const [formState, setFormState] = useState(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const deleteDialogRef = useRef(null);
  const cancelDeleteRef = useRef(null);
  const { notice, show, clear } = useNotice();

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;
    if (deleteTarget && !dialog.open) {
      dialog.showModal();
      cancelDeleteRef.current?.focus();
    } else if (!deleteTarget && dialog.open) {
      dialog.close();
    }
  }, [deleteTarget]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesSearch = !search || `${item.caption} ${item.altText}`.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [items, query, categoryFilter]);

  const update = (field, value) => setFormState((current) => ({ ...current, [field]: value }));
  const openAdd = () => {
    clear();
    const nextOrder = Math.max(0, ...items.map((item) => Number(item.displayOrder) || 0)) + 1;
    setFormState({ id: null, ...emptyItem, displayOrder: Math.min(nextOrder, 9999) });
  };
  const openEdit = (item) => {
    clear();
    setFormState({ ...item });
  };
  const closeForm = () => setFormState(null);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formState.photoUrl) return show("error", "Upload an image before saving.");
    const isNew = !formState.id;
    setSaving(true);
    try {
      const { id, imagePath, createdAt, updatedAt, ...record } = formState;
      if (isNew) await galleryAdmin.create(record);
      else await galleryAdmin.update(id, record);
      closeForm();
      show("success", isNew ? "Gallery image added." : "Gallery image updated.");
    } catch (error) {
      show("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    setDeleteError("");
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deletingId) return;
    const item = deleteTarget;
    setDeletingId(item.id);
    try {
      const result = await galleryAdmin.remove(item.id);
      setDeleteTarget(null);
      show("success", result.orderUpdated === false
        ? "Image and gallery entry deleted. Display order could not be refreshed; use Refresh data."
        : "Image file and gallery entry permanently deleted.");
    } catch (error) {
      setDeleteError(error.message || "The image could not be completely deleted. Check the gallery and Storage before retrying.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Gallery</h2>
          <p className="admin-table-subtext">Manage gallery photos and categories.</p>
        </div>
        <button className="btn btn-accent" onClick={openAdd}>+ Add photo</button>
      </div>

      {loadError && <p className="admin-notice admin-notice-error" role="alert">{loadError}</p>}
      {notice && <p className={`admin-notice admin-notice-${notice.type}`} role="status">{notice.text}</p>}

      {formState && (
        <form className="admin-form" onSubmit={handleSave}>
          <h3 className="admin-form-title">{formState.id ? "Edit gallery photo" : "Add gallery photo"}</h3>
          <ImageUploadField
            label="Photo"
            value={formState.photoUrl}
            onChange={(value) => update("photoUrl", value)}
            allowRemove={false}
            onError={(text) => show("error", text)}
          />
          <div className="admin-form-row-2">
            <label>Category
              <select value={formState.category} onChange={(event) => update("category", event.target.value)} required>
                {categories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
              </select>
            </label>
            <label>Display order
              <input type="number" min="1" max="9999" step="1" value={formState.displayOrder} onChange={(event) => update("displayOrder", event.target.value)} required />
            </label>
          </div>
          <label>Caption
            <input value={formState.caption} onChange={(event) => update("caption", event.target.value)} maxLength="160" required />
          </label>
          <label>Alternative text
            <input value={formState.altText} onChange={(event) => update("altText", event.target.value)} maxLength="240" required />
            <small className="admin-field-hint">Describe the photo for visitors using screen readers.</small>
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Saving…" : formState.id ? "Save changes" : "Add to gallery"}</button>
            <button type="button" className="btn btn-outline-dark" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-toolbar">
        <input className="admin-search" type="search" aria-label="Search gallery photos" placeholder="Search captions and alt text…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="admin-inline-select" aria-label="Filter gallery category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
        </select>
        <span className="admin-count">{filteredItems.length} photo{filteredItems.length === 1 ? "" : "s"}</span>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Photo</th><th>Caption / alt text</th><th>Category</th><th>Order</th><th /></tr></thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td><img className="admin-thumb" src={item.photoUrl} alt="" /></td>
                <td><strong>{item.caption}</strong><div className="admin-table-subtext">{item.altText}</div></td>
                <td><span className="admin-badge">{categories.find((category) => category.slug === item.category)?.label || item.category}</span></td>
                <td>{item.displayOrder}</td>
                <td className="admin-table-actions">
                  <button onClick={() => openEdit(item)}>Edit</button>
                  <button className="danger" disabled={deletingId === item.id} onClick={() => handleDelete(item)}>Delete</button>
                </td>
              </tr>
            ))}
            {!loaded && <tr><td colSpan="5" className="admin-empty-cell">Loading gallery…</td></tr>}
            {loaded && !loadError && filteredItems.length === 0 && <tr><td colSpan="5" className="admin-empty-cell">No gallery photos found. Add a photo to get started.</td></tr>}
          </tbody>
        </table>
      </div>

      <dialog
        ref={deleteDialogRef}
        className="admin-confirm-dialog"
        aria-labelledby="gallery-delete-title"
        aria-describedby="gallery-delete-description"
        aria-modal="true"
        onCancel={(event) => {
          event.preventDefault();
          if (!deletingId) {
            setDeleteError("");
            setDeleteTarget(null);
          }
        }}
      >
        {deleteTarget && (
          <div className="admin-confirm-content" aria-busy={deletingId === deleteTarget.id}>
            <p className="admin-confirm-kicker">PERMANENT GALLERY DELETION</p>
            <h2 id="gallery-delete-title">Permanently delete this image?</h2>
            <div className="admin-confirm-image">
              <img src={deleteTarget.photoUrl} alt={`Preview of ${deleteTarget.caption}`} />
              <strong>{deleteTarget.caption}</strong>
            </div>
            <p id="gallery-delete-description">
              “{deleteTarget.caption}” and its associated image file will be permanently deleted from storage and removed from the gallery. This action cannot be undone.
            </p>
            {deleteError && <p className="admin-notice admin-notice-error admin-confirm-error" role="alert">{deleteError}</p>}
            <div className="admin-confirm-actions">
              <button ref={cancelDeleteRef} type="button" className="btn btn-outline-dark" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)}>Cancel</button>
              <button type="button" className="btn admin-confirm-delete" onClick={confirmDelete} disabled={Boolean(deletingId)}>
                {deletingId === deleteTarget.id ? "Deleting…" : "Delete Permanently"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
