import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

function BloodRequest() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    requests,
    donors,
    currentUser,
    acceptRequest,
    openChat,
  } = useApp();

  const requestId = location.state?.requestId;

  const request = requestId
    ? requests.find((item) => item.id === requestId)
    : null;

  if (!request) {
    return (
      <main className="blood-request-page">
        <div className="no-donors">
          <div>🩸</div>
          <h2>Request not found</h2>
          <p>Please select a valid blood request from the dashboard.</p>

          <button
            className="find-donors-button"
            onClick={() =>
              navigate(
                currentUser?.role === "donor"
                  ? "/donor-dashboard"
                  : "/receiver-dashboard"
              )
            }
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const accepted = request.status === "accepted";

  const canAccept =
    currentUser?.role === "donor" && !accepted;

  // Find the donor who accepted this request
  const acceptedDonor = donors.find(
    (donor) => String(donor.id) === String(request.acceptedBy)
  );

  const openRequestChat = () => {
    if (!accepted) return;

    openChat(
      request.id,
      request.acceptedBy || acceptedDonor?.id
    );

    navigate("/chat", {
      state: {
        requestId: request.id,
        donorId: request.acceptedBy || acceptedDonor?.id,
        mode: currentUser?.role,
      },
    });
  };

  const openRequestCall = () => {
    if (!accepted || !acceptedDonor) return;

    navigate("/call-donor", {
      state: {
        donor: acceptedDonor,
        requestId: request.id,
      },
    });
  };

  const handleAccept = async () => {
  try {
    await acceptRequest(request.id);
  } catch (error) {
    console.error("Unable to accept request:", error);
  }
};

  return (
    <main className="blood-request-page">

      <div className="request-page-header">
        <button
          className="back-button"
          onClick={() =>
            navigate(
              currentUser?.role === "donor"
                ? "/donor-dashboard"
                : "/receiver-dashboard"
            )
          }
        >
          ← Back
        </button>

        <span className="hero-label">BLOOD REQUEST</span>

        <h1>Someone needs your help.</h1>

        <p>Review the request before responding.</p>
      </div>

      <section className="request-detail-card">

        <div className="request-detail-top">
          <div className="large-blood-group">
            {request.bloodGroup}
          </div>

          <div>
            <div className="request-status-row">
              <span className="request-status">
                ● {accepted ? "Request Accepted" : "Blood Needed"}
              </span>

              {request.urgent && (
                <span className="urgent-badge">
                  Urgent
                </span>
              )}
            </div>

            <h2>
              Blood required for {request.patientName}
            </h2>

            <p>
              Patient needs {request.bloodGroup} blood.
            </p>
          </div>
        </div>

        {/* Patient Details */}
        <div className="request-info-section">
          <h3>Patient Details</h3>

          <div className="request-info-grid">
            <div>
              <span>Patient Name</span>
              <strong>{request.patientName}</strong>
            </div>

            <div>
              <span>Age</span>
              <strong>{request.patientAge}</strong>
            </div>

            <div>
              <span>Blood Group</span>
              <strong>{request.bloodGroup}</strong>
            </div>
          </div>
        </div>

        {/* Hospital Details */}
        <div className="request-info-section">
          <h3>Hospital Details</h3>

          <div className="hospital-detail">
            <div className="hospital-icon">🏥</div>

            <div>
              <strong>{request.hospitalName}</strong>

              <p>
                📍 {request.district}, {request.state}
              </p>

              <span>
                {request.hospitalAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="request-actions">

          {/* DONOR BEFORE ACCEPTING */}
          {canAccept && (
            <>
              <button
                className="accept-request-button"
                onClick={handleAccept}
              >
                ✓ Accept Request
              </button>

              <p className="request-action-note">
                Accept this request to enable Chat and Call.
              </p>
            </>
          )}

          {/* ACCEPTED */}
          {accepted && (
            <>
              <div className="request-accepted-message">
                <span>✓</span>

                <div>
                  <strong>Request accepted</strong>

                  <p>
                    You can now communicate about this
                    blood request.
                  </p>
                </div>
              </div>

              <div className="request-contact-buttons">

                <button
                  className="chat-request-button"
                  onClick={openRequestChat}
                >
                  💬 Chat
                </button>

                <button
                  className="call-button"
                  onClick={openRequestCall}
                  disabled={!acceptedDonor}
                >
                  ☎ Call
                </button>

              </div>
            </>
          )}

        </div>
      </section>

      <div className="request-note">
        <span>ℹ️</span>

        <p>
          Please make sure you are healthy and eligible
          to donate before accepting a request.
        </p>
      </div>

    </main>
  );
}

export default BloodRequest;