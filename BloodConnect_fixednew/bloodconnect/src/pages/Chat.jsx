import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function Chat() {
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser } = useApp();

  const requestId = location.state?.requestId;

  const [request, setRequest] = useState(null);
  const [donor, setDonor] = useState(null);

  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);

  // Load the accepted request from backend
  useEffect(() => {
    if (!requestId || !currentUser?.id || !currentUser?.role) {
      setLoadingRequest(false);
      return;
    }

    const loadRequest = async () => {
      try {
        setLoadingRequest(true);

        const endpoint =
          currentUser.role === "receiver"
            ? `http://localhost:8090/api/requests/receiver/${currentUser.id}`
            : `http://localhost:8090/api/requests/donor/${currentUser.id}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Unable to load blood request.");
        }

        const data = await response.json();

        const foundRequest = data.find(
          (item) => String(item.id) === String(requestId)
        );

        if (!foundRequest) {
          throw new Error("Blood request not found.");
        }

        setRequest(foundRequest);

        // For receiver, get the accepted donor
        if (
          currentUser.role === "receiver" &&
          foundRequest.acceptedBy
        ) {
          try {
            const donorResponse = await fetch(
              `http://localhost:8090/api/donors?bloodGroup=${encodeURIComponent(
                foundRequest.bloodGroup
              )}`
            );

            if (donorResponse.ok) {
              const donorData = await donorResponse.json();

              const acceptedDonor = donorData.find(
                (item) =>
                  String(item.id) ===
                  String(foundRequest.acceptedBy)
              );

              if (acceptedDonor) {
                setDonor(acceptedDonor);
              }
            }
          } catch (error) {
            console.error(
              "Unable to load accepted donor:",
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "Unable to load request:",
          error
        );
        setRequest(null);
      } finally {
        setLoadingRequest(false);
      }
    };

    loadRequest();
  }, [requestId, currentUser?.id, currentUser?.role]);

  // Load chat history from backend
  useEffect(() => {
    if (!requestId) {
      setLoadingMessages(false);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);

        const response = await fetch(
          `http://localhost:8090/api/chats/${requestId}`
        );

        if (!response.ok) {
          throw new Error("Unable to load messages.");
        }

        const data = await response.json();

        setConversation(data);
      } catch (error) {
        console.error(
          "Chat history error:",
          error
        );
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [requestId]);

  // Check for new messages automatically
  useEffect(() => {
    if (!requestId) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `http://localhost:8090/api/chats/${requestId}`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setConversation((current) => {
          if (data.length !== current.length) {
            return data;
          }

          return current;
        });
      } catch (error) {
        console.error("Unable to check new messages:", error);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [requestId]);

  // Loading request
  if (loadingRequest) {
    return (
      <main className="chat-page">
        <div className="no-donors">
          <div>💬</div>

          <h2>
            Loading conversation...
          </h2>

          <p>
            Please wait while we load your conversation.
          </p>
        </div>
      </main>
    );
  }

  // Request not found
  if (!request) {
    return (
      <main className="chat-page">
        <div className="no-donors">
          <div>💬</div>

          <h2>
            Chat not available
          </h2>

          <p>
            We could not find this blood request.
          </p>

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

  // Chat only after acceptance
  if (
  request.status?.toLowerCase() !== "accepted" &&
  request.status?.toLowerCase() !== "completed"
) {
    return (
      <main className="chat-page">
        <div className="no-donors">
          <div>💬</div>

          <h2>
            Chat not available
          </h2>

          <p>
            The donor must accept the blood request
            before you can chat.
          </p>

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

  // Send message to backend
  const sendMessage = async () => {
    if (
      !message.trim() ||
      sending ||
      !currentUser?.id
    ) {
      return;
    }

    try {
      setSending(true);

      const response = await fetch(
        `http://localhost:8090/api/chats/${request.id}?senderId=${currentUser.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: message.trim(),
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          message: text,
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to send message."
        );
      }

      setConversation((current) => [
        ...current,
        data,
      ]);

      setMessage("");
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );
    } finally {
      setSending(false);
    }
  };

  const otherName =
    currentUser?.role === "donor"
      ? request.patientName
      : request.acceptedByName || donor?.name || "Donor";

  return (
    <main className="chat-page">

      <div className="chat-header">

        <button
          className="back-button"
          onClick={() =>
            navigate("/chats")
          }
        >
          ← Back
        </button>

        <div className="chat-user">

          <div className="chat-avatar">
            {otherName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>

            <h1>
              {otherName}
            </h1>

            <span>
              🟢 Request {request.status}
            </span>

          </div>

        </div>

      </div>

      <div className="chat-request-info">

        <div>
          <span>
            Blood Group
          </span>

          <strong>
            {request.bloodGroup}
          </strong>
        </div>

        <div>
          <span>
            Hospital
          </span>

          <strong>
            {request.hospitalName}
          </strong>
        </div>

        <div>
          <span>
            Location
          </span>

          <strong>
            {request.district}
          </strong>
        </div>

      </div>

      <section className="chat-container">

        <div className="messages">

          {loadingMessages ? (
            <p className="chat-empty">
              Loading messages...
            </p>
          ) : conversation.length === 0 ? (
            <p className="chat-empty">
              No messages yet. Start the
              conversation.
            </p>
          ) : (
            conversation.map((item) => (
              <div
                key={item.id}
                className={
                  item.senderId ===
                    currentUser?.id
                    ? "message donor-message"
                    : "message receiver-message"
                }
              >

                <p>
                  {item.content}
                </p>

                <span>
                  {new Date(
                    item.createdAt
                  ).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>

              </div>
            ))
          )}

        </div>

        <div className="chat-input-area">

          <input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Type a message..."
          />

          <button
            onClick={sendMessage}
            disabled={
              !message.trim() ||
              sending
            }
          >
            ➤
          </button>

        </div>

      </section>

    </main>
  );
}

export default Chat;