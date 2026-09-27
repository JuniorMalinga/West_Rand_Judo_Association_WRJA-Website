import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import SiteFooter from "./components/SiteFooter";
import CompetitionDetailPage from "./pages/CompetitionDetailPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import EventsPage from "./pages/EventsPage";
import CompetitionsPage from "./pages/CompetitionsPage";
import GalleryPage from "./pages/GalleryPage";
import NewsPage from "./pages/NewsPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminPage from "./pages/AdminPage";
import BookingPage from "./pages/BookingPage";
import ChatWidget from "./components/ChatWidget";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import BackToTopButton from "./components/BackToTopButton";
import NotFoundPage from "./pages/NotFoundPage";
import FAQPage from "./pages/FAQPage";
import InstructorDetailPage from "./pages/InstructorDetailPage";
import EventDetailPage from "./pages/EventDetailPage";
import DashboardPage from "./pages/DashboardPage";
import ProofOfPaymentPage from "./pages/ProofOfPaymentPage";

function AdminExperienceGuard({ children }) {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  return isAdmin && pathname !== "/admin" ? <Navigate to="/admin" replace /> : children;
}

function AppContent() {
  const { pathname } = useLocation();
  const isLoginRoute = pathname === "/login";

  return (
    <>
      {!isLoginRoute && <NavigationBar />}
      <ScrollToTop />
      <AdminExperienceGuard>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/calendar" element={<EventsPage section="calendar" />} />
          <Route path="/events/competitions" element={<EventsPage section="competitions" />} />
          <Route path="/events/schools" element={<EventsPage section="schools" />} />
          <Route path="/events/store" element={<EventsPage section="store" />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/programs" element={<Navigate to="/competitions" replace />} />
          <Route path="/programs/:slug" element={<Navigate to="/competitions" replace />} />
          <Route path="/competitions" element={<CompetitionsPage />} />
          <Route path="/competitions/:slug" element={<CompetitionDetailPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/proof-of-payment" element={<ProofOfPaymentPage />} />
          <Route path="/instructors/:slug" element={<InstructorDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AdminExperienceGuard>
      {!isLoginRoute && pathname !== "/admin" && <SiteFooter />}
      {!isLoginRoute && <ChatWidget />}
      {!isLoginRoute && <BackToTopButton />}
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
