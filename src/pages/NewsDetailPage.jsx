import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { getPublishedNewsPostById } from "../services/newsService";
import fallbackImage from "../assets/images/News/IsabellaandGabriell_27891-780x470.jpg";

export default function NewsDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      try {
        const result = await getPublishedNewsPostById(id);
        if (!cancelled) setPost(result);
      } catch (loadError) {
        console.error("Could not load WRJA news post:", loadError);
        if (!cancelled) setError("The news post could not be loaded right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPost();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="simple-page"><p>Loading news...</p></div>;

  if (error) {
    return <div className="simple-page"><p>{error}</p><Link to="/news">Back to news</Link></div>;
  }

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
          <img src={post.image || fallbackImage} alt={post.title} />
        </Reveal>

        <Reveal delay={150} className="news-detail-content">
          <div className="news-post-meta">
            <span className="news-post-date">{post.date}</span>
            <span className="news-post-category">{post.category}</span>
          </div>
          <p>{post.body || post.excerpt}</p>
          <Link to="/news" className="btn btn-outline-dark">&larr; Back to all news</Link>
        </Reveal>
      </section>
    </div>
  );
}
