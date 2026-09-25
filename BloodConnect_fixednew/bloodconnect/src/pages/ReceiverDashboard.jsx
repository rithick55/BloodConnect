import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { indiaLocations } from "../data/indiaLocations";
import { useApp } from "../context/AppContext";

function ReceiverDashboard() {
  const navigate = useNavigate();
 const { createRequest, logout } = useApp();

  // Patient
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  // Hospital
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");

  // Location
  const [locationType, setLocationType] = useState("address");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationError, setLocationError] = useState("");

  const [error, setError] = useState("");

  const states = Object.keys(indiaLocations);

  const districts = state
    ? indiaLocations[state]
    : [];

  const handleStateChange = (e) => {
    setState(e.target.value);
    setDistrict("");
  };

  const getLocation = () => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Location is not supported by your browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setLatitude(latitude);
        setLongitude(longitude);

        setLocation(
          `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        );
      },
      () => {
        setLocationError(
          "Unable to get your location. Please allow location access."
        );
      }
    );
  };

  const submitRequest = async (urgent = false) => {
    setError("");

    if (!patientName.trim()) {
      setError("Please enter the patient name.");
      return;
    }

    if (!patientAge) {
      setError("Please enter the patient age.");
      return;
    }

    const age = Number(patientAge);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      setError("Patient age must be between 1 and 120. Age 0 is not valid.");
      return;
    }

    if (!bloodGroup) {
      setError("Please select a blood group.");
      return;
    }

    if (!state) {
      setError("Please select a state or Union Territory.");
      return;
    }

    if (!district) {
      setError("Please select a district.");
      return;
    }

    if (!hospitalName.trim()) {
      setError("Please enter the hospital name.");
      return;
    }

    if (locationType === "address" && !hospitalAddress.trim()) {
      setError("Please enter the hospital address.");
      return;
    }

    if (locationType === "current" && !location) {
      setError("Please allow your current location.");
      return;
    }
    

  try {
  const request = await createRequest({
    patientName: patientName.trim(),
    patientAge: age,
    bloodGroup,
    state,
    district,
    hospitalName: hospitalName.trim(),
    hospitalAddress: hospitalAddress.trim(),
    locationType,
    location: location || hospitalAddress.trim(),
    latitude,
    longitude,
    urgent,
  });

  navigate("/nearby-donors", {
    state: {
      requestId: request.id,
    },
  });
} catch (error) {
  console.error("Unable to create blood request:", error);

  setError(
    error.message || "Unable to create blood request."
  );
}
  };

  const findNearbyDonors = () => submitRequest(false);
  const findEmergencyDonors = () => submitRequest(true);

  return (
    <main className="dashboard-page">

      <div className="dashboard-header">
        <span className="hero-label">
          BLOOD REQUEST
        </span>

        <h1>
          Find a blood donor near you.
        </h1>

        <p>
          Tell us where help is needed and we'll
          help you find nearby donors.
        </p>
      </div>
      <div className="dashboard-header">
        ...
      </div>

      <button
        type="button"
        className="logout-button"
        onClick={() => {
          logout();
          navigate("/receiver-login", { replace: true });
        }}
      >
        Logout
      </button>

      {/* Patient Details */}

      <section className="form-card">

        <div className="section-heading">
          <div className="section-number">
            01
          </div>

          <div>
            <h2>Patient Details</h2>
            <p>Tell us who needs blood.</p>
          </div>
        </div>

        <div className="form-grid">

          <div className="form-group">
            <label>Patient Name</label>

            <input
              type="text"
              placeholder="Enter patient name"
              value={patientName}
              onChange={(e) =>
                setPatientName(e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label>Age</label>

            <input
              type="number"
              placeholder="Enter age"
              min="1"
              max="120"
              value={patientAge}
              onChange={(e) =>
                setPatientAge(e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label>Blood Group</label>

            <select
              value={bloodGroup}
              onChange={(e) =>
                setBloodGroup(e.target.value)
              }
            >
              <option value="">
                Select blood group
              </option>

              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

        </div>

      </section>

      {/* Hospital Details */}

      <section className="form-card">

        <div className="section-heading">
          <div className="section-number">
            02
          </div>

          <div>
            <h2>Hospital Details</h2>
            <p>Where should the donor reach?</p>
          </div>
        </div>

        <div className="form-grid">

          <div className="form-group">
            <label>
              State / Union Territory
            </label>

            <select
              value={state}
              onChange={handleStateChange}
            >
              <option value="">
                Select state or UT
              </option>

              {states.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>District</label>

            <select
              value={district}
              onChange={(e) =>
                setDistrict(e.target.value)
              }
              disabled={!state}
            >
              <option value="">
                {state
                  ? "Select district"
                  : "Select state first"}
              </option>

              {districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label>Hospital Name</label>

            <input
              type="text"
              placeholder="Enter hospital name"
              value={hospitalName}
              onChange={(e) =>
                setHospitalName(e.target.value)
              }
            />
          </div>

        </div>

        {/* Location */}

        <div className="location-section">

          <div className="location-heading">
            <div>
              <label className="location-title">
                Hospital Location
              </label>

              <p>
                Choose how you want to provide
                the location.
              </p>
            </div>
          </div>

          <div className="location-options">

            <button
              type="button"
              className={
                locationType === "address"
                  ? "location-option active"
                  : "location-option"
              }
              onClick={() => {
                setLocationType("address");
                setLocation("");
                setLocationError("");
              }}
            >
              <span>⌕</span>
              Enter Address
            </button>

            <button
              type="button"
              className={
                locationType === "current"
                  ? "location-option active"
                  : "location-option"
              }
              onClick={() => {
                setLocationType("current");
                getLocation();
              }}
            >
              <span>📍</span>
              Use My Location
            </button>

          </div>

          {locationType === "address" && (
            <div className="form-group location-input">

              <label>
                Hospital Address
              </label>

              <textarea
                placeholder="Enter the complete hospital address"
                rows="4"
                value={hospitalAddress}
                onChange={(e) =>
                  setHospitalAddress(e.target.value)
                }
              />

            </div>
          )}

          {locationType === "current" && (
            <div className="current-location">

              <div className="location-pin">
                📍
              </div>

              <div>
                <strong>
                  Current location
                </strong>

                <p>
                  {location ||
                    "Getting your location..."}
                </p>
              </div>

            </div>
          )}

          {locationError && (
            <p className="location-error">
              {locationError}
            </p>
          )}

        </div>

      </section>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <button
        type="button"
        className="find-donors-button"
        onClick={findNearbyDonors}
      >
        Find Nearby Donors
      </button>

      {/* Emergency */}

      <section className="emergency-card">

        <div>
          <span className="emergency-icon">
            🚨
          </span>

          <div>
            <h2>
              Need blood urgently?
            </h2>

            <p>
              Find the closest available donors
              quickly.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="emergency-button"
          onClick={findEmergencyDonors}
        >
          Find Emergency Donors
        </button>

      </section>

      <section
        className="donor-profile-link"
        onClick={() => navigate("/chats")}
      >
        <div className="profile-link-icon">💬</div>
        <div>
          <span>MESSAGES</span>
          <h2>View your conversations with donors</h2>
          <p>Reopen previous chats even after leaving the chat screen.</p>
        </div>
        <strong>→</strong>
      </section>

      <section
        className="donor-profile-link"
        onClick={() => navigate("/receiver-profile")}
      >
        <div className="profile-link-icon">
          👤
        </div>

        <div>
          <span>MY PROFILE</span>

          <h2>
            View and manage your receiver profile
          </h2>

          <p>
            Update your personal information and location.
          </p>
        </div>

        <strong>→</strong>
      </section>

    </main>
  );
}

export default ReceiverDashboard;