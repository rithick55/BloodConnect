import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Login from "./pages/Login";
import ReceiverLogin from "./pages/ReceiverLogin";
import ReceiverRegister from "./pages/ReceiverRegister";
import DonorLogin from "./pages/DonorLogin";
import DonorRegister from "./pages/DonorRegister";
import AdminLogin from "./pages/AdminLogin";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import NearbyDonors from "./pages/NearbyDonors";
import DonorDashboard from "./pages/DonorDashboard";
import BloodRequest from "./pages/BloodRequest";
import Chat from "./pages/Chat";
import Chats from "./pages/Chats";
import CallDonor from "./pages/CallDonor";
import Leaderboard from "./pages/Leaderboard";
import DonorProfile from "./pages/DonorProfile";
import ReceiverProfile from "./pages/ReceiverProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDonors from "./pages/AdminDonors";
import AdminReceivers from "./pages/AdminReceivers";
import AdminBloodRequests from "./pages/AdminBloodRequests";
import ForgotPassword from "./pages/ForgotPassword";

function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-label">BLOOD DONOR NETWORK</span>
          <h1>Every drop can<span> save a life.</span></h1>
          <p>Find nearby blood donors quickly and connect with people who can help when it matters most.</p>
          <div className="hero-actions">
            <Link to="/receiver-login" className="primary-button">I Need Blood</Link>
            <Link to="/donor-login" className="secondary-button">Become a Donor</Link>
            <Link to="/leaderboard" className="nav-login">Leaderboard</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="blood-circle"><span>🩸</span></div>
          <div className="floating-card card-one"><strong>Nearby Donor</strong><small>Available now</small></div>
          <div className="floating-card card-two"><strong>Emergency</strong><small>Help is closer</small></div>
        </div>
      </section>
    </main>
  );
}

function ProtectedRoute({ role, children }) {
  const { session } = useApp();
  const location = useLocation();

  // Admin authentication
  if (role === "admin") {
    const admin = localStorage.getItem("bloodconnectAdmin");

    if (!admin) {
      return (
        <Navigate
          to="/admin-login"
          replace
          state={{ from: location.pathname }}
        />
      );
    }

    return children;
  }

  // Donor / Receiver authentication
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (role && session.role !== role) {
    return (
      <Navigate
        to={
          session.role === "donor"
            ? "/donor-dashboard"
            : session.role === "receiver"
              ? "/receiver-dashboard"
              : "/admin-dashboard"
        }
        replace
      />
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="logo"><span className="logo-icon">🩸</span>BloodConnect</Link>
        <div className="nav-right"><Link to="/login" className="nav-login">Login</Link></div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/receiver-login" element={<ReceiverLogin />} />
        <Route path="/receiver-register" element={<ReceiverRegister />} />
        <Route path="/donor-login" element={<DonorLogin />} />
        <Route path="/donor-register" element={<DonorRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route path="/receiver-dashboard" element={<ProtectedRoute role="receiver"><ReceiverDashboard /></ProtectedRoute>} />
        <Route path="/nearby-donors" element={<ProtectedRoute role="receiver"><NearbyDonors /></ProtectedRoute>} />
        <Route path="/receiver-profile" element={<ProtectedRoute role="receiver"><ReceiverProfile /></ProtectedRoute>} />

        <Route path="/donor-dashboard" element={<ProtectedRoute role="donor"><DonorDashboard /></ProtectedRoute>} />
        <Route path="/donor-profile" element={<ProtectedRoute role="donor"><DonorProfile /></ProtectedRoute>} />
        <Route path="/blood-request" element={<ProtectedRoute><BloodRequest /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
        <Route path="/call-donor" element={<ProtectedRoute><CallDonor /></ProtectedRoute>} />

        <Route path="/leaderboard" element={<Leaderboard />} />

        <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin-donors" element={<ProtectedRoute role="admin"><AdminDonors /></ProtectedRoute>} />
        <Route path="/admin-receivers" element={<ProtectedRoute role="admin"><AdminReceivers /></ProtectedRoute>} />
        <Route path="/admin-requests" element={<ProtectedRoute role="admin"><AdminBloodRequests /></ProtectedRoute>} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return <BrowserRouter><AppProvider><AppRoutes /></AppProvider></BrowserRouter>;
}

export default App;
