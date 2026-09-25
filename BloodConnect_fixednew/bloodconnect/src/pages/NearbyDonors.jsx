import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
const API_URL = import.meta.env.VITE_API_URL;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const locationCoordinates = {
  Ariyalur: { latitude: 11.1401, longitude: 79.0786 },
  Chengalpattu: { latitude: 12.6819, longitude: 79.9888 },
  Chennai: { latitude: 13.0827, longitude: 80.2707 },
  Coimbatore: { latitude: 11.0168, longitude: 76.9558 },
  Cuddalore: { latitude: 11.748, longitude: 79.7714 },
  Dharmapuri: { latitude: 12.1211, longitude: 78.1582 },
  Dindigul: { latitude: 10.3673, longitude: 77.9803 },
  Erode: { latitude: 11.341, longitude: 77.7172 },
  Kallakurichi: { latitude: 11.7404, longitude: 78.9597 },
  Kancheepuram: { latitude: 12.8342, longitude: 79.7036 },
  Karur: { latitude: 10.9601, longitude: 78.0766 },
  Krishnagiri: { latitude: 12.5186, longitude: 78.2137 },
  Madurai: { latitude: 9.9252, longitude: 78.1198 },
  Mayiladuthurai: { latitude: 11.1035, longitude: 79.655 },
  Nagapattinam: { latitude: 10.7672, longitude: 79.8449 },
  Namakkal: { latitude: 11.2194, longitude: 78.1677 },
  Perambalur: { latitude: 11.232, longitude: 78.8801 },
  Pudukottai: { latitude: 10.3797, longitude: 78.8208 },
  Pudukkottai: { latitude: 10.3797, longitude: 78.8208 },
  Ramanathapuram: { latitude: 9.3639, longitude: 78.8395 },
  Ranipet: { latitude: 12.9249, longitude: 79.3333 },
  Salem: { latitude: 11.6643, longitude: 78.146 },
  Sivaganga: { latitude: 9.8433, longitude: 78.4809 },
  Tenkasi: { latitude: 8.959, longitude: 77.3152 },
  Thanjavur: { latitude: 10.787, longitude: 79.1378 },
  Theni: { latitude: 10.0104, longitude: 77.4768 },
  Thoothukudi: { latitude: 8.7642, longitude: 78.1348 },
  Tiruchirappalli: { latitude: 10.7905, longitude: 78.7047 },
  Tirunelveli: { latitude: 8.7139, longitude: 77.7567 },
  Tirupathur: { latitude: 12.4966, longitude: 78.56 },
  Tiruppur: { latitude: 11.1085, longitude: 77.3411 },
  Tiruvallur: { latitude: 13.1439, longitude: 79.9081 },
  Tiruvarur: { latitude: 10.7727, longitude: 79.6368 },
  Vellore: { latitude: 12.9165, longitude: 79.1325 },
  Viluppuram: { latitude: 11.9401, longitude: 79.4861 },
  Virudhunagar: { latitude: 9.5851, longitude: 77.9579 },
};

function getDistrictCoordinates(district) {
  if (!district) return null;

  const key = Object.keys(locationCoordinates).find(
    (name) => name.toLowerCase() === district.trim().toLowerCase()
  );

  return key ? locationCoordinates[key] : null;
}

