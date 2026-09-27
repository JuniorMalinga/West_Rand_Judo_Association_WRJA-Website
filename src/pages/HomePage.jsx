import { useLocation } from "react-router-dom";
import HomePageImageSlider from "../components/HomePageImageSlider";
import CompetitionsSection from "../components/CompetitionsSection";
import AboutSection from "../components/AboutSection";
import FeaturesSection from "../components/FeaturesSection";
import TrainersSection from "../components/TrainersSection";
import NewsSection from "../components/NewsSection";
import TestimonialSection from "../components/TestimonialSection";
import LocationSection from "../components/LocationSection";

export default function HomePage() {
  const location = useLocation();
  const justLoggedIn = Boolean(location.state?.justLoggedIn);

  return (
    <div className={`home-page ${justLoggedIn ? "home-page-login-entrance" : ""}`}>
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
