import { useEffect, useState } from "react";
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

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="image-slider">
      <div className="image-slides">
        {slides.map((slide, index) => (
          <div
            key={slide.number}
            className={`image-slide ${index === activeIndex ? "image-slide-active" : ""}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
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
