import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function AdminBloodRequests() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [bloodFilter, setBloodFilter] = useState("All");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 5;

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/admin/requests`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load requests."
          );
        }

        setRequests(data);
      } catch (error) {
        console.error(
          "Unable to load requests:",
          error
        );

        setError(
          error.message ||
          "Unable to load requests."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const filteredRequests = requests.filter((request) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (request.patientName || "")
        .toLowerCase()
        .includes(searchText) ||
      (request.hospitalName || "")
        .toLowerCase()
        .includes(searchText) ||
      (request.district || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Urgent"
        ? request.urgent
        : request.status === statusFilter);

    const matchesBlood =
      bloodFilter === "All" ||
      request.bloodGroup === bloodFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesBlood
    );
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);

    return sortOrder === "newest"
      ? dateB - dateA
      : dateA - dateB;
  });

  const totalPages = Math.ceil(sortedRequests.length / requestsPerPage);

  const startIndex = (currentPage - 1) * requestsPerPage;

  const paginatedRequests = sortedRequests.slice(
    startIndex,
    startIndex + requestsPerPage
  );

  const activeCount = requests.filter(
    (request) =>
      request.status === "ACTIVE"
  ).length;

  const urgentCount = requests.filter(
    (request) =>
      request.urgent
  ).length;

  const completedCount = requests.filter(
    (request) =>
      request.status === "COMPLETED"
  ).length;

  const totalCount = requests.length;

  const handleCancelRequest = async (requestId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this blood request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/requests/${requestId}/cancel`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to cancel request."
        );
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? data
            : request
        )
      );
    } catch (error) {
      console.error(
        "Unable to cancel request:",
        error
      );

      alert(
        error.message ||
        "Unable to cancel request."
      );
    }
  };

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
          ← Back
        </button>

        <div>
          <span className="hero-label">
            BLOOD REQUEST MANAGEMENT
          </span>

          <h1>
            Blood Requests
          </h1>

          <p>
            Monitor and manage blood requests across BloodConnect.
          </p>
        </div>

      </header>

      {/* Loading / Error */}

      {loading && (
        <p>Loading blood requests...</p>
      )}

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      {/* Statistics */}

      <section className="management-stats">

        <div className="management-stat">
          <span>📋</span>

          <div>
            <small>Total Requests</small>
            <strong>{totalCount}</strong>
          </div>
        </div>

        <div className="management-stat">
          <span>🟢</span>

          <div>
            <small>Active Requests</small>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="management-stat">
          <span>🚨</span>

          <div>
            <small>Urgent Requests</small>
            <strong>{urgentCount}</strong>
          </div>
        </div>

        <div className="management-stat">
          <span>✅</span>

          <div>
            <small>Completed</small>
            <strong>{completedCount}</strong>
          </div>
        </div>

      </section>

      {/* Main Card */}

      <section className="management-card">

        {/* Toolbar */}

        <div className="management-toolbar">

          <div className="admin-search">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search patient, hospital or district..."
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
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">
              All Status
            </option>

            <option value="Urgent">
              Urgent
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="ACCEPTED">
              Accepted
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>

        </div>

        {/* Table */}

        <div className="admin-data-table">

          <div className="data-table-header">

            <span>Patient</span>

            <span>Blood Group</span>

            <span>Hospital</span>

            <span>Location</span>

            <span>Status</span>

            <span>Action</span>

          </div>

          {sortedRequests.length === 0 ? (

            <div className="empty-management">

              <div>📋</div>

              <h2>
                No blood requests found
              </h2>

              <p>
                Try changing your search or filters.
              </p>

            </div>

          ) : (

            paginatedRequests.map((request) => (


              <div
                className="data-table-row"
                key={request.id}
              >

                {/* Patient */}

                <div className="table-person">

                  <div className="table-avatar">
                    {(request.patientName || "?").charAt(0)}
                  </div>

                  <div>

                    <strong>
                      {request.patientName}
                    </strong>

                    <small>
                      {request.createdAt
                        ? new Date(
                          request.createdAt
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                        : "-"}
                    </small>

                  </div>

                </div>

                {/* Blood Group */}

                <div>
                  <span className="table-blood">
                    {request.bloodGroup}
                  </span>
                </div>

                {/* Hospital */}

                <div className="table-location">

                  <strong>
                    {request.hospitalName}
                  </strong>

                  <small>
                    Hospital
                  </small>

                </div>

                {/* Location */}

                <div className="table-location">

                  <strong>
                    📍 {request.district}
                  </strong>

                  <small>
                    {request.state}
                  </small>

                </div>

                {/* Status */}

                <div>

                  <span
                    className={
                      request.urgent
                        ? "admin-status urgent"
                        : request.status === "COMPLETED"
                          ? "admin-status completed"
                          : request.status === "CANCELLED"
                            ? "admin-status inactive"
                            : "admin-status active"
                    }
                  >
                    {request.urgent
                      ? "Urgent"
                      : request.status}
                  </span>

                </div>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">
                    Newest First
                  </option>

                  <option value="oldest">
                    Oldest First
                  </option>
                </select>

                {/* Action */}
                <div className="admin-request-actions">
                  <button
                    className="admin-action-button"
                    onClick={() => setSelectedRequest(request)}
                  >
                    View
                  </button>

                  {request.status !== "COMPLETED" &&
                    request.status !== "CANCELLED" && (
                      <button
                        className="admin-action-button"
                        onClick={() =>
                          handleCancelRequest(request.id)
                        }
                      >
                        Cancel
                      </button>
                    )}
                </div>

              </div>

            ))

          )}

        </div>

      </section>
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {selectedRequest && (
        <div className="request-details-overlay">
          <div className="request-details-card">

            <div className="request-details-header">
              <div>
                <span className="hero-label">
                  BLOOD REQUEST DETAILS
                </span>
                <h2>{selectedRequest.patientName}</h2>
              </div>

              <button
                className="request-details-close"
                onClick={() => setSelectedRequest(null)}
              >
                ×
              </button>
            </div>


            <div className="request-details-grid">
              
              <div>
                <small>Receiver Name</small>
                <strong>
                  {selectedRequest.receiverName || "-"}
                </strong>
              </div>

              <div>
                <small>Receiver Email</small>
                <strong>
                  {selectedRequest.receiverEmail || "-"}
                </strong>
              </div>

              <div>
                <small>Receiver Phone</small>
                <strong>
                  {selectedRequest.receiverPhone || "-"}
                </strong>
              </div>
              <div>
                <small>Patient Age</small>
                <strong>
                  {selectedRequest.patientAge} years
                </strong>
              </div>

              <div>
                <small>Blood Group</small>
                <strong>
                  {selectedRequest.bloodGroup}
                </strong>
              </div>

              <div>
                <small>Status</small>
                <strong>
                  {selectedRequest.status}
                </strong>
              </div>

              <div>
                <small>Request Type</small>
                <strong>
                  {selectedRequest.urgent
                    ? "Urgent"
                    : "Normal"}
                </strong>
              </div>

              <div>
                <small>Hospital</small>
                <strong>
                  {selectedRequest.hospitalName}
                </strong>
              </div>

              <div>
                <small>Hospital Address</small>
                <strong>
                  {selectedRequest.hospitalAddress || "-"}
                </strong>
              </div>

              <div>
                <small>District</small>
                <strong>
                  {selectedRequest.district}
                </strong>
              </div>

              <div>
                <small>State</small>
                <strong>
                  {selectedRequest.state}
                </strong>
              </div>

              <div>
                <small>Location Type</small>
                <strong>
                  {selectedRequest.locationType || "-"}
                </strong>
              </div>

              <div>
                <small>Location</small>
                <strong>
                  {selectedRequest.location || "-"}
                </strong>
              </div>

              <div>
                <small>Accepted Donor</small>
                <strong>
                  {selectedRequest.acceptedByName || "Not accepted"}
                </strong>
              </div>

              <div>
                <small>Created At</small>
                <strong>
                  {selectedRequest.createdAt
                    ? new Date(
                      selectedRequest.createdAt
                    ).toLocaleString("en-IN")
                    : "-"}
                </strong>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default AdminBloodRequests;