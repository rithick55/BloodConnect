import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentRequests, setRecentRequests] = useState([]);


  useEffect(() => {
    const admin = localStorage.getItem("bloodconnectAdmin");

    if (!admin) {
      navigate("/admin-login", { replace: true });
    }
  }, [navigate]);

  const loadRecentRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:8090/api/admin/requests"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load recent requests."
        );
      }

      const sortedRequests = [...data]
        .sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )
        .slice(0, 4);

      setRecentRequests(sortedRequests);
    } catch (error) {
      console.error(
        "Unable to load recent requests:",
        error
      );
    }
  };
  
  const loadStats = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await fetch(
      "http://localhost:8090/api/admin/stats"
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load admin statistics."
      );
    }

    setStats(data);
  } catch (error) {
    console.error("Unable to load admin statistics:", error);
    setError(
      error.message || "Unable to load admin statistics."
    );
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadStats();
  loadRecentRequests();
}, []);

const handleRefresh = async () => {
  await Promise.all([
    loadStats(),
    loadRecentRequests(),
  ]);
};

  const dashboardStats = [
    {
      title: "Total Donors",
      value: stats?.totalDonors ?? 0,
      icon: "🩸",
      description: "Registered donors",
    },
    {
      title: "Total Receivers",
      value: stats?.totalReceivers ?? 0,
      icon: "👥",
      description: "Registered receivers",
    },
    {
      title: "Blood Requests",
      value: stats?.totalRequests ?? 0,
      icon: "📋",
      description: "Total requests",
    },
    {
      title: "Emergency Requests",
      value: stats?.emergencyRequests ?? 0,
      icon: "🚨",
      description: "Need urgent attention",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("bloodconnectAdmin");
    logout();
    navigate("/admin-login", { replace: true });
  };

  return (
    <main className="admin-dashboard">

      {/* Header */}

      <header className="admin-header">

        <div>
          <span className="hero-label">
            BLOODCONNECT ADMIN
          </span>

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Monitor and manage the BloodConnect platform.
          </p>
        </div>

        <div className="admin-header-actions">

  <button
    className="admin-refresh"
    onClick={handleRefresh}
    disabled={loading}
  >
    🔄 {loading ? "Refreshing..." : "Refresh"}
  </button>

  <button
    className="admin-logout"
    onClick={handleLogout}
  >
    🚪 Logout
  </button>

</div>
      </header>


      {/* Statistics */}
      {loading && (
        <p>Loading dashboard statistics...</p>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}

      <section className="admin-stats">

        {dashboardStats.map((stat) => (

          <article
            className="admin-stat-card"
            key={stat.title}
          >

            <div className="admin-stat-icon">
              {stat.icon}
            </div>

            <div>
              <span>
                {stat.title}
              </span>

              <h2>
                {stat.value}
              </h2>

              <p>
                {stat.description}
              </p>
            </div>

          </article>

        ))}

      </section>


      {/* Management */}

      <section className="admin-management">

        <div className="admin-section-heading">

          <div>
            <span className="hero-label">
              MANAGEMENT
            </span>

            <h2>
              Manage BloodConnect
            </h2>
          </div>

        </div>


        <div className="admin-management-grid">

          <button
            className="admin-management-card"
            onClick={() => navigate("/admin-donors")}
          >
            <span>🩸</span>

            <div>
              <h3>
                Manage Donors
              </h3>

              <p>
                View and manage registered blood donors.
              </p>
            </div>

            <strong>→</strong>
          </button>


          <button
            className="admin-management-card"
            onClick={() => navigate("/admin-receivers")}
          >
            <span>👥</span>

            <div>
              <h3>
                Manage Receivers
              </h3>

              <p>
                View registered receivers and their details.
              </p>
            </div>

            <strong>→</strong>
          </button>


          <button
            className="admin-management-card"
            onClick={() => navigate("/admin-requests")}
          >
            <span>📋</span>

            <div>
              <h3>
                Blood Requests
              </h3>

              <p>
                Monitor active and completed requests.
              </p>
            </div>

            <strong>→</strong>
          </button>


          <button
            className="admin-management-card"
            onClick={() => navigate("/leaderboard")}
          >
            <span>🏆</span>

            <div>
              <h3>
                Leaderboard
              </h3>

              <p>
                View donor rankings and contributions.
              </p>
            </div>

            <strong>→</strong>
          </button>

        </div>

      </section>


      {/* Recent Requests */}

      <section className="admin-requests">

        <div className="admin-section-heading">

          <div>
            <span className="hero-label">
              RECENT ACTIVITY
            </span>

            <h2>
              Recent Blood Requests
            </h2>
          </div>

          <button
            className="admin-view-all"
            onClick={() => navigate("/admin-requests")}
          >
            View All →
          </button>

        </div>


        <div className="admin-request-table">

          <div className="admin-table-header">
            <span>Patient</span>
            <span>Blood Group</span>
            <span>Hospital</span>
            <span>Location</span>
            <span>Status</span>
          </div>


          {recentRequests.map((request) => (

            <div
              className="admin-table-row"
              key={request.id}
            >

              <strong>
                {request.patientName}
              </strong>

              <span className="admin-blood">
                {request.bloodGroup}
              </span>

              <span>
                {request.hospitalName}
              </span>

              <span>
                📍 {request.district}
              </span>

              <span
                className={
                  request.status === "COMPLETED"
                    ? "admin-status completed"
                    : request.status === "CANCELLED"
                      ? "admin-status cancelled"
                      : request.urgent
                        ? "admin-status urgent"
                        : "admin-status active"
                }
              >
                {request.status === "COMPLETED"
                  ? "Completed"
                  : request.status === "CANCELLED"
                    ? "Cancelled"
                    : request.urgent
                      ? "Urgent"
                      : request.status}
              </span>
            </div>

          ))}

        </div>

      </section>


      {/* Platform Overview */}

      <section className="admin-overview">

        <div className="overview-card">

          <span>
            🟢
          </span>

          <div>
            <small>
              AVAILABLE DONORS
            </small>

            <h2>
              {stats?.availableDonors ?? 0}
            </h2>
          </div>

        </div>


        <div className="overview-card">



          <span>
            ❤️
          </span>

          <div>
            <small>
              LIVES HELPED
            </small>

            <h2>
              {stats?.completedRequests ?? 0}
            </h2>
          </div>

        </div>


        <div className="overview-card">

          <span>
            🏥
          </span>

          <div>
            <small>
              ACTIVE HOSPITALS
            </small>

            <h2>
              {stats?.activeRequests ?? 0}
            </h2>
          </div>

        </div>

      </section>

    </main>
  );
}

export default AdminDashboard;