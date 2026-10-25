import { Link } from "react-router-dom";
import Reveal from "../components/Reveal"; 
import NotFound from "../assets/images/background/1125553-2560x1600-desktop-hd-combat-sports-wallpaper.jpg";

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <Reveal className="not-found-text">
          <h1 className="not-found-code">
            4<span className="not-found-zero">0<span>Ooops!</span></span>4
          </h1>
          <p className="not-found-message">Sorry, page not found!</p>
          <Link to="/" className="btn btn-accent btn-lg">Back to homepage</Link>
        </Reveal>

        <div
          className="not-found-image"
          style={{ backgroundImage: `url(${NotFound})` }}
        />
      </div>
    </div>
  );
}