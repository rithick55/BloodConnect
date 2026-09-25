import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { indiaLocations } from "../data/indiaLocations";
import { useApp } from "../context/AppContext";

function DonorProfile() {
  const navigate = useNavigate();
  const { currentUser, updateUser, updateDonorAvailability } = useApp();

  const [editing, setEditing] = useState(false);

  const [storedUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bloodconnect_user")) || null;
    } catch {
      return null;
    }
  });

  const user = currentUser || storedUser;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    bloodGroup: "",
    state: "",
    district: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        bloodGroup: user.bloodGroup || "",
        state: user.state || "Tamil Nadu",
        district: user.district || "",
      });
    }
  }, [user]);

  if (!user) {
    return (
      <main className="profile-page">
        <div className="no-donors">
          <div>👤</div>
          <h2>Profile not found</h2>
          <p>Please login again to view your profile.</p>

          <button
            className="find-donors-button"
            onClick={() => navigate("/donor-login")}
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  const states = Object.keys(indiaLocations);
  const districts = form.state
    ? indiaLocations[form.state] || []
    : [];

  const change = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveProfile = async () => {
    try {
      const updatedUser = await updateUser(form);

      localStorage.setItem(
        "bloodconnect_user",
        JSON.stringify(updatedUser)
      );

      setEditing(false);
    } catch (error) {
      alert(error.message || "Unable to update profile.");
    }
  };

  const toggleAvailability = () => {
    const newAvailability = !user.available;

    updateDonorAvailability(newAvailability);

    const updatedUser = {
      ...user,
      available: newAvailability,
    };

    localStorage.setItem(
      "bloodconnect_user",
      JSON.stringify(updatedUser)
    );
  };

  return (
    <main className="profile-page">

      <div className="profile-header">
        <button
          className="back-button"
          onClick={() => navigate("/donor-dashboard")}
        >
          ← Back
        </button>

        <div>
          <span className="hero-label">DONOR PROFILE</span>
          <h1>My Profile</h1>
          <p>Manage your donor information and availability.</p>
        </div>
      </div>

      <section className="profile-card">

        <div className="profile-top">
          <div className="profile-avatar">
            {(user.name || "D").charAt(0).toUpperCase()}
          </div>

          <div className="profile-name">
            <h2>{user.name || "Donor"}</h2>
            <span className="profile-role">
              Blood Donor
            </span>
          </div>

          <span
            className={
              user.available
                ? "profile-status available"
                : "profile-status unavailable"
            }
          >
            {user.available ? "Available" : "Unavailable"}
          </span>
        </div>

        <div className="profile-section">

          <div className="profile-section-heading">
            <div>
              <h3>Personal Information</h3>
              <p>Your basic donor information.</p>
            </div>

            {!editing && (
              <button
                className="edit-profile-button"
                onClick={() => setEditing(true)}
              >
                ✎ Edit
              </button>
            )}
          </div>

          <div className="profile-grid">

            <div className="profile-field">
              <label>Full Name</label>

              {editing ? (
                <input
                  value={form.name}
                  onChange={(e) =>
                    change("name", e.target.value)
                  }
                />
              ) : (
                <strong>{user.name || "Not set"}</strong>
              )}
            </div>

            <div className="profile-field">
              <label>Phone Number</label>

              {editing ? (
                <input
                  value={form.phone}
                  onChange={(e) =>
                    change("phone", e.target.value)
                  }
                />
              ) : (
                <strong>{user.phone || "Not set"}</strong>
              )}
            </div>

            <div className="profile-field">
              <label>Blood Group</label>

              {editing ? (
                <select
                  value={form.bloodGroup}
                  onChange={(e) =>
                    change("bloodGroup", e.target.value)
                  }
                >
                  <option value="">Select blood group</option>

                  {[
                    "A+",
                    "A-",
                    "B+",
                    "B-",
                    "AB+",
                    "AB-",
                    "O+",
                    "O-",
                  ].map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              ) : (
                <strong>
                  {user.bloodGroup || "Not set"}
                </strong>
              )}
            </div>

            <div className="profile-field">
              <label>State / Union Territory</label>

              {editing ? (
                <select
                  value={form.state}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      state: e.target.value,
                      district: "",
                    }))
                  }
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
              ) : (
                <strong>{user.state || "Not set"}</strong>
              )}
            </div>

            <div className="profile-field">
              <label>District</label>

              {editing ? (
                <select
                  value={form.district}
                  onChange={(e) =>
                    change("district", e.target.value)
                  }
                  disabled={!form.state}
                >
                  <option value="">
                    Select district
                  </option>

                  {districts.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <strong>
                  {user.district || "Not set"}
                </strong>
              )}
            </div>

          </div>
        </div>

        <div className="profile-section">

          <div className="profile-section-heading">
            <div>
              <h3>Donation Statistics</h3>
              <p>Your contribution to the community.</p>
            </div>
          </div>

          <div className="profile-stats">

            <div className="profile-stat">
              <strong>{user.donations || 0}</strong>
              <span>Total Donations</span>
            </div>

            <div className="profile-stat">
              <strong>{user.donations || 0}</strong>
              <span>People Helped</span>
            </div>

           <div className="profile-stat">
  <strong>—</strong>
  <span>Last Donation</span>
</div>

          </div>
        </div>

        <div className="profile-section availability-section">

          <div>
            <h3>Donor Availability</h3>

            <p>
              Let receivers know whether you are currently
              available to donate.
            </p>
          </div>

          <button
            className={
              user.available
                ? "availability-toggle active"
                : "availability-toggle"
            }
            onClick={toggleAvailability}
          >
            <span></span>

            {user.available
              ? "Available"
              : "Unavailable"}
          </button>

        </div>

        {editing && (
          <div className="profile-actions">

            <button
              className="cancel-profile-button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>

            <button
              className="save-profile-button"
              onClick={saveProfile}
            >
              ✓ Save Changes
            </button>

          </div>
        )}

      </section>
    </main>
  );
}

export default DonorProfile;