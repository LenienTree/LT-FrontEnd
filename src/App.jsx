import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home/Home";
import AboutNew from "./components/AboutNew";
import InternshipPopup from "./components/user/InternshipPopup";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import { useAuth } from "./context/AuthContext";

// Heavy pages are lazy-loaded so they are excluded from the initial JS bundle.
// Each import() creates its own async chunk that is only fetched when the user
// navigates to that route for the first time.
const TeamHalfCircle   = lazy(() => import("./components/TeamHalfCircle"));
const AuthModal        = lazy(() => import("./components/user/auth/AuthModal"));
const Profile          = lazy(() => import("./components/user/Profile"));
const CalenderPage     = lazy(() => import("./pages/calender"));
const OrganizeEvent    = lazy(() => import("./components/organizer/OrganizeEvent"));
const EditEventPage    = lazy(() => import("./components/organizer/EditEventPage"));
const EventDetails     = lazy(() => import("./components/EventDetails"));
const Admin            = lazy(() => import("./components/admin/Admin"));
const EventRegistration = lazy(() => import("./components/EventRegistration"));

// Minimal spinner shown while a lazy chunk is loading
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#022F2E] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#9AE600] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Redirect component that opens the modal and navigates to home
function AuthRedirect({ view }) {
  const { openAuthModal } = useAuth();
  React.useEffect(() => {
    openAuthModal(view);
  }, [openAuthModal, view]);
  return <Navigate to="/" replace />;
}

// Guard: only approved organizers and admins can access /organize
function OrganizerRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isOrganizer && user?.role !== 'ADMIN') return <Navigate to="/profile" replace />;
  return children;
}

// Guard: only admins can access /admin
function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="text-white font-urbanist overflow-x-hidden">
      <Suspense fallback={<PageLoader />}>
        <AuthModal />
        <InternshipPopup />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthRedirect view="login" />} />
          <Route path="/signup" element={<AuthRedirect view="signup" />} />
          <Route path="/about" element={<AboutNew />} />
          <Route path="/test" element={<AboutNew />} />
          <Route path="/test1" element={<TeamHalfCircle />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/calender" element={<CalenderPage />} />
          <Route path="/organize" element={<OrganizerRoute><OrganizeEvent /></OrganizerRoute>} />
          <Route path="/organize/edit/:id" element={<OrganizerRoute><EditEventPage /></OrganizerRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          {/* Event detail — supports both /event/:id and legacy /event?id=... */}
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/event" element={<EventDetails />} />
          <Route path="/event/:id/register" element={<EventRegistration />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
