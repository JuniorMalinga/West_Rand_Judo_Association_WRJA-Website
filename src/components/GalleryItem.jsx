import Reveal from "./Reveal";

// A single square thumbnail. index is the position within the current
// page (used for the stagger animation delay); absoluteIndex is the
// item's real position in the full gallery array, so the lightbox can
// browse across every photo, not just the current page.
export default function GalleryItem({ item, index, absoluteIndex, onOpen }) {
  return (
    <Reveal delay={index * 40}>
      <button
        type="button"
        className="gallery-item"
        onClick={() => onOpen(absoluteIndex)}
        aria-label={`Open ${item.caption}`}
      >
        <img src={item.photoUrl} alt={item.altText || item.caption} loading="lazy" decoding="async" />
        <span className="gallery-item-overlay">
          <span className="gallery-item-caption">{item.caption}</span>
        </span>
      </button>
    </Reveal>
  );
}
