import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import SiteFooter from "./components/SiteFooter";
import HomePage from "./pages/HomePage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import BackToTopButton from "./components/BackToTopButton";

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

function AdminExperienceGuard({ children }) {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  return isAdmin && pathname !== "/admin" ? <Navigate to="/admin" replace /> : children;
}

// Route guards. These are for a smooth experience only. The server is what
// actually refuses data to people who aren't allowed it.
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoading />;
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <PageLoading />;
  return isAdmin ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { pathname } = useLocation();

  return (
    <>
      {pathname !== "/admin" && <NavigationBar />}
      <ScrollToTop />
      <AdminExperienceGuard>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/events" element={<RequireAuth><EventsPage /></RequireAuth>} />
            <Route path="/events/calendar" element={<RequireAuth><EventsPage section="calendar" /></RequireAuth>} />
            <Route path="/events/competitions" element={<RequireAuth><EventsPage section="competitions" /></RequireAuth>} />
            <Route path="/events/competitions/:slug/payment" element={<RequireAuth><CompetitionPaymentPage /></RequireAuth>} />
            <Route path="/events/competitions/:slug" element={<RequireAuth><CompetitionDetailPage /></RequireAuth>} />
            <Route path="/events/schools" element={<RequireAuth><EventsPage section="schools" /></RequireAuth>} />
            <Route path="/events/store" element={<RequireAuth><EventsPage section="store" /></RequireAuth>} />
            <Route path="/events/:id" element={<RequireAuth><EventDetailPage /></RequireAuth>} />
            <Route path="/programs" element={<Navigate to="/events/competitions" replace />} />
            <Route path="/programs/:slug" element={<Navigate to="/events/competitions" replace />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/proof-of-payment" element={<RequireAuth><ProofOfPaymentPage /></RequireAuth>} />
            <Route path="/instructors/:slug" element={<InstructorDetailPage />} />
            <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          </Routes>
        </Suspense>
      </AdminExperienceGuard>
      {pathname !== "/admin" && <SiteFooter />}
      <Suspense fallback={null}>
        {pathname !== "/admin" && pathname !== "/login" && <ChatWidget />}
      </Suspense>
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