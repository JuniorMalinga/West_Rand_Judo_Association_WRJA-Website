import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import NewsHeroSlider from "../components/NewsImageSlider";
import NewsSidebar from "../components/NewsSidebar";
import NewsPost from "../components/NewsPost";
import Pagination from "../components/Pagination";
import { getPublishedNewsPosts } from "../services/newsService";

const POSTS_PER_PAGE = 4;

export default function NewsPage() {
  const [newsPosts, setNewsPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      try {
        // Same pattern as EventsPage: React page -> service -> Supabase.
        // Developers can copy this approach for Programs, Gallery, etc.
        const result = await getPublishedNewsPosts();
        if (!cancelled) setNewsPosts(result);
      } catch (loadError) {
        console.error("Could not load WRJA news:", loadError);
        if (!cancelled) setError("News could not be loaded right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNews();
    return () => { cancelled = true; };
  }, []);

  const totalPages = Math.ceil(newsPosts.length / POSTS_PER_PAGE);
  const visiblePosts = newsPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="news-page">
      <PageHeader title="News" />
      <NewsHeroSlider />

      {loading && <p className="simple-page">Loading news...</p>}
      {error && <p className="simple-page">{error}</p>}

      {!loading && !error && (
        <section className="news-page-layout">
          <NewsSidebar newsPosts={newsPosts} />

          <div className="news-post-list">
            {visiblePosts.map((post) => (
              <NewsPost key={post.id} post={post} />
            ))}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
