package com.bloodconnect.controller;

import com.bloodconnect.dto.MessageDto;
import com.bloodconnect.entity.BloodRequest;
import com.bloodconnect.entity.Message;
import com.bloodconnect.entity.User;
import com.bloodconnect.repository.BloodRequestRepository;
import com.bloodconnect.repository.MessageRepository;
import com.bloodconnect.repository.UserRepository;

import jakarta.validation.Valid;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final MessageRepository messages;
    private final BloodRequestRepository requests;
    private final UserRepository users;
    private final SimpMessagingTemplate broker;

    public ChatController(
            MessageRepository messages,
            BloodRequestRepository requests,
            UserRepository users,
            SimpMessagingTemplate broker
    ) {
        this.messages = messages;
        this.requests = requests;
        this.users = users;
        this.broker = broker;
    }

    // =========================================================
    // GET CHAT HISTORY
    // =========================================================

    @GetMapping("/{requestId}")
    @Transactional(readOnly = true)
    public List<MessageView> history(
            @PathVariable Long requestId
    ) {

        List<Message> messageList =
                messages.findByRequestIdOrderByCreatedAtAsc(requestId);

        return messageList.stream()
                .map(MessageView::from)
                .toList();
    }

    // =========================================================
    // SEND MESSAGE - HTTP
    // =========================================================

    @PostMapping("/{requestId}")
    public MessageView send(
            @PathVariable Long requestId,
            @RequestParam Long senderId,
            @Valid @RequestBody MessageDto dto
    ) {

        Message m =
                save(
                        requestId,
                        senderId,
                        dto.content()
                );

        MessageView view =
                MessageView.from(m);

        broker.convertAndSend(
                "/topic/requests/" + requestId,
                view
        );

        return view;
    }

    // =========================================================
    // SAVE + BROADCAST MESSAGE - WEBSOCKET
    // =========================================================

    public Message saveAndBroadcast(
            Long requestId,
            Long senderId,
            String content
    ) {

        Message m =
                save(
                        requestId,
                        senderId,
                        content
                );

        broker.convertAndSend(
                "/topic/requests/" + requestId,
                MessageView.from(m)
        );

        return m;
    }

    // =========================================================
    // UNSEND MESSAGE
    // =========================================================
    @Transactional
    @DeleteMapping("/{requestId}/{messageId}")
    public void unsend(
            @PathVariable Long requestId,
            @PathVariable Long messageId,
            @RequestParam Long senderId
    ) {

        Message message =
                messages.findById(messageId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "Message not found."
                                )
                        );

        // Check that this message belongs to this chat
        if (
                !message.getRequest()
                        .getId()
                        .equals(requestId)
        ) {
            throw new IllegalArgumentException(
                    "Message does not belong to this chat."
            );
        }

        // Check that the logged-in user owns this message
        if (
                !message.getSender()
                        .getId()
                        .equals(senderId)
        ) {
            throw new IllegalArgumentException(
                    "You can only unsend your own messages."
            );
        }

        // Create the WebSocket event BEFORE deleting
        MessageView deletedMessage =
                MessageView.deleted(message);

        // Delete using request + sender + message ID
        int deleted =
                messages.deleteMessage(
                        messageId,
                        requestId,
                        senderId
                );

        if (deleted == 0) {
            throw new IllegalArgumentException(
                    "Unable to unsend message."
            );
        }

        // Notify both users
        broker.convertAndSend(
                "/topic/requests/" + requestId,
                deletedMessage
        );
    }
    // =========================================================
    // SAVE MESSAGE
    // =========================================================

    private Message save(
            Long requestId,
            Long senderId,
            String content
    ) {

        BloodRequest r =
                requests.findById(requestId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "Blood request not found."
                                )
                        );

        User s =
                users.findById(senderId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "Sender not found."
                                )
                        );

        // Only receiver or accepted donor can chat
        if (
                !s.getId()
                        .equals(r.getReceiver().getId())
                &&
                (
                        r.getAcceptedBy() == null
                        ||
                        !s.getId()
                                .equals(
                                        r.getAcceptedBy().getId()
                                )
                )
        ) {

            throw new IllegalArgumentException(
                    "You are not a participant in this chat."
            );
        }

        Message m =
                new Message();

        m.setRequest(r);

        m.setSender(s);

        m.setContent(
                content.trim()
        );

        // Always save new messages using Indian time
        m.setCreatedAt(
                LocalDateTime.now(
                        ZoneId.of("Asia/Kolkata")
                )
        );

        return messages.save(m);
    }

    // =========================================================
    // MESSAGE RESPONSE
    // =========================================================

    public record MessageView(
            Long id,
            Long requestId,
            Long senderId,
            String senderName,
            String senderRole,
            String content,
            LocalDateTime createdAt,
            String eventType
    ) {

        static MessageView from(
                Message m
        ) {

            return new MessageView(
                    m.getId(),
                    m.getRequest().getId(),
                    m.getSender().getId(),
                    m.getSender().getName(),
                    m.getSender().getRole().name(),
                    m.getContent(),
                    m.getCreatedAt(),
                    "MESSAGE"
            );
        }

        static MessageView deleted(
                Message m
        ) {

            return new MessageView(
                    m.getId(),
                    m.getRequest().getId(),
                    m.getSender().getId(),
                    m.getSender().getName(),
                    m.getSender().getRole().name(),
                    null,
                    m.getCreatedAt(),
                    "DELETED"
            );
        }
    }
}