import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { getPublishedNewsPosts } from "../services/newsService";
import fallbackImage from "../assets/images/News/IsabellaandGabriell_27891-780x470.jpg";

export default function NewsSection() {
  const [newsPosts, setNewsPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      try {
        setLoading(true);
        setError("");
        const result = await getPublishedNewsPosts();
        if (isMounted) {
          // Display a small homepage subset (first 3 published posts)
          setNewsPosts(result.slice(0, 3));
        }
      } catch (err) {
        console.error("Could not load homepage news:", err);
        if (isMounted) {
          setError("News could not be loaded right now.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadNews();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="news">
      <Reveal className="news-header">
        <h2>Recent news</h2>
        <p>Announcements, results, and club highlights</p>
      </Reveal>

      {loading && <p className="simple-page">Loading news...</p>}
      {error && <p className="simple-page">{error}</p>}

      {!loading && !error && newsPosts.length === 0 && (
        <p className="simple-page">No news has been published yet.</p>
      )}

      {!loading && !error && newsPosts.length > 0 && (
        <div className="news-grid">
          {newsPosts.map((item, index) => (
            <Reveal key={item.id} delay={index * 100}>
              <Link
                to={`/news/${item.id}`}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <article className="news-card">
                  <img
                    src={item.image || fallbackImage}
                    alt={item.title}
                    className="news-card-image"
                  />

                  <p className="news-date">{item.date}</p>

                  <h3 className="news-title">{item.title}</h3>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}