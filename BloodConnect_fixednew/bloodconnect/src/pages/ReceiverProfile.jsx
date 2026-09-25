import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { indiaLocations } from "../data/indiaLocations";
import { useApp } from "../context/AppContext";

function ReceiverProfile() {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useApp();

  const [editing, setEditing] = useState(false);
  const [requestStats, setRequestStats] = useState({
    total: 0,
    fulfilled: 0,
    active: 0,
  });

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
    state: "",
    district: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        state: user.state || "",
        district: user.district || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const loadRequestStats = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          `http://localhost:8090/api/requests/receiver/${user.id}`
        );

        if (!response.ok) {
          throw new Error("Unable to load request history.");
        }

        const data = await response.json();

        const total = data.length;

        const fulfilled = data.filter(
          (request) => request.status === "COMPLETED"
        ).length;

        const active = data.filter(
          (request) =>
            request.status === "ACTIVE" ||
            request.status === "ACCEPTED"
        ).length;

        setRequestStats({
          total,
          fulfilled,
          active,
        });
      } catch (error) {
        console.error(
          "Unable to load receiver request stats:",
          error
        );
      }
    };

    loadRequestStats();
  }, [user?.id]);


  if (!user) {
    return (
      <main className="profile-page">
        <div className="no-donors">
          <div>👤</div>
          <h2>Profile not found</h2>
          <p>Please login again to view your profile.</p>

          <button
            className="find-donors-button"
            onClick={() => navigate("/receiver-login")}
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
      const response = await fetch(
        `http://localhost:8090/api/auth/profile/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            state: form.state,
            district: form.district,
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        alert(data.message || "Unable to update profile.");
        return;
      }

      // Update React/local profile with backend response
      updateUser(data);

      localStorage.setItem(
        "bloodconnect_user",
        JSON.stringify(data)
      );

      setEditing(false);

      alert("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  return (
    <main className="profile-page">

      <div className="profile-header">

        <button
          className="back-button"
          onClick={() => navigate("/receiver-dashboard")}
        >
          ← Back
        </button>

        <div>
          <span className="hero-label">
            RECEIVER PROFILE
          </span>

          <h1>My Profile</h1>

          <p>Manage your personal information.</p>
        </div>

      </div>

      <section className="profile-card">

        <div className="profile-top">

          <div className="profile-avatar">
            {(user.name || "R").charAt(0).toUpperCase()}
          </div>

          <div className="profile-name">
            <h2>{user.name || "Receiver"}</h2>

            <span className="profile-role">
              Blood Receiver
            </span>
          </div>

          <span className="profile-status available">
            Active
          </span>

        </div>

        <div className="profile-section">

          <div className="profile-section-heading">

            <div>
              <h3>Personal Information</h3>
              <p>Your basic receiver information.</p>
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
              <h3>Blood Request History</h3>
              <p>Your previous blood requests.</p>
            </div>

          </div>

          <div className="profile-stats">

            <div className="profile-stat">
              <strong>{requestStats.total}</strong>
              <span>Total Requests</span>
            </div>

            <div className="profile-stat">
              <strong>{requestStats.fulfilled}</strong>
              <span>Requests Fulfilled</span>
            </div>

            <div className="profile-stat">
              <strong>{requestStats.active}</strong>
              <span>Active Requests</span>
            </div>

          </div>
        </div>

        <div className="profile-section availability-section">

          <div>
            <h3>Account Status</h3>

            <p>
              Your receiver account is currently active.
            </p>
          </div>

          <span className="profile-status available">
            ● Active
          </span>

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

export default ReceiverProfile;