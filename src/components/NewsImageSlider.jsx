import { useEffect, useState } from "react";

import Newsvideoslide from "../assets/images/background/news-video.mp4";
import Newsimageslide2 from "../assets/images/background/sports-judo-belt-737250.jpeg";
import Newsimageslide3 from "../assets/images/background/karsten-winegeart-0Wra5YYVQJE-unsplash.jpg";


// Slide 1 uses a video background.
// Slides 2 and 3 use static images.
const slides = [
  {
    number: "01",
    type: "video",
    poster: Newsimageslide2,
    videoSrc: Newsvideoslide,
    heading: (
      <>
        <span className="text-accent">Judo</span> and{" "}
        <br />
        martial arts <span className="text-accent">school</span>
      </>
    ),
  },

  {
    number: "02",
    type: "image",
    image: Newsimageslide2,
    heading: (
      <>
        <span className="text-accent">Follow</span> every
        <br />
        judo <span className="text-accent">competition</span>
      </>
    ),
  },

  {
    number: "03",
    type: "image",
    image: Newsimageslide3,
    heading: (
      <>
        Build your body
        <br />
        <span className="text-accent">by our training</span>
      </>
    ),
  },
];

export default function NewsImageSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    
    const duration = slides[activeIndex].type === "video" ? 6000 : 6000; //set duration based on slide type (video or image) currently 9sec for images

    const timer = setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [activeIndex]);

  const activeSlide = slides[activeIndex];

  return (
    <section className="news-image">
      {slides.map((slide, index) => (
        <div
          key={slide.number}
          className={`news-image-slide ${
            index === activeIndex ? "news-image-slide-active" : ""
          }`}
        >
          {slide.type === "video" ? (
            <video
              className="news-image-media"
              poster={slide.poster}
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={slide.videoSrc} type="video/mp4" />
            </video>
          ) : (
            <div
              className="news-image-media"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          )}
        </div>
      ))}

      <div className="news-image-overlay" />

      <div className="news-image-content">
        <h2>{activeSlide.heading}</h2>

        <div className="news-image-numbers">
          {slides.map((slide, index) => (
            <button
              key={slide.number}
              className={`news-image-number ${
                index === activeIndex
                  ? "news-image-number-active"
                  : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show slide ${slide.number}`}
            >
              {slide.number}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}