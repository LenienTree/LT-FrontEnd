import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import AboutNew from "./components/AboutNew";
import TeamHalfCircle from "./components/TeamHalfCircle";
import Signup from "./components/user/auth/Signup";
import Login from "./components/user/auth/Login";
import Profile from "./components/user/Profile";
import CalenderPage from "./pages/calender";
import OrganizeEvent from "./components/organizer/OrganizeEvent";
import EventDetails from "./components/EventDetails";
import Admin from "./components/Admin";
import { useAuth } from "./context/AuthContext";

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<AboutNew />} />
        <Route path="/test" element={<AboutNew />} />
        <Route path="/test1" element={<TeamHalfCircle />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calender" element={<CalenderPage />} />
        <Route path="/organize" element={<OrganizerRoute><OrganizeEvent /></OrganizerRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        {/* Event detail — supports both /event/:id and legacy /event?id=... */}
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/event" element={<EventDetails />} />
      </Routes>
    </div>
  );
}

export default App;
