import Reveal from "./Reveal";
import WRJACommittee from "../assets/images/team/image 79.jpg";

export default function AboutSection() {
  return (
    <section id="about" className="about">
      <Reveal className="about-image-wrap">
        <img
          src={WRJACommittee}
          alt="Placeholder of a judo athlete"
          className="about-image"
        />
      </Reveal>

      <Reveal delay={150} className="about-content">
        <span className="about-quote-mark">&ldquo;</span>
        <h2>About West Rand Judo Association</h2>
        <p className="about-lead">Building character on and off the mat</p>
        <p className="about-body">
          West Rand Judo Association has grown into a close-knit community
          of athletes, parents, and coaches united by a shared respect for
          the sport. Our competitions balance competitive development with the
          discipline and humility that judo is built on.
        </p>
        <div className="about-signature">
          <div>
            <p className="about-name">Committee chairperson</p>
            <p className="about-role">WRJA Committee</p>
          </div>
          <span className="about-signature-mark">Signature</span> 
        </div>
      </Reveal>
    </section>
  );
}

