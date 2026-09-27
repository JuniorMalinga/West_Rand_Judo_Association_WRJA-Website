import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import wrjaLogo from "../assets/images/Logo/wrja-logo.png";
import instructors from "../data/instructors";
import { useAuth } from "../context/AuthContext";

// Total time the "Welcome, {name}" message spends center-stage before
// settling in beside the logout button. Must match the CSS animation.
const LOGIN_TRANSITION_DURATION = 3800;

export default function NavigationBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Track whether the user has scrolled down the page.
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const previousScrollY = useRef(0);

  const location = useLocation();

  const {
    user,
    displayName,
    isAdmin,
    signOut,
    loginTransitionId,
  } = useAuth();

  const [showLoginWelcome, setShowLoginWelcome] = useState(false);

  // Determine whether we are currently on the homepage.
  // The transparent/overlay navbar is only used on the homepage.
  const isHomePage = location.pathname === "/";

  // Detect scrolling so the homepage navbar can change
  // from transparent to the normal dark navbar.
  useEffect(() => {
    // If we are not on the homepage, the navbar should remain
    // in its normal dark state.
    if (!isHomePage) {
      setIsScrolled(true);
      return undefined;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingUp = currentScrollY < previousScrollY.current;
      setIsScrolled(currentScrollY > 50);
      setIsNavVisible(currentScrollY < 72 || scrollingUp);
      previousScrollY.current = currentScrollY;
    };
    const handlePointerMove = (event) => {
      if (event.clientY < 90) setIsNavVisible(true);
    };

    // Set the correct initial state when entering the homepage.
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handlePointerMove);

    // Clean up the event listener when the component unmounts
    // or the route changes.
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handlePointerMove);
    };
  }, [isHomePage]);

  // Existing post-login welcome animation.
  useEffect(() => {
    if (!loginTransitionId) return undefined;

    setShowLoginWelcome(true);

    const timer = window.setTimeout(
      () => setShowLoginWelcome(false),
      LOGIN_TRANSITION_DURATION
    );

    return () => window.clearTimeout(timer);
  }, [loginTransitionId]);

  return (
    <header
      // home-navigation is added on the homepage.
      // navbar-scrolled is added after the user scrolls.
      className={`navigation-bar ${
        isHomePage ? "home-navigation" : ""
      } ${isScrolled ? "navbar-scrolled" : ""} ${
        isHomePage && !isNavVisible ? "navbar-hidden" : ""
      }`}
    >
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-badge">
            <img
              src={wrjaLogo}
              alt="West Rand Judo Association"
              className="nav-logo-image"
            />
          </span>
        </Link>

        <nav
          className={`nav-links ${
            menuOpen ? "nav-links-open" : ""
          } ${
            showLoginWelcome
              ? "nav-links-login-transition"
              : ""
          }`}
        >
          {!isAdmin && <Link to="/">Home</Link>}

          {!isAdmin && (
            <div className="nav-dropdown">
              <span className="nav-dropdown-trigger">
                Pages
              </span>

              <div className="nav-dropdown-menu">
                <Link to="/about">About</Link>
                <Link to="/gallery">Gallery</Link>
                <Link to="/faq">FAQ</Link>

                <div className="nav-dropdown-item nav-has-flyout">
                  <span>Instructors</span>

                  <div className="nav-flyout-menu">
                    {instructors.map((instructor) => (
                      <Link
                        key={instructor.slug}
                        to={`/instructors/${instructor.slug}`}
                      >
                        {instructor.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events and member tools are gated behind login. */}
          {user && !isAdmin && (
            <Link to="/events">Events</Link>
          )}

          {!isAdmin && (
            <Link to="/competitions">Competitions</Link>
          )}

          {!isAdmin && (
            <Link to="/news">News</Link>
          )}

          {user && !isAdmin && (
            <Link to="/booking">Book</Link>
          )}

          {user && !isAdmin && (
            <Link to="/dashboard">My home</Link>
          )}

          {!isAdmin && (
            <Link to="/contact">Contact</Link>
          )}

          {isAdmin && (
            <Link to="/admin">Admin panel</Link>
          )}
        </nav>

        {showLoginWelcome && (
          <div
            className="nav-login-welcome"
            aria-live="polite"
          >
            Welcome, {displayName}
          </div>
        )}

        <div
          className={`nav-auth ${
            menuOpen ? "nav-auth-open" : ""
          } ${
            showLoginWelcome
              ? "nav-auth-login-transition"
              : ""
          }`}
        >
          {user ? (
            <>
              <span className="nav-welcome">
                Welcome, {displayName}
              </span>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={signOut}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-ghost"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="btn btn-accent"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() =>
            setMenuOpen((open) => !open)
          }
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
