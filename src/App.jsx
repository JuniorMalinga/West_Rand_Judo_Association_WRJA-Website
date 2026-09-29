import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import SiteFooter from "./components/SiteFooter";
import CompetitionDetailPage from "./pages/CompetitionDetailPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import EventsPage from "./pages/EventsPage";
import GalleryPage from "./pages/GalleryPage";
import NewsPage from "./pages/NewsPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminPage from "./pages/AdminPage";
import ChatWidget from "./components/ChatWidget";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import BackToTopButton from "./components/BackToTopButton";
import NotFoundPage from "./pages/NotFoundPage";
import FAQPage from "./pages/FAQPage";
import InstructorDetailPage from "./pages/InstructorDetailPage";
import EventDetailPage from "./pages/EventDetailPage";
import CompetitionPaymentPage from "./pages/CompetitionPaymentPage";
import ProofOfPaymentPage from "./pages/ProofOfPaymentPage";

function AdminExperienceGuard({ children }) {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  return isAdmin && pathname !== "/admin" ? <Navigate to="/admin" replace /> : children;
}

// Route guards. These are for a smooth experience only – the server is what
// actually refuses data to people who aren't allowed it.
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { pathname } = useLocation();
  const { loading } = useAuth();

  // Wait for the server to say who (if anyone) is logged in, so a member never
  // sees a flash of the logged-out site or gets bounced to /login by mistake.
  if (loading) return <div className="app-loading" role="status" aria-busy="true"><span /><p>Loading WRJA…</p></div>;

  return (
    <>
      {pathname !== "/admin" && <NavigationBar />}
      <ScrollToTop />
      <AdminExperienceGuard>
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
      </AdminExperienceGuard>
      {pathname !== "/admin" && <SiteFooter />}
      {pathname !== "/admin" && pathname !== "/login" && <ChatWidget />}
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
