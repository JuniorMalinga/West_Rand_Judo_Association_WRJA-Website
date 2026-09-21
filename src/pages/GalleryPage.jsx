import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import GalleryFilterTabs from "../components/GalleryFilterTabs";
import GalleryItem from "../components/GalleryItem";
import GalleryLightbox from "../components/GalleryLightbox";
import Pagination from "../components/Pagination";
import { getGalleryItems } from "../services/galleryService";

const categories = [{ slug: "all", label: "All" }];
const PHOTOS_PER_PAGE = 10;

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGallery() {
      try {
        const result = await getGalleryItems();
        if (!cancelled) setGalleryItems(result);
      } catch {
        if (!cancelled) setError("Gallery images could not be loaded right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGallery();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems =
    activeCategory === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  const totalPages = Math.ceil(filteredItems.length / PHOTOS_PER_PAGE);
  const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
  const visibleItems = filteredItems.slice(startIndex, startIndex + PHOTOS_PER_PAGE);

  const handleSelectCategory = (categorySlug) => {
    setActiveCategory(categorySlug);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="gallery-page">
      <PageHeader title="Gallery" />

      <section className="gallery-section">
        <GalleryFilterTabs
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleSelectCategory}
        />

        {loading && <p className="simple-page">Loading gallery...</p>}
        {error && <p className="simple-page">{error}</p>}
        {!loading && !error && filteredItems.length === 0 && (
          <p className="simple-page">No gallery images are available in this category.</p>
        )}

        <div className="gallery-grid">
          {visibleItems.map((item, localIndex) => (
            <GalleryItem
              key={item.id}
              item={item}
              index={localIndex}
              absoluteIndex={startIndex + localIndex}
              onOpen={setActiveIndex}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </section>

      {activeIndex !== null && (
        <GalleryLightbox
          items={filteredItems}
          activeIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
          onNavigate={setActiveIndex}
        />
      )}
    </div>
  );
}