function NearbyDonors() {
  const navigate = useNavigate();
  const location = useLocation();
  const { requests, openChat, currentUser } = useApp();

  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [donors, setDonors] = useState([]);
  const [donorLoading, setDonorLoading] = useState(false);
  const [donorError, setDonorError] = useState("");
  const [loadedRequest, setLoadedRequest] = useState(null);

  const requestId = location.state?.requestId;

  const contextRequest = requestId
    ? requests.find(
      (item) => String(item.id) === String(requestId)
    )
    : null;

  const request = contextRequest || loadedRequest;

  useEffect(() => {
    if (!requestId || contextRequest || !currentUser?.id) {
      return;
    }

    const loadRequest = async () => {
      try {
        const response = await fetch(
          `${API_URL}/requests/receiver/${currentUser.id}`
        );

        const text = await response.text();

        let data;

        try {
          data = JSON.parse(text);
        } catch {
          data = [];
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load blood request."
          );
        }

        const foundRequest = Array.isArray(data)
          ? data.find(
            (item) =>
              String(item.id) === String(requestId)
          )
          : null;

        if (foundRequest) {
          setLoadedRequest(foundRequest);
        }
      } catch (error) {
        console.error(
          "Unable to load blood request:",
          error
        );
      }
    };

    loadRequest();
  }, [requestId, contextRequest, currentUser]);

  useEffect(() => {
    if (!request) return;

    const fetchDonors = async () => {
      setDonorLoading(true);
      setDonorError("");

      try {
        const response = await fetch(
          `${API_URL}/donors?bloodGroup=${encodeURIComponent(
            request.bloodGroup
          )}`
        );

        const text = await response.text();

        let data;

        try {
          data = JSON.parse(text);
        } catch {
          data = [];
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load donors."
          );
        }

        setDonors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Unable to load donors:", error);
        setDonorError(
          error.message || "Unable to connect to donor service."
        );
        setDonors([]);
      } finally {
        setDonorLoading(false);
      }
    };

    fetchDonors();
  }, [request]);

  const filteredDonors = useMemo(() => {
    if (!request) return [];

    const requestLocation =
      request.latitude != null && request.longitude != null
        ? {
          latitude: request.latitude,
          longitude: request.longitude,
        }
        : getDistrictCoordinates(request.district);

    if (!requestLocation) return [];

    return donors
      .filter(
        (donor) =>
          donor.bloodGroup === request.bloodGroup &&
          donor.state === request.state
      )
      .map((donor) => {
        const donorLocation =
          donor.latitude != null && donor.longitude != null
            ? {
              latitude: donor.latitude,
              longitude: donor.longitude,
            }
            : getDistrictCoordinates(donor.district);

        const distance = donorLocation
          ? calculateDistance(
            requestLocation.latitude,
            requestLocation.longitude,
            donorLocation.latitude,
            donorLocation.longitude
          )
          : null;

        return {
          ...donor,
          distance,
        };
      })
      .sort((a, b) => {
        if (request.urgent && a.available !== b.available) {
          return a.available ? -1 : 1;
        }

        if (a.distance == null) return 1;
        if (b.distance == null) return -1;

        return a.distance - b.distance;
      })
      .filter(
        (donor) => !showAvailableOnly || donor.available
      );
  }, [donors, request, showAvailableOnly]);

  // Prevent crash if page is opened directly
  if (!request) {
    return (
      <main className="donors-page">
        <div className="no-donors">
          <div>🩸</div>
          <h2>Request not found</h2>
          <p>Please create a blood request first.</p>

          <button
            className="find-donors-button"
            onClick={() => navigate("/receiver-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="donors-page">

      <div className="donors-header">

        <button
          className="back-button"
          onClick={() => navigate("/receiver-dashboard")}
        >
          ← Back
        </button>

        <div className="donors-title">
          <span className="hero-label">
            DONOR SEARCH
          </span>

          <h1>
            Nearby Donors
          </h1>

          <p>
            {request.urgent
              ? "Emergency request: available matching donors are prioritized."
              : "Matching donors near your selected location."}
          </p>
        </div>

      </div>

      <section className="search-summary">

        <div className="summary-item">
          <span>Blood Group</span>
          <strong>{request.bloodGroup}</strong>
        </div>

        <div className="summary-item">
          <span>Location</span>
          <strong>{request.district}</strong>
        </div>

        <div className="summary-item">
          <span>Matching Donors</span>
          <strong>{filteredDonors.length}</strong>
        </div>

      </section>

      <div className="request-location">

        <span>📍</span>

        <div>
          <strong>
            {request.urgent
              ? "🚨 Emergency blood needed near"
              : "Blood needed near"}
          </strong>

          <p>
            {request.hospitalName}, {request.district},{" "}
            {request.state}
          </p>
        </div>

      </div>

      <div className="donor-filter">

        <button
          className={
            !showAvailableOnly
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setShowAvailableOnly(false)}
        >
          All Matching Donors
        </button>

        <button
          className={
            showAvailableOnly
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setShowAvailableOnly(true)}
        >
          🟢 Available Now
        </button>

      </div>

      {donorLoading && (
        <div className="no-donors">
          <div>🩸</div>
          <h2>Finding donors...</h2>
          <p>Please wait while we search for matching donors.</p>
        </div>
      )}

      {donorError && (
        <div className="no-donors">
          <div>⚠️</div>
          <h2>Unable to load donors</h2>
          <p>{donorError}</p>
        </div>
      )}

      {!donorLoading && !donorError && (
        <section className="donor-list">

          {filteredDonors.map((donor) => (

            <article
              className="donor-card"
              key={donor.id}
            >

              <div className="donor-main">

                <div className="donor-avatar">
                  {donor.name.charAt(0)}
                </div>

                <div className="donor-info">

                  <div className="donor-name-row">

                    <h2>
                      {donor.name}
                    </h2>

                    <span
                      className={
                        donor.available
                          ? "availability available"
                          : "availability unavailable"
                      }
                    >
                      {donor.available
                        ? "Available"
                        : "Unavailable"}
                    </span>

                  </div>

                  <p>
                    {donor.district}
                  </p>

                  <span className="donor-distance">
                    📍{" "}
                    {donor.distance != null
                      ? `${donor.distance.toFixed(1)} km away`
                      : "Location unavailable"}
                  </span>

                </div>

              </div>

              <div className="blood-group">
                {donor.bloodGroup}
              </div>

              <div className="donor-actions">

                <button
                  className="call-button"
                  disabled={!donor.available}
                  onClick={() =>
                    navigate("/call-donor", {
                      state: {
                        donor,
                        requestId: request.id,
                      },
                    })
                  }
                >
                  ☎ Call
                </button>

                <button
                  className="chat-button"
                  disabled={!donor.available}
                  onClick={() => {
                    openChat(request.id, donor.id);

                    navigate("/chat", {
                      state: {
                        requestId: request.id,
                        donorId: donor.id,
                        mode: "receiver",
                      },
                    });
                  }}
                >
                  💬 Chat
                </button>

              </div>

            </article>

          ))}

          {filteredDonors.length === 0 && (

            <div className="no-donors">

              <div>🩸</div>

              <h2>
                No matching donors nearby
              </h2>

              <p>
                We couldn't find a donor matching this
                blood group and location.
              </p>

              <button
                className="find-donors-button"
                onClick={() =>
                  navigate("/receiver-dashboard")
                }
              >
                Change Search
              </button>

            </div>

          )}

        </section>)}

    </main>
  );
}

export default NearbyDonors;