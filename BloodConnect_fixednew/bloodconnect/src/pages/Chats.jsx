import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function Chats() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    if (!currentUser?.id || !currentUser?.role) {
      setLoading(false);
      return;
    }

    const loadConversations = async () => {
      try {
        setLoading(true);

        const endpoint =
          currentUser.role === "receiver"
            ? `http://localhost:8090/api/requests/receiver/${currentUser.id}`
            : `http://localhost:8090/api/requests/donor/${currentUser.id}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Unable to load conversations.");
        }

        const data = await response.json();

        const acceptedRequests = data.filter(
          (request) =>
            request.status?.toLowerCase() === "accepted" ||
            request.status?.toLowerCase() === "completed"
        );

        setConversations(acceptedRequests);
      } catch (error) {
        console.error("Unable to load conversations:", error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser?.id, currentUser?.role]);

  const markBloodReceived = async (requestId) => {
    if (!currentUser?.id) return;

    try {
      setCompletingId(requestId);

      const response = await fetch(
        `http://localhost:8090/api/requests/${requestId}/complete?receiverId=${currentUser.id}`,
        {
          method: "PUT",
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
        throw new Error(
          data.message || "Unable to confirm blood received."
        );
      }

      setConversations((current) =>
        current.map((request) =>
          request.id === requestId
            ? { ...request, status: "completed" }
            : request
        )
      );
    } catch (error) {
      console.error(
        "Unable to confirm blood received:",
        error
      );

      alert(
        error.message ||
          "Unable to confirm blood received."
      );
    } finally {
      setCompletingId(null);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <main className="chat-list-page">

      <div className="chat-list-header">

        <button
          className="back-button"
          onClick={() =>
            navigate(
              currentUser.role === "donor"
                ? "/donor-dashboard"
                : "/receiver-dashboard"
            )
          }
        >
          ← Back
        </button>

        <span className="hero-label">
          MESSAGES
        </span>

        <h1>
          Your Conversations
        </h1>

        <p>
          Your chats stay available here after you leave the chat screen.
        </p>

      </div>

      <section className="conversation-list">

        {loading && (
          <div className="no-donors">
            <div>💬</div>

            <h2>
              Loading conversations...
            </h2>
          </div>
        )}

        {!loading &&
          conversations.map((request) => {

            const otherName =
              currentUser.role === "donor"
                ? request.patientName
                : request.acceptedByName || "Donor";

            return (
              <div
                key={request.id}
                className="conversation-wrapper"
              >

                <button
                  className="conversation-card"
                  onClick={() =>
                    navigate("/chat", {
                      state: {
                        requestId: request.id,
                        donorId: request.acceptedBy,
                        mode: currentUser.role,
                      },
                    })
                  }
                >

                  <div className="conversation-avatar">
                    {otherName.charAt(0).toUpperCase()}
                  </div>

                  <div className="conversation-content">

                    <div className="conversation-top">

                      <strong>
                        {otherName}
                      </strong>

                      <span>
                        {request.bloodGroup}
                      </span>

                    </div>

                    <p>
                      Open conversation
                    </p>

                    <small>
                      {request.hospitalName}
                      {" • "}
                      {request.district}

                      {request.urgent &&
                        " • 🚨 Emergency"}
                    </small>

                  </div>

                  <strong className="conversation-arrow">
                    →
                  </strong>

                </button>

                {currentUser.role === "receiver" &&
                  request.status?.toLowerCase() === "accepted" && (

                    <button
                      className="accept-request-button"
                      disabled={completingId === request.id}
                      onClick={() =>
                        markBloodReceived(request.id)
                      }
                    >
                      {completingId === request.id
                        ? "Confirming..."
                        : "✓ Received Blood"}
                    </button>

                  )}

              </div>
            );
          })}

        {!loading && conversations.length === 0 && (

          <div className="no-donors">

            <div>💬</div>

            <h2>
              No conversations yet
            </h2>

            <p>
              Start a chat with a donor, or accept a blood
              request to begin a conversation.
            </p>

            <button
              className="find-donors-button"
              onClick={() =>
                navigate(
                  currentUser.role === "donor"
                    ? "/donor-dashboard"
                    : "/receiver-dashboard"
                )
              }
            >
              Go to Dashboard
            </button>

          </div>

        )}

      </section>

    </main>
  );
}

export default Chats;