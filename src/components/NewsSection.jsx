import Reveal from "./Reveal";

// FIX: Import the shared news data instead of maintaining
// a separate newsItems array in this component.
import { newsStore } from "../data/newsPosts";
import useCollection from "../hooks/useCollection";

export default function NewsSection() {
  const newsPosts = useCollection(newsStore).slice(0, 4);
  return (
    <section className="news">
      <Reveal className="news-header">
        <h2>Recent news</h2>
        <p>Announcements, results, and club highlights</p>
      </Reveal>

      <div className="news-grid">
        {newsPosts.map((item, index) => (
          <Reveal key={item.id} delay={index * 100}>
            <article className="news-card">
              <img
                src={item.image}
                alt={item.title}
                className="news-card-image"
              />

              <p className="news-date">{item.date}</p>

              <h3 className="news-title">{item.title}</h3>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}