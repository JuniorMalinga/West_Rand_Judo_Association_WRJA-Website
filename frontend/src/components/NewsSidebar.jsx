import { Link } from "react-router-dom";
import { getPublishedNewsCategories } from "../data/newsCategories";

export default function NewsSidebar({ newsPosts, activeCategory, onCategorySelect }) {
  const recentPosts = newsPosts.slice(0, 3);
  const categories = getPublishedNewsCategories(newsPosts);

  return (
    <aside className="news-sidebar">
      <div className="sidebar-block">
        <h3>Recent posts</h3>
        <ul className="recent-posts-list">
          {recentPosts.map((post) => (
            <li key={post.id}>
              <Link to={`/news/${post.id}`} className="recent-post-link">
                <img src={post.image} alt="" loading="lazy" decoding="async" />
                <div>
                  <p className="recent-post-title">{post.title}</p>
                  <p className="recent-post-date">{post.date}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {categories.length > 0 && (
        <div className="sidebar-block">
          <h3>Tags</h3>
          <div className="tag-cloud">
            <button
              type="button"
              className={`tag-pill ${activeCategory === "" ? "tag-pill-active" : ""}`}
              aria-pressed={activeCategory === ""}
              onClick={() => onCategorySelect("")}
            >
              All news
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`tag-pill ${activeCategory === category ? "tag-pill-active" : ""}`}
                aria-pressed={activeCategory === category}
                onClick={() => onCategorySelect(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}