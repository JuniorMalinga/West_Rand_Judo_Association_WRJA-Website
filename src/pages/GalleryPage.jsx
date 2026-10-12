import { useState } from "react";
import PageHeader from "../components/PageHeader";
import GalleryFilterTabs from "../components/GalleryFilterTabs";
import GalleryItem from "../components/GalleryItem";
import GalleryLightbox from "../components/GalleryLightbox";
import Pagination from "../components/Pagination";
import { galleryCategories } from "../data/galleryItems";
import { useCollectionState } from "../hooks/useCollection";
import { combineGalleryItems, galleryStore, galleryDeletedPathsStore } from "../data/gallery";

const PHOTOS_PER_PAGE = 10;

export default function GalleryPage() {
  const { items: managedItems } = useCollectionState(galleryStore);
  const { items: deletedPaths } = useCollectionState(galleryDeletedPathsStore);
  const allItems = combineGalleryItems(managedItems, deletedPaths);
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(null);

  const filteredItems =
    activeCategory === "all"
      ? allItems
      : allItems.filter((item) => item.category === activeCategory);

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
          categories={galleryCategories}
          activeCategory={activeCategory}
          onSelect={handleSelectCategory}
        />

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
