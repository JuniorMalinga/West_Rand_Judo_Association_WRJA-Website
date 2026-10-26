import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import SiteFooter from "./components/SiteFooter";
import HomePage from "./pages/HomePage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import BackToTopButton from "./components/BackToTopButton";
import CookieNotice from "./components/CookieNotice";
import SessionIdlePrompt from "./components/SessionIdlePrompt";
import WRJABuddy from "./wrja-buddy/WRJABuddy";
import { DEFAULT_SPRITES } from "./wrja-buddy/spriteManifest";
import { useBuddyTour } from "./wrja-buddy/useBuddyTour";

const loadCompetitionDetailPage = () => import("./pages/CompetitionDetailPage");
const loadNewsDetailPage = () => import("./pages/NewsDetailPage");
const loadAboutPage = () => import("./pages/AboutPage");
const loadEventsPage = () => import("./pages/EventsPage");
const loadGalleryPage = () => import("./pages/GalleryPage");
const loadNewsPage = () => import("./pages/NewsPage");
const loadContactPage = () => import("./pages/ContactPage");
const loadLoginPage = () => import("./pages/LoginPage");
const loadPasswordRecoveryPages = () => import("./pages/PasswordRecoveryPages");
const loadSignupPage = () => import("./pages/SignupPage");
const loadAdminPage = () => import("./pages/AdminPage");
const loadNotFoundPage = () => import("./pages/NotFoundPage");
const loadFaqPage = () => import("./pages/FAQPage");
const loadInstructorDetailPage = () => import("./pages/InstructorDetailPage");
const loadEventDetailPage = () => import("./pages/EventDetailPage");
const loadCompetitionPaymentPage = () => import("./pages/CompetitionPaymentPage");
const loadProofOfPaymentPage = () => import("./pages/ProofOfPaymentPage");
const loadProfilePage = () => import("./pages/ProfilePage");
const loadPoliciesPage = () => import("./pages/PoliciesPage");

