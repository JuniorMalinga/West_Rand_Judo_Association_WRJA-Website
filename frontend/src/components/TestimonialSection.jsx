import { useState } from "react";
import Reveal from "./Reveal";

const testimonials = [
  {
  name: "Johan M.",
  role: "Parent",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  quote:
    "Judo has been fantastic for our son. We've seen a big difference in his confidence and discipline since he started training, and he really enjoys being part of the club.",
},
{
  name: "Michelle B.",
  role: "Parent",
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  quote:
    "The club has created a great environment for our children. The training is challenging but encouraging, and the friendships they've made through judo have been just as valuable as the sport itself.",
},
{
  name: "Liam S.",
  role: "Athlete",
  avatar: "https://randomuser.me/api/portraits/men/75.jpg",
  quote:
    "I've really enjoyed my time training judo. It has taught me to stay disciplined, work hard and keep going when things get difficult. Competing has also helped me become much more confident.",
},
{
  name: "Charlotte V.",
  role: "Athlete",
  avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  quote:
    "Judo has become something I really look forward to every week. The training pushes me to improve, and I've learned a lot about discipline, confidence and believing in myself.",
},
];

export default function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = testimonials[activeIndex];

  const showPrevious = () =>
    setActiveIndex((index) => (index - 1 + testimonials.length) % testimonials.length);

  const showNext = () =>
    setActiveIndex((index) => (index + 1) % testimonials.length);

  return (
    <section className="testimonials">
      <Reveal className="testimonial-card" key={activeIndex}>
        <span className="testimonial-quote-mark">&ldquo;</span>

        <div className="testimonial-body">
          <img
            className="testimonial-avatar"
            src={current.avatar}
            alt={`Illustrative portrait for ${current.name}`}
            loading="lazy"
            decoding="async"
          />
          <div>
            <h3>{current.name}</h3>
            <p className="testimonial-role">{current.role}</p>
          </div>
        </div>

        <p className="testimonial-text">{current.quote}</p>

        <div className="testimonial-controls">
          <button onClick={showPrevious} aria-label="Previous testimonial">&larr;</button>
          <button onClick={showNext} aria-label="Next testimonial">&rarr;</button>
        </div>
      </Reveal>
    </section>
  );
}
