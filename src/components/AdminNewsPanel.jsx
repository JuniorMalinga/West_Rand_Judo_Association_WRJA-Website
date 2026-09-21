import { useEffect, useState } from "react";
import {
  getNewsPostsForAdmin,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
} from "../services/newsService";

const emptyPost = {
  title: "",
  status: "draft",
  publishedAt: "",
  category: "",
  source: "",
  url: "",
  hasVideo: false,
  excerpt: "",
  body: "",
  imagePath: "",
};

function getStatusClass(status) {
  if (status === "published") return "admin-status-confirmed";
  if (status === "draft") return "admin-status-pending";
  if (status === "archived") return "admin-status-cancelled";
  return "";
}

function formatStatus(status) {
  if (!status) return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminNewsPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelError, setPanelError] = useState("");
  const [formState, setFormState] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load all news posts on mount
  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      try {
        setLoading(true);
        setPanelError("");
        const data = await getNewsPostsForAdmin();
        if (isMounted) setPosts(data);
      } catch (err) {
        console.error("Failed to load news posts for admin:", err);
        if (isMounted) setPanelError(err.message || "Failed to load news posts.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAddForm = () => {
    setFormError("");
    setFormState({ id: null, ...emptyPost });
  };

  const openEditForm = (post) => {
    setFormError("");
    setFormState({
      id: post.id,
      title: post.title || "",
      status: post.status || "draft",
      publishedAt: post.publishedAt ? post.publishedAt.slice(0, 10) : "",
      category: post.category || "",
      source: post.source || "",
      url: post.url || "",
      hasVideo: Boolean(post.hasVideo),
      excerpt: post.excerpt || "",
      body: post.body || "",
      imagePath: post.imagePath || "",
    });
  };

  const closeForm = () => {
    setFormState(null);
    setFormError("");
  };

  const handleFieldChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      if (formState.id) {
        const updated = await updateNewsPost(formState.id, formState);
        setPosts((current) =>
          current.map((item) => (item.id === formState.id ? updated : item))
        );
      } else {
        const created = await createNewsPost(formState);
        setPosts((current) => [created, ...current]);
      }
      closeForm();
    } catch (err) {
      console.error("Error saving news post:", err);
      setFormError(err.message || "Failed to save news post. Please check your inputs.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news post?")) return;

    try {
      await deleteNewsPost(id);
      setPosts((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting news post:", err);
      setPanelError(err.message || "Failed to delete news post.");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>News</h2>
        <button className="btn btn-accent" onClick={openAddForm}>
          + Add post
        </button>
      </div>

      {panelError && <p className="auth-error">{panelError}</p>}
      {loading && <p className="simple-page">Loading news posts from Supabase...</p>}

      {formState && (
        <form className="admin-form" onSubmit={handleSave}>
          <label>
            Title
            <input
              type="text"
              value={formState.title}
              onChange={(event) =>
                handleFieldChange("title", event.target.value)
              }
              placeholder="e.g. National success for Golden Score judokas"
              required
            />
          </label>

          <div className="admin-form-row-2">
            <label>
              Category
              <input
                type="text"
                value={formState.category}
                onChange={(event) =>
                  handleFieldChange("category", event.target.value)
                }
                placeholder="e.g. Competition, Club news..."
              />
            </label>

            <label>
              Status
              <select
                value={formState.status}
                onChange={(event) =>
                  handleFieldChange("status", event.target.value)
                }
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>

          <div className="admin-form-row-2">
            <label>
              Published date (optional)
              <input
                type="date"
                value={formState.publishedAt}
                onChange={(event) =>
                  handleFieldChange("publishedAt", event.target.value)
                }
              />
            </label>

            <label>
              Cover image path (Storage)
              <input
                type="text"
                value={formState.imagePath}
                onChange={(event) =>
                  handleFieldChange("imagePath", event.target.value)
                }
                placeholder="e.g. news/national-championships-2026.jpg"
              />
            </label>
          </div>

          <div className="admin-form-row-2">
            <label>
              Source name (if reposting coverage)
              <input
                type="text"
                value={formState.source}
                onChange={(event) =>
                  handleFieldChange("source", event.target.value)
                }
                placeholder="e.g. Randfontein Herald"
              />
            </label>

            <label>
              Source URL
              <input
                type="url"
                value={formState.url}
                onChange={(event) =>
                  handleFieldChange("url", event.target.value)
                }
                placeholder="https://..."
              />
            </label>
          </div>

          <label className="auth-checkbox" style={{ margin: "4px 0" }}>
            <input
              type="checkbox"
              checked={formState.hasVideo}
              onChange={(event) =>
                handleFieldChange("hasVideo", event.target.checked)
              }
            />
            Has video attachment
          </label>

          <label>
            Excerpt
            <textarea
              rows="2"
              value={formState.excerpt}
              onChange={(event) =>
                handleFieldChange("excerpt", event.target.value)
              }
              placeholder="A brief summary of the article..."
            />
          </label>

          <label>
            Article body
            <textarea
              rows="6"
              value={formState.body}
              onChange={(event) =>
                handleFieldChange("body", event.target.value)
              }
              placeholder="Full text of the news article..."
              required
            />
          </label>

          {formError && <p className="auth-error">{formError}</p>}

          <div className="admin-form-actions">
            <button
              type="submit"
              className="btn btn-accent"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : formState.id
                ? "Save changes"
                : "Add post"}
            </button>
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={closeForm}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Published Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  No news posts found.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    {post.title}
                    {post.excerpt && (
                      <div className="admin-table-subtext">
                        {post.excerpt.length > 70
                          ? `${post.excerpt.slice(0, 70)}...`
                          : post.excerpt}
                      </div>
                    )}
                  </td>
                  <td>{post.category || "—"}</td>
                  <td>
                    <span className={`admin-status ${getStatusClass(post.status)}`}>
                      {formatStatus(post.status)}
                    </span>
                  </td>
                  <td>{post.date || "Not published"}</td>
                  <td className="admin-table-actions">
                    <button type="button" onClick={() => openEditForm(post)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(post.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}