export default function GalleryFilterTabs({ categories, activeCategory, onSelect }) {
  return (
    <div className="gallery-filter-tabs">
      {categories.map((category) => (
        <button
          key={category.slug}
          type="button"
          className={`gallery-filter-tab ${activeCategory === category.slug ? "gallery-filter-tab-active" : ""}`}
          onClick={() => onSelect(category.slug)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}