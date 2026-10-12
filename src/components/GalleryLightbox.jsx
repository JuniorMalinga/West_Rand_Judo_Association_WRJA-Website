import { useEffect } from "react";

export default function GalleryLightbox({ items, activeIndex, onClose, onNavigate }) {
  const activeItem = items[activeIndex];

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNavigate((activeIndex + 1) % items.length);
      if (event.key === "ArrowLeft") onNavigate((activeIndex - 1 + items.length) % items.length);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, items.length, onClose, onNavigate]);

  if (!activeItem) return null;

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">&times;</button>

      <button
        className="lightbox-nav lightbox-nav-prev"
        onClick={(event) => {
          event.stopPropagation();
          onNavigate((activeIndex - 1 + items.length) % items.length);
        }}
        aria-label="Previous photo"
      >
        &lsaquo;
      </button>

      <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
        <img key={activeItem.id} src={activeItem.photoUrl} alt={activeItem.altText || activeItem.caption} />
        <p className="lightbox-caption">{activeItem.caption}</p>
      </div>

      <button
        className="lightbox-nav lightbox-nav-next"
        onClick={(event) => {
          event.stopPropagation();
          onNavigate((activeIndex + 1) % items.length);
        }}
        aria-label="Next photo"
      >
        &rsaquo;
      </button>
    </div>
  );
}
