import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function AdminDonors() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDonors = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/admin/donors`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load donors."
          );
        }

        setDonors(data);
      } catch (error) {
        console.error("Unable to load donors:", error);

        setError(
          error.message || "Unable to load donors."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDonors();
  }, []);

  const filteredDonors = donors.filter((donor) => {
    const matchesSearch =
      donor.name.toLowerCase().includes(search.toLowerCase()) ||
      donor.phone.includes(search) ||
      donor.district.toLowerCase().includes(search.toLowerCase());

    const matchesBlood =
      bloodFilter === "All" ||
      donor.bloodGroup === bloodFilter;

    const matchesAvailability =
      availabilityFilter === "All" ||
      (availabilityFilter === "Available" && donor.available) ||
      (availabilityFilter === "Unavailable" && !donor.available);

    return (
      matchesSearch &&
      matchesBlood &&
      matchesAvailability
    );
  });

  const toggleAvailability = async (
    id,
    currentAvailability
  ) => {
    try {
      const newAvailability = !currentAvailability;

      const response = await fetch(
        `${API_URL}/admin/donors/${id}/availability?available=${newAvailability}`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update donor availability."
        );
      }

      setDonors((currentDonors) =>
        currentDonors.map((donor) =>
          donor.id === id
            ? {
              ...donor,
              available: data.available,
            }
            : donor
        )
      );
    } catch (error) {
      console.error(
        "Unable to update donor availability:",
        error
      );

      setError(
        error.message ||
        "Unable to update donor availability."
      );
    }
  };



  return (
    <main className="admin-donors-page">

      {/* Header */}

      <div className="admin-page-header">

        <button
          className="back-button"
          onClick={() => navigate("/admin-dashboard")}
        >
          ← Back
        </button>

        <div>
          <span className="hero-label">
            DONOR MANAGEMENT
          </span>

          <h1>
            Manage Donors
          </h1>

          <p>
            View and manage registered blood donors.
          </p>
        </div>

      </div>


      {loading && (
        <p>Loading donors...</p>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}

      {/* Summary */}
      <section className="admin-donor-summary">

        <div className="admin-donor-summary-card">
          <span>👥</span>

          <div>
            <small>Total Donors</small>
            <strong>{donors.length}</strong>
          </div>
        </div>

        <div className="admin-donor-summary-card">
          <span>🟢</span>

          <div>
            <small>Available</small>
            <strong>
              {donors.filter((donor) => donor.available).length}
            </strong>
          </div>
        </div>

        <div className="admin-donor-summary-card">
          <span>🔴</span>

          <div>
            <small>Unavailable</small>
            <strong>
              {donors.filter((donor) => !donor.available).length}
            </strong>
          </div>
        </div>

        <div className="admin-donor-summary-card">
          <span>🩸</span>

          <div>
            <small>O+ Donors</small>
            <strong>
              {
                donors.filter(
                  (donor) => donor.bloodGroup === "O+"
                ).length
              }
            </strong>
          </div>
        </div>

      </section>


      {/* Filters */}

      <section className="admin-donor-controls">

        <div className="admin-search">

          <span>🔎</span>

          <input
            type="text"
            placeholder="Search donor name, phone or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>


        <select
          value={bloodFilter}
          onChange={(e) => setBloodFilter(e.target.value)}
        >
          <option value="All">
            All Blood Groups
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


        <select
          value={availabilityFilter}
          onChange={(e) =>
            setAvailabilityFilter(e.target.value)
          }
        >
          <option value="All">
            All Status
          </option>

          <option value="Available">
            Available
          </option>

          <option value="Unavailable">
            Unavailable
          </option>
        </select>

      </section>


      {/* Donor Count */}

      <div className="admin-results-heading">

        <div>
          <span className="hero-label">
            REGISTERED DONORS
          </span>

          <h2>
            {filteredDonors.length} donor
            {filteredDonors.length !== 1 ? "s" : ""}
          </h2>
        </div>

      </div>


      {/* Donor List */}

      <section className="admin-donor-list">

        {filteredDonors.map((donor) => (

          <article
            className="admin-donor-card"
            key={donor.id}
          >

            <div className="admin-donor-main">

              <div className="admin-donor-avatar">
                {donor.name.charAt(0)}
              </div>

              <div className="admin-donor-details">

                <div className="admin-donor-name">

                  <h3>
                    {donor.name}
                  </h3>

                  <span
                    className={
                      donor.available
                        ? "admin-donor-status available"
                        : "admin-donor-status unavailable"
                    }
                  >
                    {donor.available
                      ? "Available"
                      : "Unavailable"}
                  </span>

                </div>

                <p>
                  📞 {donor.phone}
                </p>

                <p>
                  📍 {donor.district}, {donor.state}
                </p>

              </div>

            </div>


            <div className="admin-donor-blood">

              <span>
                BLOOD
              </span>

              <strong>
                {donor.bloodGroup}
              </strong>

            </div>


            <div className="admin-donor-donations">

              <span>
                DONATIONS
              </span>

              <strong>
                {donor.donations}
              </strong>

            </div>


            <div className="admin-donor-actions">

              <button
                className="admin-action-button"
                onClick={() =>
                  toggleAvailability(
                    donor.id,
                    donor.available
                  )
                }
              >
                {donor.available
                  ? "Set Unavailable"
                  : "Set Available"}
              </button>

            </div>

          </article>

        ))}


        {filteredDonors.length === 0 && (

          <div className="admin-no-donors">

            <div>
              🩸
            </div>

            <h2>
              No donors found
            </h2>

            <p>
              Try changing your search or filters.
            </p>

          </div>

        )}

      </section>

    </main>
  );
}

export default AdminDonors;