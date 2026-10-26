import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom"; 

import judo1 from "../assets/images/Landing/Home Cover 1.jpg";
import judo2 from "../assets/images/Landing/Home Cover 2.jpg";
import judo3 from "../assets/images/Landing/Home Cover 3.jpg";

const slides = [
  { image: judo1, number: "1" },
  { image: judo2, number: "2" },
  { image: judo3, number: "3" },
];

export default function ImageSlider() { 
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(() => new Set([0]));
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const [heroReady, setHeroReady] = useState(false);
  const heroImageRef = useRef(null);

  useEffect(() => {
    const image = heroImageRef.current;
    if (image?.complete && image.naturalWidth > 0) setHeroReady(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const updateMobileState = (event) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", updateMobileState);
    return () => mediaQuery.removeEventListener("change", updateMobileState);
  }, []);

  useEffect(() => {
    if (isMobile || window.matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData) {
      return undefined;
    }
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isMobile]);

  // Keep only the active slide loaded on mobile; preload the next desktop slide.
  useEffect(() => {
    setLoaded((previous) => {
      const next = new Set(previous);
      next.add(activeIndex);
      const canPrefetch = !isMobile
        && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        && !navigator.connection?.saveData;
      if (canPrefetch) next.add((activeIndex + 1) % slides.length);
      return next;
    });
  }, [activeIndex, isMobile]);

  return (
    <section className={`image-slider ${heroReady ? "home-hero-ready" : ""}`}>
      <div className="image-slides">
        {slides.map((slide, index) => (
          <div
            key={slide.number}
            className={`image-slide ${index === activeIndex ? "image-slide-active" : ""}`}
          >
            {loaded.has(index) && (
              <img
                ref={index === 0 ? heroImageRef : undefined}
                src={slide.image}
                alt=""
                loading={index === activeIndex ? "eager" : "lazy"}
                fetchpriority={index === 0 ? "high" : "auto"}
                decoding="async"
                onLoad={index === 0 ? () => setHeroReady(true) : undefined}
                onError={index === 0 ? () => setHeroReady(true) : undefined}
              />
            )}
          </div>
        ))}
      </div>
      <div className="image-overlay" />

      <div className="image-content">
        <h1 className="image-title">
          Welcome to <span className="image-highlight">West Rand Judo</span> Association
        </h1>

        <div className="image-numbers">
          {slides.map((slide, index) => (
            <button
              key={slide.number}
              className={`image-number ${index === activeIndex ? "image-number-active" : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show slide ${slide.number}`}
            >
              {slide.number}
            </button>
          ))}
        </div>

        <p className="image-text">
          Building discipline, respect, and excellence through judo for
          athletes of all ages across the West Rand community.
        </p>

        <div className="image-actions">
          <Link to="/contact" className="btn btn-accent btn-lg">
            Contact the club
          </Link>
          <Link to="/about" className="btn btn-outline btn-lg">
            Learn more
          </Link>
        </div>
      </div>
    </section>
  );
}
