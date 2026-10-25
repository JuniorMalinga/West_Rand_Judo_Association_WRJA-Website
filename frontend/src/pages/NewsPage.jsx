import { useState } from "react";
import PageHeader from "../components/PageHeader";
import NewsHeroSlider from "../components/NewsImageSlider";
import NewsSidebar from "../components/NewsSidebar";
import NewsPost from "../components/NewsPost";
import Pagination from "../components/Pagination";
import { newsStore } from "../data/newsPosts";
import useCollection from "../hooks/useCollection";

const POSTS_PER_PAGE = 4;

export default function NewsPage() {
  const newsPosts = useCollection(newsStore);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const filteredPosts = selectedCategory
    ? newsPosts.filter(
        (post) =>
          String(post.category || "").trim().toLowerCase() ===
          selectedCategory.toLowerCase()
      )
    : newsPosts;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));

  const visiblePosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="news-page">
      <PageHeader title="News" />
      <NewsHeroSlider />

      <section className="news-page-layout">
        <NewsSidebar
          newsPosts={newsPosts}
          activeCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />

        <div className="news-post-list">
          {visiblePosts.map((post) => (
            <NewsPost key={post.id} post={post} />
          ))}

          {filteredPosts.length === 0 && <p>No news posts in this category yet.</p>}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </section>
    </div>
  );
}