import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const API_URL = import.meta.env.VITE_API_URL;

function DonorDashboard() {
  const navigate = useNavigate();

  const {
    requests,
    loadActiveRequests,
    updateDonorAvailability,
    updateDonorLocation,
    logout,
    notifications,
    setNotifications,
  } = useApp();

  const [donor, setDonor] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [donorRank, setDonorRank] = useState(null);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsViewed, setNotificationsViewed] = useState(false);

  const previousNotificationSignature = useRef("");

  // =========================================================
  // DETECT NEW NOTIFICATIONS
  // =========================================================

  useEffect(() => {
    const signature = (notifications || [])
      .map(
        (notification) =>
          `${notification.requestId}-${notification.senderId}-${notification.createdAt}-${notification.message}`
      )
      .join("|");

    if (
      signature &&
      signature !== previousNotificationSignature.current &&
      notificationsViewed
    ) {
      setNotificationsViewed(false);
    }

    previousNotificationSignature.current = signature;
  }, [notifications, notificationsViewed]);

  // =========================================================
  // LOAD DONOR
  // =========================================================

  useEffect(() => {
    const savedUser = localStorage.getItem("bloodconnect_user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setDonor(user);
      } catch (error) {
        console.error(
          "Unable to read logged-in user:",
          error
        );
      }
    }
  }, []);

  // =========================================================
  // LOAD ACTIVE REQUESTS
  // =========================================================

  useEffect(() => {
    const loadRequests = async () => {
      try {
        await loadActiveRequests();
      } catch (error) {
        console.error(
          "Unable to load donor requests:",
          error
        );
      }
    };

    loadRequests();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // LOAD DONOR RANK
  // =========================================================

  useEffect(() => {
    const loadDonorRank = async () => {
      if (!donor?.id) return;

      try {
        const response = await fetch(
          `${API_URL}/admin/donors`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load donor ranking."
          );
        }

        const donors = await response.json();

        const rank =
          donors.findIndex(
            (item) => item.id === donor.id
          ) + 1;

        if (rank > 0) {
          setDonorRank(rank);
        }
      } catch (error) {
        console.error(
          "Unable to load donor rank:",
          error
        );
      }
    };

    loadDonorRank();
  }, [donor?.id]);

  // =========================================================
  // SESSION CHECK
  // =========================================================

  if (!donor) {
    return (
      <main className="auth-page">
        <div className="auth-card">

          <div className="auth-header">

            <span className="auth-icon">
              ❤️
            </span>

            <h1>
              Session Expired
            </h1>

            <p>
              Please login again to access your donor dashboard.
            </p>

          </div>

          <button
            className="auth-button"
            onClick={() =>
              navigate("/donor-login")
            }
          >
            Go to Login
          </button>

        </div>
      </main>
    );
  }

  // =========================================================
  // MATCHING REQUESTS
  // =========================================================

  const matchingRequests = requests.filter(
    (request) =>
      request.status === "active" &&
      request.bloodGroup === donor.bloodGroup
  );

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "bloodconnect_user"
    );

    logout();

    navigate("/login");
  };

  // =========================================================
  // NOTIFICATION HANDLERS
  // =========================================================

  const handleNotificationClick = () => {
    setShowNotifications(true);
    setNotificationsViewed(true);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
    setNotificationsViewed(true);
  };

  // =========================================================
  // UPDATE LOCATION
  // =========================================================

  const handleUpdateLocation = () => {
    if (locationLoading) return;

    setLocationLoading(true);
    setLocationMessage("");
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Location is not supported by your browser."
      );

      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        const updatedDonor = {
          ...donor,
          latitude,
          longitude,
        };

        setDonor(updatedDonor);

        localStorage.setItem(
          "bloodconnect_user",
          JSON.stringify(updatedDonor)
        );

        updateDonorLocation(
          latitude,
          longitude
        );

        setLocationMessage(
          "Your current location has been updated."
        );

        setLocationLoading(false);
      },
      () => {
        setError(
          "Unable to get your location. Please allow location access."
        );

        setLocationLoading(false);
      }
    );
  };

  // =========================================================
  // UPDATE AVAILABILITY
  // =========================================================

  const handleAvailability = async () => {
    if (availabilityLoading) return;

    const newAvailability =
      !donor.available;

    setAvailabilityLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/donors/${donor.id}/availability?available=${newAvailability}`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update availability."
        );
      }

      const updatedDonor = {
        ...donor,
        available: data.available,
      };

      setDonor(updatedDonor);

      localStorage.setItem(
        "bloodconnect_user",
        JSON.stringify(updatedDonor)
      );

      updateDonorAvailability(
        data.available
      );

    } catch (error) {
      console.error(
        "Availability update error:",
        error
      );

      setError(
        error.message ||
          "Unable to update availability. Please try again."
      );

    } finally {
      setAvailabilityLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="donor-dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="donor-dashboard-header">

        <div className="donor-header-content">

          <span className="hero-label">
            DONOR DASHBOARD
          </span>

          <h1>
            Welcome,{" "}
            {donor.name.split(" ")[0]} 👋
          </h1>

          <p>
            Your availability can help save a life.
          </p>

        </div>

        <div className="donor-header-actions">

          {/* =================================================
              NOTIFICATION BUTTON
          ================================================= */}

          <button
            type="button"
            className="notification-button"
            onClick={handleNotificationClick}
          >
            🔔

            {notifications?.length > 0 &&
              !notificationsViewed && (
                <span className="notification-count">
                  {notifications.length}
                </span>
              )}
          </button>

          {/* =================================================
              NOTIFICATION DROPDOWN
          ================================================= */}

          {showNotifications && (
            <div className="notification-dropdown">

              <div className="notification-dropdown-header">

                <strong>
                  Notifications
                </strong>

                {notifications?.length > 0 && (
                  <button
                    type="button"
                    className="clear-notifications"
                    onClick={
                      handleClearNotifications
                    }
                  >
                    Clear
                  </button>
                )}

              </div>

              {notifications?.length === 0 ? (

                <p className="no-notifications">
                  No new notifications
                </p>

              ) : (

                notifications.map(
                  (notification, index) => (
                    <div
                      className="notification-item"
                      key={
                        notification.requestId +
                        "-" +
                        notification.senderId +
                        "-" +
                        notification.createdAt +
                        "-" +
                        index
                      }
                    >

                      <strong>
                        {notification.senderName}
                      </strong>

                      <p>
                        {notification.message}
                      </p>

                    </div>
                  )
                )

              )}

            </div>
          )}

          {/* =================================================
              LOGOUT
          ================================================= */}

          <button
            className="admin-logout donor-logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>

        </div>

      </div>

      {/* =====================================================
          AVAILABILITY
      ===================================================== */}

      <section className="availability-card">

        <div className="availability-content">

          <div className="availability-icon">
            🩸
          </div>

          <div>

            <span className="card-label">
              DONATION STATUS
            </span>

            <h2>
              {donor.available
                ? "Available to Donate"
                : "Currently Unavailable"}
            </h2>

            <p>
              {donor.available
                ? "You can receive blood requests from nearby receivers."
                : "You won't receive new blood requests."}
            </p>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

          </div>

        </div>

        <button
          className={
            donor.available
              ? "availability-toggle active"
              : "availability-toggle"
          }
          onClick={handleAvailability}
          disabled={availabilityLoading}
        >

          <span className="toggle-dot"></span>

          {availabilityLoading
            ? "Updating..."
            : donor.available
              ? "Available"
              : "Unavailable"}

        </button>

      </section>

      {/* =====================================================
          DONOR LOCATION
      ===================================================== */}

      <section className="availability-card">

        <div className="availability-content">

          <div className="availability-icon">
            📍
          </div>

          <div>

            <span className="card-label">
              CURRENT LOCATION
            </span>

            <h2>
              {donor.latitude &&
              donor.longitude
                ? "Location Available"
                : "Location Not Set"}
            </h2>

            <p>
              {donor.latitude &&
              donor.longitude
                ? `${donor.latitude.toFixed(4)}, ${donor.longitude.toFixed(4)}`
                : "Update your location so receivers can find your distance accurately."}
            </p>

            {locationMessage && (
              <p>
                {locationMessage}
              </p>
            )}

          </div>

        </div>

        <button
          className="availability-toggle active"
          onClick={handleUpdateLocation}
          disabled={locationLoading}
        >
          {locationLoading
            ? "Getting Location..."
            : "📍 Update My Location"}
        </button>

      </section>

      {/* =====================================================
          REQUESTS
      ===================================================== */}

      <section className="requests-section">

        <div className="section-title">

          <div>

            <span className="hero-label">
              NEARBY REQUESTS
            </span>

            <h2>
              People who need your help
            </h2>

          </div>

          <span className="request-count">
            {matchingRequests.length} requests
          </span>

        </div>

        <div className="request-list">

          {matchingRequests.map(
            (request) => (

              <article
                className="blood-request-card"
                key={request.id}
              >

                <div className="request-main">

                  <div className="request-blood">
                    {request.bloodGroup}
                  </div>

                  <div className="request-details">

                    <div className="request-name-row">

                      <h3>
                        Blood needed for{" "}
                        {request.patientName}
                      </h3>

                      {request.urgent && (
                        <span className="urgent-badge">
                          Urgent
                        </span>
                      )}

                    </div>

                    <p>
                      🏥{" "}
                      {request.hospitalName}
                    </p>

                    <p>
                      📍{" "}
                      {request.district}
                    </p>

                    <span className="request-distance">
                      {donor.district ===
                      request.district
                        ? "Nearby"
                        : "Location match"}
                    </span>

                  </div>

                </div>

                <button
                  className="view-request-button"
                  onClick={() =>
                    navigate(
                      "/blood-request",
                      {
                        state: {
                          requestId:
                            request.id,
                        },
                      }
                    )
                  }
                >
                  View Request →
                </button>

              </article>

            )
          )}

          {matchingRequests.length === 0 && (

            <div className="no-donors">

              <div>
                🩸
              </div>

              <h2>
                No active matching requests
              </h2>

              <p>
                New requests for your blood group
                will appear here.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      <section
        className="donor-profile-link"
        onClick={() =>
          navigate("/chats")
        }
      >

        <div className="profile-link-icon">
          💬
        </div>

        <div>

          <span>
            MESSAGES
          </span>

          <h2>
            View your conversations
          </h2>

          <p>
            Reopen chats with receivers at any time.
          </p>

        </div>

        <strong>
          →
        </strong>

      </section>

      {/* =====================================================
          BOTTOM CARDS
      ===================================================== */}

      <div className="donor-bottom-grid">

        <section
          className="donor-small-card clickable-card"
          onClick={() =>
            navigate("/leaderboard")
          }
        >

          <div className="small-card-icon">
            🏆
          </div>

          <div>

            <strong>
              {donorRank
                ? `#${donorRank}`
                : "--"}
            </strong>

            <span>
              Your Rank
            </span>

            <p>
              Keep donating to climb the leaderboard.
            </p>

          </div>

        </section>

        <section
          className="donor-profile-link"
          onClick={() =>
            navigate("/donor-profile")
          }
        >

          <div className="profile-link-icon">
            👤
          </div>

          <div>

            <span>
              MY PROFILE
            </span>

            <h2>
              View and manage your donor profile
            </h2>

            <p>
              Update your personal information
              and availability.
            </p>

          </div>

          <strong>
            →
          </strong>

        </section>

      </div>

    </main>
  );
}

export default DonorDashboard;