const CompetitionDetailPage = lazy(loadCompetitionDetailPage);
const NewsDetailPage = lazy(loadNewsDetailPage);
const AboutPage = lazy(loadAboutPage);
const EventsPage = lazy(loadEventsPage);
const GalleryPage = lazy(loadGalleryPage);
const NewsPage = lazy(loadNewsPage);
const ContactPage = lazy(loadContactPage);
const LoginPage = lazy(loadLoginPage);
const ForgotPasswordPage = lazy(() => loadPasswordRecoveryPages().then((module) => ({ default: module.ForgotPasswordPage })));
const SignupPage = lazy(loadSignupPage);
const AdminPage = lazy(loadAdminPage);
const NotFoundPage = lazy(loadNotFoundPage);
const FAQPage = lazy(loadFaqPage);
const InstructorDetailPage = lazy(loadInstructorDetailPage);
const EventDetailPage = lazy(loadEventDetailPage);
const CompetitionPaymentPage = lazy(loadCompetitionPaymentPage);
const ProofOfPaymentPage = lazy(loadProofOfPaymentPage);
const ProfilePage = lazy(loadProfilePage);
const ChatWidget = lazy(() => import("./components/ChatWidget"));
const PrivacyPage = lazy(() => loadPoliciesPage().then((module) => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => loadPoliciesPage().then((module) => ({ default: module.TermsPage })));
const AccessibilityPage = lazy(() => loadPoliciesPage().then((module) => ({ default: module.AccessibilityPage })));
const SecurityPage = lazy(() => loadPoliciesPage().then((module) => ({ default: module.SecurityPage })));

const routePreloaders = [
  [/^\/about(?:\/|$)|^\/instructors$/, loadAboutPage],
  [/^\/gallery(?:\/|$)/, loadGalleryPage],
  [/^\/faq$/, loadFaqPage],
  [/^\/instructors\/.+/, loadInstructorDetailPage],
  [/^\/news$/, loadNewsPage],
  [/^\/news\/.+/, loadNewsDetailPage],
  [/^\/contact$/, loadContactPage],
  [/^\/signup$/, loadSignupPage],
  [/^\/login$/, loadLoginPage],
  [/^\/forgot-password$/, loadPasswordRecoveryPages],
  [/^\/events\/competitions\/[^/]+\/payment$/, loadCompetitionPaymentPage],
  [/^\/events\/competitions\/[^/]+$/, loadCompetitionDetailPage],
  [/^\/events\/(?:standard|calendar|competitions|schools|store)$/, loadEventsPage],
  [/^\/events\/[^/]+$/, loadEventDetailPage],
  [/^\/events(?:\/|$)/, loadEventsPage],
  [/^\/profile$/, loadProfilePage],
  [/^\/privacy$|^\/terms$|^\/accessibility$|^\/security$/, loadPoliciesPage],
  [/^\/admin$/, loadAdminPage],
  [/^\/proof-of-payment$/, loadProofOfPaymentPage],
];

const preloadedRoutes = new Map();

function preloadRoute(pathname) {
  const entry = routePreloaders.find(([pattern]) => pattern.test(pathname));
  if (!entry || preloadedRoutes.has(entry[1])) return;

  const [pattern, loadPage] = entry;
  const request = loadPage();
  preloadedRoutes.set(loadPage, request);
  request.catch((error) => {
    preloadedRoutes.delete(loadPage);
    console.error(`Unable to preload route ${pattern}:`, error);
  });
}

function PageLoading() {
  return (
    <div className="app-loading" role="status" aria-busy="true">
      <span />
      <p>Loading WRJA…</p>
    </div>
  );
}

function AuthRedirect({ location, onUnauthenticated }) {
  useEffect(() => {
    onUnauthenticated?.(location.pathname);
  }, [location.pathname, onUnauthenticated]);
  return <Navigate to="/login" replace state={{ from: location, buddyReturn: true }} />;
}

// The server remains the source of truth. This guard simply preserves the Buddy's
// in-progress tour before React redirects an unauthenticated visitor to sign in.
function RequireAuth({ children, onUnauthenticated }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoading />;
  return user ? children : <AuthRedirect location={location} onUnauthenticated={onUnauthenticated} />;
}

function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <PageLoading />;
  return isAdmin ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { pathname } = useLocation();
  const tour = useBuddyTour();
  const {
    buddyOpen,
    buddyAnimation,
    buddyAnimationKey,
    buddyMessage,
    tourTarget,
    actionButtons,
    start,
    handleBuddyAdvance,
    closeBuddy,
    skipBuddy,
    pauseForAuthentication,
  } = tour;
  const guard = (page) => <RequireAuth onUnauthenticated={pauseForAuthentication}>{page}</RequireAuth>;

  useEffect(() => {
    const preloadFromLink = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!link) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin === window.location.origin) preloadRoute(url.pathname);
    };
    document.addEventListener("pointerover", preloadFromLink, { passive: true });
    document.addEventListener("pointerdown", preloadFromLink, { passive: true });
    document.addEventListener("focusin", preloadFromLink);
    return () => {
      document.removeEventListener("pointerover", preloadFromLink);
      document.removeEventListener("pointerdown", preloadFromLink);
      document.removeEventListener("focusin", preloadFromLink);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {pathname !== "/admin" && <NavigationBar />}
      <ScrollToTop />
      <Suspense fallback={<PageLoading />}>
        <div key={pathname} id="main-content" className="page-transition" tabIndex="-1">
          <Routes>
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/instructors" element={<AboutPage />} />
            <Route path="/events" element={guard(<EventsPage />)} />
            <Route path="/events/standard" element={guard(<EventsPage section="standard" />)} />
            <Route path="/events/calendar" element={guard(<EventsPage section="calendar" />)} />
            <Route path="/events/competitions" element={guard(<EventsPage section="competitions" />)} />
            <Route path="/events/competitions/:slug/payment" element={guard(<CompetitionPaymentPage />)} />
            <Route path="/events/competitions/:slug" element={guard(<CompetitionDetailPage />)} />
            <Route path="/events/schools" element={guard(<EventsPage section="schools" />)} />
            <Route path="/events/store" element={guard(<EventsPage section="store" />)} />
            <Route path="/events/:id" element={guard(<EventDetailPage />)} />
            <Route path="/programs" element={<Navigate to="/events/competitions" replace />} />
            <Route path="/programs/:slug" element={<Navigate to="/events/competitions" replace />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/accessibility" element={<AccessibilityPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/proof-of-payment" element={guard(<ProofOfPaymentPage />)} />
            <Route path="/profile" element={guard(<ProfilePage />)} />
            <Route path="/instructors/:slug" element={<InstructorDetailPage />} />
            <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          </Routes>
        </div>
      </Suspense>
      <CookieNotice />
      <SessionIdlePrompt />
      {pathname !== "/admin" && <SiteFooter />}

      <Suspense fallback={null}>
        {pathname !== "/admin" && pathname !== "/login" && (
          <ChatWidget onGuideRequest={start} />
        )}
      </Suspense>

      {pathname !== "/admin" && buddyOpen && (
        <WRJABuddy
          animation={buddyAnimation}
          animationKey={buddyAnimationKey}
          sprites={DEFAULT_SPRITES}
          size={84}
          message={buddyMessage}
          roaming={false}
          tourTarget={tourTarget}
          onBuddyClick={handleBuddyAdvance}
          actionButtons={actionButtons}
          onDismiss={closeBuddy}
          onSkip={skipBuddy}
        />
      )}
      {pathname !== "/admin" && pathname !== "/login" && <BackToTopButton />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
