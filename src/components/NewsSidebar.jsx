import { Link } from "react-router-dom";

const tags = ["Judo", "Judo club", "Champion", "Athlete", "Fitness", "Dojo", "Grading", "Training"];

export default function NewsSidebar({ newsPosts = [] }) {
  const recentPosts = newsPosts.slice(0, 3);

  return (
    <aside className="news-sidebar">
      <div className="sidebar-block">
        <h3>Recent posts</h3>
        <ul className="recent-posts-list">
          {recentPosts.map((post) => (
            <li key={post.id}>
              <Link to={`/news/${post.id}`} className="recent-post-link">
                <img src={post.image} alt="" />
                <div>
                  <p className="recent-post-title">{post.title}</p>
                  <p className="recent-post-date">{post.date}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-block">
        <h3>Tags</h3>
        <div className="tag-cloud">
          {tags.map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
      </div>
    </aside>
  );
}