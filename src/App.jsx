import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home/Home";
import AboutNew from "./components/AboutNew";
import TeamHalfCircle from "./components/TeamHalfCircle";
import AuthModal from "./components/user/auth/AuthModal";
import Profile from "./components/user/Profile";
import CalenderPage from "./pages/calender";
import OrganizeEvent from "./components/organizer/OrganizeEvent";
import EditEventPage from "./components/organizer/EditEventPage";
import EventDetails from "./components/EventDetails";
import Admin from "./components/admin/Admin";
import EventRegistration from "./components/EventRegistration";
import { useAuth } from "./context/AuthContext";

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
      <AuthModal />
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
      </Routes>
    </div>
  );
}

export default App;
