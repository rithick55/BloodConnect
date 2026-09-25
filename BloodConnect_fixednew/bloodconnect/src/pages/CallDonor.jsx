import { useLocation, useNavigate } from "react-router-dom";

function CallDonor() {
  const navigate = useNavigate();
  const location = useLocation();

  const donor = location.state?.donor || location.state || null;
  const requestId = location.state?.requestId;

  if (!donor?.name) {
    return (
      <main className="call-page">
        <button className="back-button" onClick={() => navigate("/receiver-dashboard")}>← Back</button>
        <section className="call-card"><h1>Donor not found</h1><p>Please select a donor from the nearby donors list.</p></section>
      </main>
    );
  }

  return (
    <main className="call-page">

      <button
        className="back-button"
        onClick={() => navigate("/nearby-donors")}
      >
        ← Back
      </button>

      <section className="call-card">

        <div className="call-avatar">
          {donor.name.charAt(0)}
        </div>

        <span className="hero-label">
          CONTACT DONOR
        </span>

        <h1>{donor.name}</h1>

        <p className="call-subtitle">
          Nearby {donor.bloodGroup} blood donor
        </p>

        <div className="call-details">

          <div>
            <span>Blood Group</span>
            <strong>{donor.bloodGroup}</strong>
          </div>

          <div>
            <span>Location</span>
            <strong>📍 {donor.district}</strong>
          </div>

          <div>
            <span>Distance</span>
            <strong>{donor.distance}</strong>
          </div>

        </div>

        <div className="call-note">
          <span>ℹ️</span>

          <p>
            This donor is currently available.
            You can contact them regarding your blood request.
          </p>
        </div>

        <button
          className="start-call-button"
          onClick={() => {
            if (donor.phone) window.location.href = `tel:${donor.phone}`;
            else alert("This donor does not have a phone number yet.");
          }}
        >
          ☎ Call Donor
        </button>

        <button
          className="call-chat-button"
          onClick={() => navigate("/chat", { state: { requestId, donorId: donor.id, mode: "receiver" } })}
        >
          💬 Chat Instead
        </button>

      </section>

    </main>
  );
}

export default CallDonor;