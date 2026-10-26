import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import HomePageImageSlider from "../components/HomePageImageSlider";
import CompetitionsSection from "../components/CompetitionsSection";
import AboutSection from "../components/AboutSection";
import FeaturesSection from "../components/FeaturesSection";
import TrainersSection from "../components/TrainersSection";
import NewsSection from "../components/NewsSection";
import TestimonialSection from "../components/TestimonialSection";
import LocationSection from "../components/LocationSection";

const HOME_ENTRANCE_KEY = "wrja.home.entrance.played";
let hasPlayedHomeEntrance = false;

function shouldPlayHomeEntrance() {
  if (hasPlayedHomeEntrance) return false;

  try {
    if (window.sessionStorage.getItem(HOME_ENTRANCE_KEY)) {
      hasPlayedHomeEntrance = true;
      return false;
    }
  } catch {
    // The in-memory flag still prevents replay if storage is unavailable.
  }

  return true;
}

export default function HomePage() {
  const location = useLocation();
  const justLoggedIn = Boolean(location.state?.justLoggedIn);
  const [playEntrance] = useState(shouldPlayHomeEntrance);

  useEffect(() => {
    if (!playEntrance) return;
    hasPlayedHomeEntrance = true;
    try {
      window.sessionStorage.setItem(HOME_ENTRANCE_KEY, "true");
    } catch {
      // The in-memory flag still prevents replay if storage is unavailable.
    }
  }, [playEntrance]);

  return (
    <div className={`home-page ${playEntrance ? "home-page-first-entrance" : ""} ${justLoggedIn ? "home-page-login-entrance" : ""}`}>
      <HomePageImageSlider />
      <CompetitionsSection />
      <AboutSection />
      <FeaturesSection />
      <TrainersSection />
      <NewsSection />
      <TestimonialSection />
      <LocationSection />
    </div>
  );
}
