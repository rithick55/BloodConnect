import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

function Leaderboard() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/donors/leaderboard`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load leaderboard."
          );
        }

        setDonors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(
          "Unable to load leaderboard:",
          error
        );

        setError(
          error.message || "Unable to load leaderboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <main className="leaderboard-page">

      {/* Header */}

      <div className="leaderboard-header">

        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <span className="hero-label">
          DONOR COMMUNITY
        </span>

        <h1>Top Donors</h1>

        <p>
          Recognizing people who make a difference
          through blood donation.
        </p>

      </div>


      {/* Top Three */}

      <section className="top-donors">

        {donors.slice(0, 3).map((donor, index) => (

          <article
            className={`top-donor-card rank-${index + 1}`}
            key={donor.id}
          >

            <div className="rank">
              {index === 0
                ? "🥇"
                : index === 1
                  ? "🥈"
                  : "🥉"}
            </div>

            <div className="leader-avatar">
              {donor.name.charAt(0)}
            </div>

            <h2>{donor.name}</h2>

            <span className="leader-blood">
              {donor.bloodGroup}
            </span>

            <p>
              📍 {donor.district}
            </p>

            <strong>
              {donor.donations}
            </strong>

            <small>
              Donations
            </small>

          </article>

        ))}

      </section>


      {/* Remaining Donors */}

      <section className="leaderboard-list">

        <div className="leaderboard-list-header">
          <span>Rank</span>
          <span>Donor</span>
          <span>Blood Group</span>
          <span>Donations</span>
        </div>

        {donors.slice(3).map((donor, index) => (

          <article
            className="leaderboard-row"
            key={donor.id}
          >

            <div className="leader-rank">
              {index + 4}
            </div>

            <div className="leader-person">

              <div className="small-leader-avatar">
                {donor.name.charAt(0)}
              </div>

              <div>
                <strong>{donor.name}</strong>
                <span>
                  📍 {donor.district}
                </span>
              </div>

            </div>

            <div className="leader-blood">
              {donor.bloodGroup}
            </div>

            <div className="donation-count">
              {donor.donations}
            </div>

          </article>

        ))}

      </section>


      {/* Bottom Message */}

      <div className="leaderboard-note">

        <span>🩸</span>

        <p>
          Every donation matters. Your contribution
          can help someone when they need it most.
        </p>

      </div>

    </main>
  );
}

export default Leaderboard;