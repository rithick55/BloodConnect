import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function AdminReceivers() {
  const navigate = useNavigate();

  const [receivers, setReceivers] = useState([]);
  const [requests, setRequests] = useState([]);

  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReceiverData = async () => {
      try {
        setLoading(true);
        setError("");

        const [receiversResponse, requestsResponse] =
          await Promise.all([
            fetch(`${API_URL}/admin/receivers`),
            fetch(`${API_URL}/admin/requests`),
          ]);

        const receiversData = await receiversResponse.json();
        const requestsData = await requestsResponse.json();

        if (!receiversResponse.ok) {
          throw new Error(
            receiversData.message ||
            "Unable to load receivers."
          );
        }

        if (!requestsResponse.ok) {
          throw new Error(
            requestsData.message ||
            "Unable to load requests."
          );
        }

        setReceivers(receiversData);
        setRequests(requestsData);
      } catch (error) {
        console.error(
          "Unable to load receiver data:",
          error
        );

        setError(
          error.message ||
          "Unable to load receiver data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReceiverData();
  }, []);

  const receiverData = receivers.map((receiver) => {
    const receiverRequests = requests
      .filter(
        (request) =>
          request.receiverId === receiver.id
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );

    const latestRequest = receiverRequests[0];

    let status = "Inactive";

    const hasActiveRequest = receiverRequests.some(
      (request) =>
        request.status === "ACTIVE" ||
        request.status === "ACCEPTED"
    );

    const hasCompletedRequest = receiverRequests.some(
      (request) =>
        request.status === "COMPLETED"
    );

    if (hasActiveRequest) {
      status = "Active";
    } else if (hasCompletedRequest) {
      status = "Completed";
    }

    return {
      id: receiver.id,
      name: receiver.name || "Unknown",
      phone: receiver.phone || "Not provided",
      bloodGroup:
        latestRequest?.bloodGroup ||
        receiver.bloodGroup ||
        "Not specified",

      patientName:
        latestRequest?.patientName ||
        "Not specified",

      patientAge:
        latestRequest?.patientAge ??
        "-",

      state:
        latestRequest?.state ||
        receiver.state ||
        "Not specified",

      district:
        latestRequest?.district ||
        receiver.district ||
        "Not specified",

      hospital:
        latestRequest?.hospitalName ||
        "Not specified",

      status,
    };
  });

  const filteredReceivers = receiverData.filter(
    (receiver) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        receiver.name
          .toLowerCase()
          .includes(searchText) ||
        receiver.phone
          .toLowerCase()
          .includes(searchText) ||
        receiver.patientName
          .toLowerCase()
          .includes(searchText) ||
        receiver.district
          .toLowerCase()
          .includes(searchText) ||
        receiver.hospital
          .toLowerCase()
          .includes(searchText);

      const matchesBlood =
        bloodFilter === "All" ||
        receiver.bloodGroup === bloodFilter;

      const matchesStatus =
        statusFilter === "All" ||
        receiver.status === statusFilter;

      return (
        matchesSearch &&
        matchesBlood &&
        matchesStatus
      );
    }
  );

  const activeRequests = requests.filter(
    (request) =>
      request.status === "ACTIVE"
  ).length;

  return (
    <main className="admin-management-page">

      {/* Header */}

      <header className="management-header">

        <button
          className="back-button"
          onClick={() =>
            navigate("/admin-dashboard")
          }
        >
          ← Dashboard
        </button>

        <div>
          <span className="hero-label">
            ADMIN MANAGEMENT
          </span>

          <h1>Manage Receivers</h1>

          <p>
            View and manage registered blood
            receivers.
          </p>
        </div>

      </header>

      {/* Loading / Error */}

      {loading && (
        <p>Loading receivers...</p>
      )}

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      {/* Statistics */}

      <section className="management-stats">

        <div className="management-stat">
          <span>👥</span>

          <div>
            <small>Total Receivers</small>

            <strong>
              {receivers.length}
            </strong>
          </div>
        </div>

        <div className="management-stat">
          <span>🟢</span>

          <div>
            <small>Active</small>

            <strong>
              {
                receiverData.filter(
                  (receiver) =>
                    receiver.status === "Active"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="management-stat">
          <span>🔴</span>

          <div>
            <small>Inactive</small>

            <strong>
              {
                receiverData.filter(
                  (receiver) =>
                    receiver.status === "Inactive"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="management-stat">
          <span>🩸</span>

          <div>
            <small>Active Requests</small>

            <strong>
              {activeRequests}
            </strong>
          </div>
        </div>

      </section>

      {/* Search and Filters */}

      <section className="management-card">

        <div className="management-toolbar">

          <div className="admin-search">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search receiver, patient, phone, district..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <select
            value={bloodFilter}
            onChange={(e) =>
              setBloodFilter(e.target.value)
            }
          >
            <option value="All">
              All Blood Groups
            </option>

            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>AB+</option>
            <option>AB-</option>
            <option>O+</option>
            <option>O-</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>

            <option value="Completed">
              Completed
            </option>
          </select>

        </div>

        {/* Receiver Table */}

        <div className="admin-data-table">

          <div className="data-table-header">

            <span>Receiver</span>
            <span>Blood Group</span>
            <span>Patient</span>
            <span>Hospital</span>
            <span>Status</span>
            <span>Action</span>

          </div>

          {filteredReceivers.map(
            (receiver) => (

              <div
                className="data-table-row"
                key={receiver.id}
              >

                {/* Receiver */}

                <div className="table-person">

                  <div className="table-avatar">
                    {receiver.name.charAt(0)}
                  </div>

                  <div>

                    <strong>
                      {receiver.name}
                    </strong>

                    <small>
                      {receiver.phone}
                    </small>

                  </div>

                </div>

                {/* Blood Group */}

                <span className="table-blood">
                  {receiver.bloodGroup}
                </span>

                {/* Patient */}

                <div className="table-location">

                  <strong>
                    {receiver.patientName}
                  </strong>

                  <small>
                    Age {receiver.patientAge}
                  </small>

                </div>

                {/* Hospital */}

                <div className="table-location">

                  <strong>
                    {receiver.hospital}
                  </strong>

                  <small>
                    {receiver.district},{" "}
                    {receiver.state}
                  </small>

                </div>

                {/* Status */}

                <span
                  className={
                    receiver.status === "Active"
                      ? "admin-status active"
                      : receiver.status === "Inactive"
                        ? "admin-status inactive"
                        : "admin-status completed"
                  }
                >
                  {receiver.status}
                </span>

                {/* Action */}

                <span>
                  —
                </span>

              </div>

            )
          )}

          {/* Empty */}

          {filteredReceivers.length === 0 && (
            <div className="empty-management">

              <div>🔍</div>

              <h2>
                No receivers found
              </h2>

              <p>
                Try changing your search
                or filters.
              </p>

            </div>
          )}

        </div>

      </section>

    </main>
  );
}

export default AdminReceivers;