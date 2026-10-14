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
import { useBuddyActivation } from "./wrja-buddy/useBuddyActivation";
import { useBuddyTour } from "./wrja-buddy/useBuddyTour";

const CompetitionDetailPage = lazy(() => import("./pages/CompetitionDetailPage"));
const NewsDetailPage = lazy(() => import("./pages/NewsDetailPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const InstructorDetailPage = lazy(() => import("./pages/InstructorDetailPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const CompetitionPaymentPage = lazy(() => import("./pages/CompetitionPaymentPage"));
const ProofOfPaymentPage = lazy(() => import("./pages/ProofOfPaymentPage"));
const ChatWidget = lazy(() => import("./components/ChatWidget"));

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
  const { registerLauncherClick } = useBuddyActivation(start);
  const handleChatLauncherClick = () => registerLauncherClick();
  const guard = (page) => <RequireAuth onUnauthenticated={pauseForAuthentication}>{page}</RequireAuth>;

  return (
    <>
      {pathname !== "/admin" && <NavigationBar />}
      <ScrollToTop />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/proof-of-payment" element={guard(<ProofOfPaymentPage />)} />
          <Route path="/instructors/:slug" element={<InstructorDetailPage />} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        </Routes>
      </Suspense>
      <CookieNotice />
      <SessionIdlePrompt />
      {pathname !== "/admin" && <SiteFooter />}

      <Suspense fallback={null}>
        {pathname !== "/admin" && pathname !== "/login" && (
          <ChatWidget onLauncherClick={handleChatLauncherClick} onGuideRequest={start} />
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
