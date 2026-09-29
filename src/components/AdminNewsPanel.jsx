import { useState } from "react";
import ImageUploadField from "./ImageUploadField";
import { useCollectionState } from "../hooks/useCollection";
import useNotice from "../hooks/useNotice";
import { DEFAULT_NEWS_IMAGE, newsAdmin, newsStore } from "../data/newsPosts";
import { isHttpUrl } from "../lib/format";

const emptyPost = { title: "", category: "Club news", excerpt: "", body: "", image: DEFAULT_NEWS_IMAGE, source: "", url: "" };

export default function AdminNewsPanel() {
  const { items: posts, loaded, error: loadError } = useCollectionState(newsStore);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState(null);
  const { notice, show, clear } = useNotice();

  const categories = [...new Set(posts.map((post) => post.category).filter(Boolean))];

  const update = (field, value) => setFormState((current) => ({ ...current, [field]: value }));
  const openAdd = () => { clear(); setFormState({ id: null, ...emptyPost, isoDate: new Date().toISOString().slice(0, 10) }); };
  const openEdit = (post) => { clear(); setFormState({ ...post, isoDate: post.sortDate }); };
  const closeForm = () => setFormState(null);

  const handleSave = async (event) => {
    event.preventDefault();
    if (formState.url && !isHttpUrl(formState.url)) return show("error", "Source URL must start with http:// or https://");

    const { isoDate, ...rest } = formState;
    const record = { ...rest, sortDate: isoDate };
    const adding = !record.id;

    setSaving(true);
    try {
      if (adding) await newsAdmin.create(record);
      else await newsAdmin.update(record.id, record);
      closeForm();
      show("success", adding ? "Post published." : "Post updated.");
    } catch (error) {
      show("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    try {
      await newsAdmin.remove(post.id);
      show("success", "Post deleted.");
    } catch (error) {
      show("error", error.message);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>News</h2>
          <p className="admin-table-subtext">Posts show on the Home page, the News page and the sidebar. Newest first.</p>
        </div>
        <button className="btn btn-accent" onClick={openAdd}>+ Add post</button>
      </div>

      {loadError && <p className="admin-notice admin-notice-error">{loadError}</p>}
      {notice && <p className={`admin-notice admin-notice-${notice.type}`} role="status">{notice.text}</p>}

      {formState && (
        <form className="admin-form" onSubmit={handleSave}>
          <h3 className="admin-form-title">{formState.id ? "Edit post" : "New post"}</h3>
          <label>Title<input value={formState.title} onChange={(e) => update("title", e.target.value)} required /></label>
          <div className="admin-form-row-2">
            <label>Date<input type="date" value={formState.isoDate} onChange={(e) => update("isoDate", e.target.value)} required /></label>
            <label>Category
              <input list="news-categories" value={formState.category} onChange={(e) => update("category", e.target.value)} required />
              <datalist id="news-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
            </label>
          </div>
          <label>Summary<textarea rows="3" value={formState.excerpt} onChange={(e) => update("excerpt", e.target.value)} required /></label>
          <label>Full story (optional)<textarea rows="6" value={formState.body || ""} onChange={(e) => update("body", e.target.value)} placeholder="Leave a blank line between paragraphs. Shown on the post's own page." /></label>

          <ImageUploadField
            label="Post image"
            value={formState.image}
            onChange={(value) => update("image", value || DEFAULT_NEWS_IMAGE)}
            removeLabel="Use default image"
            onError={(text) => show("error", text)}
          />

          <div className="admin-form-row-2">
            <label>Source (if reposting coverage)<input value={formState.source} onChange={(e) => update("source", e.target.value)} /></label>
            <label>Source URL<input type="url" value={formState.url} onChange={(e) => update("url", e.target.value)} placeholder="https://..." /></label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Saving…" : formState.id ? "Save changes" : "Publish post"}</button>
            <button type="button" className="btn btn-outline-dark" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Title</th><th>Category</th><th>Date</th><th /></tr></thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td><img className="admin-thumb" src={post.image} alt="" /></td>
                <td><strong>{post.title}</strong>{post.source && <div className="admin-table-subtext">via {post.source}</div>}</td>
                <td><span className="admin-badge">{post.category}</span></td>
                <td>{String(post.date).trim()}</td>
                <td className="admin-table-actions"><button onClick={() => openEdit(post)}>Edit</button><button className="danger" onClick={() => handleDelete(post)}>Delete</button></td>
              </tr>
            ))}
            {!loaded && <tr><td colSpan="5" className="admin-empty-cell">Loading…</td></tr>}
            {loaded && posts.length === 0 && <tr><td colSpan="5" className="admin-empty-cell">No news posts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
