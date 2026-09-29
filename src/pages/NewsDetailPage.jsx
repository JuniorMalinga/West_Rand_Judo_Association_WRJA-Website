import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { newsStore } from "../data/newsPosts";
import { useCollectionState } from "../hooks/useCollection";
import Reveal from "../components/Reveal";

export default function NewsDetailPage() {
  const { id } = useParams();
  const { items: newsPosts, loaded } = useCollectionState(newsStore);
  const post = newsPosts.find((item) => String(item.id) === id);

  if (!post && !loaded) return <div className="simple-page"><p>Loading…</p></div>;

  if (!post) {
    return (
      <div className="simple-page">
        <h1>Post not found</h1>
        <Link to="/news">Back to news</Link>
      </div>
    );
  }

  return (
    <div className="news-detail-page">
      <PageHeader title={post.title} crumbs={[{ label: "News", to: "/news" }]} />

      <section className="news-detail">
        <Reveal className="news-detail-image-wrap">
          <img src={post.image} alt={post.title} />
        </Reveal>

        <Reveal delay={150} className="news-detail-content">
          <div className="news-post-meta">
            <span className="news-post-date">{post.date}</span>
            <span className="news-post-category">{post.category}</span>
          </div>
          <p>{post.excerpt}</p>
          {post.body && post.body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          {post.url && (
            <p><a href={post.url} target="_blank" rel="noopener noreferrer" className="news-post-source-link">Read on {post.source || "the original site"} &rarr;</a></p>
          )}
          <Link to="/news" className="btn btn-outline-dark">&larr; Back to all news</Link>
        </Reveal>
      </section>
    </div>
  );
}