import Reveal from "./Reveal";

import clockIcon from "../assets/images/icons/clock.jpeg";
import pencilIcon from "../assets/images/icons/pencil.jpeg";
import equipmentIcon from "../assets/images/icons/equipment.jpeg";
import nutritionIcon from "../assets/images/icons/nutrition.jpeg";
import coachIcon from "../assets/images/icons/coach.jpeg";
import trophyIcon from "../assets/images/icons/trophy.jpeg";

const features = [
  {
    title: "Convenient times",
    description:
      "Weekday evening and weekend sessions to fit around school and work schedules.",
    icon: clockIcon,
  },
  {
    title: "Grading pathway",
    description:
      "A clear belt progression system with regular grading opportunities.",
    icon: pencilIcon,
  },
  {
    title: "Quality equipment",
    description:
      "Well-maintained mats and gis available for training sessions.",
    icon: equipmentIcon,
  },
  {
    title: "Guided nutrition",
    description:
      "Basic nutrition guidance to support training and weight categories.",
    icon: nutritionIcon,
  },
  {
    title: "Certified coaches",
    description:
      "Instructors with national coaching certification and years of experience.",
    icon: coachIcon,
  },
  {
    title: "Club champions",
    description:
      "A strong track record of provincial and national competition results.",
    icon: trophyIcon,
  },
];

export default function FeaturesSection() {
  return (
    <section className="features">
      <div className="features-content">
        <Reveal className="features-header" variant="clip">
          <h2>
            Our <span className="text-accent">features</span>
          </h2>

          <p>What you can expect training with WRJA</p>
        </Reveal>

        <div className="features-grid">
          {features.map((feature, index) => (
            <Reveal
              key={feature.title}
              delay={index * 80}
              className={`feature-item feature-item-${index + 1}`}
              variant="pop"
            >
              <div className="feature-heading">
                <div className="feature-icon" aria-hidden="true">
                  <img src={feature.icon} alt="" loading="lazy" decoding="async" />
                </div>

                <h3>{feature.title}</h3>
              </div>

              <p>{feature.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}