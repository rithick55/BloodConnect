import { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { Client } from "@stomp/stompjs";

import SockJS from "sockjs-client";

import { useApp } from "../context/AppContext";

const API_URL = import.meta.env.VITE_API_URL;

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

  const [unsendingId, setUnsendingId] = useState(null);


  // =========================================================
  // LOAD ACCEPTED REQUEST
  // =========================================================

  useEffect(() => {

    if (
      !requestId ||
      !currentUser?.id ||
      !currentUser?.role
    ) {

      setLoadingRequest(false);

      return;

    }

    const controller =
      new AbortController();

    const loadRequest = async () => {

      try {

        setLoadingRequest(true);

        const endpoint =
          currentUser.role === "receiver"
            ? `${API_URL}/requests/receiver/${currentUser.id}`
            : `${API_URL}/requests/donor/${currentUser.id}`;

        const response =
          await fetch(
            endpoint,
            {
              signal:
                controller.signal,
            }
          );

        if (!response.ok) {

          throw new Error(
            "Unable to load blood request."
          );

        }

        const data =
          await response.json();

        if (controller.signal.aborted) {

          return;

        }

        const foundRequest =
          data.find(
            (item) =>
              String(item.id) ===
              String(requestId)
          );

        if (!foundRequest) {

          throw new Error(
            "Blood request not found."
          );

        }

        setRequest(foundRequest);


        // =====================================================
        // RECEIVER - LOAD ACCEPTED DONOR
        // =====================================================

        if (
          currentUser.role === "receiver" &&
          foundRequest.acceptedBy
        ) {

          try {

            const donorResponse =
              await fetch(
                `${API_URL}/donors?bloodGroup=${encodeURIComponent(
                  foundRequest.bloodGroup
                )}`,
                {
                  signal:
                    controller.signal,
                }
              );

            if (donorResponse.ok) {

              const donorData =
                await donorResponse.json();

              if (
                controller.signal.aborted
              ) {

                return;

              }

              const acceptedDonor =
                donorData.find(
                  (item) =>
                    String(item.id) ===
                    String(
                      foundRequest.acceptedBy
                    )
                );

              if (acceptedDonor) {

                setDonor(
                  acceptedDonor
                );

              }

            }

          } catch (error) {

            if (
              error.name !==
              "AbortError"
            ) {

              console.error(
                "Unable to load accepted donor:",
                error
              );

            }

          }

        }

      } catch (error) {

        if (
          error.name ===
          "AbortError"
        ) {

          return;

        }

        console.error(
          "Unable to load request:",
          error
        );

        setRequest(null);

      } finally {

        if (
          !controller.signal.aborted
        ) {

          setLoadingRequest(false);

        }

      }

    };

    loadRequest();

    return () => {

      controller.abort();

    };

  }, [
    requestId,
    currentUser?.id,
    currentUser?.role
  ]);


  // =========================================================
  // LOAD CHAT HISTORY
  // =========================================================

  useEffect(() => {

    if (!requestId) {

      setLoadingMessages(false);

      return;

    }

    const controller =
      new AbortController();

    const loadMessages = async () => {

      try {

        setLoadingMessages(true);

        const response =
          await fetch(
            `${API_URL}/chats/${requestId}`,
            {
              signal:
                controller.signal,
            }
          );

        if (!response.ok) {

          throw new Error(
            "Unable to load messages."
          );

        }

        const data =
          await response.json();

        if (
          controller.signal.aborted
        ) {

          return;

        }

        setConversation(data);

      } catch (error) {

        if (
          error.name !==
          "AbortError"
        ) {

          console.error(
            "Chat history error:",
            error
          );

        }

      } finally {

        if (
          !controller.signal.aborted
        ) {

          setLoadingMessages(false);

        }

      }

    };

    loadMessages();

    return () => {

      controller.abort();

    };

  }, [requestId]);


  // =========================================================
  // WEBSOCKET
  // =========================================================

  useEffect(() => {

    if (
      !requestId ||
      !currentUser?.id
    ) {

      return;

    }

    const wsBaseUrl =
      API_URL.replace(
        /\/api\/?$/,
        ""
      );

    const client =
      new Client({

        webSocketFactory: () =>
          new SockJS(
            `${wsBaseUrl}/ws`
          ),

        reconnectDelay: 5000,

        onConnect: () => {

          console.log(
            "WebSocket connected for request:",
            requestId
          );

          client.subscribe(
            `/topic/requests/${requestId}`,
            (message) => {

              try {

                const newMessage =
                  JSON.parse(
                    message.body
                  );


                  // =========================================
                  // MESSAGE WAS UNSENT
                  // =========================================

                  if (
                    newMessage.eventType ===
                    "DELETED"
                  ) {

                    setConversation(
                      (current) =>
                        current.map(
                          (item) =>
                            String(item.id) ===
                            String(
                              newMessage.id
                            )
                              ? {
                                  ...item,
                                  content:
                                    null,
                                  eventType:
                                    "DELETED",
                                }
                              : item
                        )
                    );

                    return;

                  }


                  // =========================================
                  // NORMAL NEW MESSAGE
                  // =========================================

                  setConversation(
                    (current) => {

                      const alreadyExists =
                        current.some(
                          (item) =>
                            String(
                              item.id
                            ) ===
                            String(
                              newMessage.id
                            )
                        );

                      if (
                        alreadyExists
                      ) {

                        return current;

                      }

                      return [
                        ...current,
                        newMessage,
                      ];

                    }
                  );

              } catch (error) {

                console.error(
                  "Unable to read WebSocket message:",
                  error
                );

              }

            }
          );

        },

        onDisconnect: () => {

          console.log(
            "WebSocket disconnected"
          );

        },

        onStompError: (frame) => {

          console.error(
            "WebSocket STOMP error:",
            frame
          );

        },

        onWebSocketError: (error) => {

          console.error(
            "WebSocket error:",
            error
          );

        },

      });

    client.activate();

    return () => {

      client.deactivate();

    };

  }, [
    requestId,
    currentUser?.id
  ]);


  // =========================================================
  // UNSEND MESSAGE
  // =========================================================

  const unsendMessage =
    async (messageId) => {

      if (
        !currentUser?.id ||
        !messageId ||
        unsendingId
      ) {

        return;

      }

      try {

        setUnsendingId(
          messageId
        );

        const response =
          await fetch(
            `${API_URL}/chats/${requestId}/${messageId}?senderId=${currentUser.id}`,
            {
              method: "DELETE",
            }
          );

        if (!response.ok) {

          let errorMessage =
            "Unable to unsend message.";

          try {

            const data =
              await response.json();

            errorMessage =
              data.message ||
              errorMessage;

          } catch {

            // Ignore JSON parsing error

          }

          throw new Error(
            errorMessage
          );

        }

        // WebSocket will update both users

      } catch (error) {

        console.error(
          "Unable to unsend message:",
          error
        );

        alert(
          error.message ||
          "Unable to unsend message."
        );

      } finally {

        setUnsendingId(null);

      }

    };


  // =========================================================
  // LOADING REQUEST
  // =========================================================

  if (loadingRequest) {

    return (
      <main className="chat-page">

        <div className="no-donors">

          <div>
            💬
          </div>

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


  // =========================================================
  // REQUEST NOT FOUND
  // =========================================================

  if (!request) {

    return (
      <main className="chat-page">

        <div className="no-donors">

          <div>
            💬
          </div>

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


  // =========================================================
  // CHAT ONLY AFTER ACCEPTANCE
  // =========================================================

  if (
    request.status?.toLowerCase() !==
      "accepted" &&
    request.status?.toLowerCase() !==
      "completed"
  ) {

    return (
      <main className="chat-page">

        <div className="no-donors">

          <div>
            💬
          </div>

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


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage =
    async () => {

      if (
        !message.trim() ||
        sending ||
        !currentUser?.id
      ) {

        return;

      }

      try {

        setSending(true);

        const wsBaseUrl =
          API_URL.replace(
            /\/api\/?$/,
            ""
          );

        const tempClient =
          new Client({

            webSocketFactory: () =>
              new SockJS(
                `${wsBaseUrl}/ws`
              ),

            reconnectDelay: 0,

          });

        tempClient.onConnect =
          () => {

            tempClient.publish({

              destination:
                `/app/chat/${requestId}`,

              body:
                JSON.stringify({

                  senderId:
                    currentUser.id,

                  content:
                    message.trim(),

                }),

            });

            setMessage("");

            setSending(false);

            tempClient.deactivate();

          };

        tempClient.onStompError =
          (frame) => {

            console.error(
              "Unable to send WebSocket message:",
              frame
            );

            setSending(false);

            tempClient.deactivate();

          };

        tempClient.activate();

      } catch (error) {

        console.error(
          "Send message error:",
          error
        );

        setSending(false);

      }

    };


  // =========================================================
  // OTHER USER NAME
  // =========================================================

  const otherName =
    currentUser?.role === "donor"
      ? request.patientName
      : request.acceptedByName ||
        donor?.name ||
        "Donor";


  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate =
    (date) => {

      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    };


  // =========================================================
  // TIME FORMAT
  // =========================================================

  const formatTime =
    (date) => {

      return new Date(
        date
      ).toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      );

    };


  // =========================================================
  // UI
  // =========================================================

  return (

    <main className="chat-page">

      {/* ================================================ */}
      {/* HEADER */}
      {/* ================================================ */}

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


      {/* ================================================ */}
      {/* REQUEST INFORMATION */}
      {/* ================================================ */}

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


      {/* ================================================ */}
      {/* CHAT */}
      {/* ================================================ */}

      <section className="chat-container">

        <div className="messages">

          {loadingMessages ? (

            <p className="chat-empty">
              Loading messages...
            </p>

          ) : conversation.length === 0 ? (

            <p className="chat-empty">
              No messages yet. Start the conversation.
            </p>

          ) : (

            conversation.map(
              (item) => {

                const isMine =
                  String(
                    item.senderId
                  ) ===
                  String(
                    currentUser?.id
                  );

                const isDeleted =
                  item.eventType ===
                  "DELETED" ||
                  item.content === null;


                return (

                  <div
                    key={item.id}
                    className={
                      isMine
                        ? "message donor-message"
                        : "message receiver-message"
                    }
                  >

                    {/* ================================= */}
                    {/* MESSAGE CONTENT */}
                    {/* ================================= */}

                    {isDeleted ? (

                      <p
                        style={{
                          fontStyle:
                            "italic",
                          opacity: 0.65,
                        }}
                      >
                        This message was unsent
                      </p>

                    ) : (

                      <p>
                        {item.content}
                      </p>

                    )}


                    {/* ================================= */}
                    {/* DATE + TIME */}
                    {/* ================================= */}

                    <span>

                      {formatDate(
                        item.createdAt
                      )}

                      {" • "}

                      {formatTime(
                        item.createdAt
                      )}

                    </span>


                    {/* ================================= */}
                    {/* UNSEND BUTTON */}
                    {/* ================================= */}

                    {isMine &&
                      !isDeleted && (

                        <button
                          type="button"
                          onClick={() =>
                            unsendMessage(
                              item.id
                            )
                          }
                          disabled={
                            unsendingId ===
                            item.id
                          }
                          style={{
                            display:
                              "block",
                            marginTop:
                              "5px",
                            fontSize:
                              "12px",
                            cursor:
                              "pointer",
                            border:
                              "none",
                            background:
                              "transparent",
                            textDecoration:
                              "underline",
                          }}
                        >

                          {unsendingId ===
                          item.id
                            ? "Unsending..."
                            : "Unsend"}

                        </button>

                    )}

                  </div>

                );

              }
            )

          )}

        </div>


        {/* ============================================== */}
        {/* INPUT */}
        {/* ============================================== */}

        <div className="chat-input-area">

          <input
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            onKeyDown={(e) => {

              if (
                e.key === "Enter"
              ) {

                sendMessage();

              }

            }}
            placeholder="Type a message..."
          />

          <button
            onClick={
              sendMessage
            }
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