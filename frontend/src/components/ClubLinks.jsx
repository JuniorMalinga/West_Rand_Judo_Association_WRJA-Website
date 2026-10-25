import Reveal from "./Reveal";

// Real affiliated club links, from WRJA_WEB_DETAILS.docx.
const clubs = [
  {
    name: "Golden Score Judo",
    links: [
      { label: "Website", url: "https://goldenscore.co.za" },
      { label: "Facebook", url: "https://www.facebook.com/share/1EZG7JfbEX/" },
      { label: "Instagram", url: "https://www.instagram.com/goldenscorejudo" },
    ],
  },
  {
    name: "KJK Judo Club",
    links: [
      { label: "Website", url: "https://www.kjkjudo.co.za" },
      { label: "Facebook", url: "https://www.facebook.com/share/g/19C3Qq9izs/" },
      { label: "Instagram", url: "https://www.instagram.com/judo_kjk" },
    ],
  },
  {
    name: "West Rand Judo Association",
    links: [
      { label: "Facebook", url: "https://www.facebook.com/share/1DgzXXuN9M/" },
    ],
  },
];

export default function ClubLinks() {
  return (
    <section className="club-links">
      <Reveal className="club-links-header">
        <h2>Follow our clubs</h2>
        <p>
          Stay connected with our affiliated clubs for the latest news, competition
          results, grading information, training schedules, and achievements.
        </p>
      </Reveal>

      <div className="club-links-grid">
        {clubs.map((club, index) => (
          <Reveal key={club.name} delay={index * 120} className="club-card">
            <h3>{club.name}</h3>
            <div className="club-card-links">
              {club.links.map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}