package com.bloodconnect.controller;

import com.bloodconnect.dto.MessageDto;
import com.bloodconnect.entity.BloodRequest;
import com.bloodconnect.entity.ChatDeletion;
import com.bloodconnect.entity.Message;
import com.bloodconnect.entity.User;
import com.bloodconnect.repository.BloodRequestRepository;
import com.bloodconnect.repository.ChatDeletionRepository;
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
    private final ChatDeletionRepository chatDeletions;
    private final SimpMessagingTemplate broker;

    public ChatController(
            MessageRepository messages,
            BloodRequestRepository requests,
            UserRepository users,
            ChatDeletionRepository chatDeletions,
            SimpMessagingTemplate broker
    ) {
        this.messages = messages;
        this.requests = requests;
        this.users = users;
        this.chatDeletions = chatDeletions;
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
    @Transactional
    public MessageView send(
            @PathVariable Long requestId,
            @RequestParam Long senderId,
            @Valid @RequestBody MessageDto dto
    ) {

        /*
         * IMPORTANT:
         * Previously this was passing null as replyToId.
         *
         * That meant the frontend could select a message to reply to,
         * but the backend was not saving that reply relationship.
         */

        Message m = save(
                requestId,
                senderId,
                dto.content(),
                dto.replyToId()
        );

        MessageView view = MessageView.from(m);

        broker.convertAndSend(
                "/topic/requests/" + requestId,
                view
        );

        return view;
    }

    // =========================================================
    // SAVE + BROADCAST MESSAGE - WEBSOCKET
    // =========================================================

    @Transactional
    public void saveAndBroadcast(
            Long requestId,
            Long senderId,
            String content,
            Long replyToId
    ) {

        Message message = save(
                requestId,
                senderId,
                content,
                replyToId
        );

        MessageView view = MessageView.from(message);

        broker.convertAndSend(
                "/topic/requests/" + requestId,
                view
        );
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

        // Check message belongs to this chat
        if (
                !message.getRequest()
                        .getId()
                        .equals(requestId)
        ) {
            throw new IllegalArgumentException(
                    "Message does not belong to this chat."
            );
        }

        // Check sender owns this message
        if (
                !message.getSender()
                        .getId()
                        .equals(senderId)
        ) {
            throw new IllegalArgumentException(
                    "You can only unsend your own messages."
            );
        }

        // Create event BEFORE deleting
        MessageView deletedMessage =
                MessageView.deleted(message);

        // Remove reply references first
        messages.clearRepliesToMessage(messageId);

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
            String content,
            Long replyToId
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
                !s.getId().equals(
                        r.getReceiver().getId()
                )
                &&
                (
                        r.getAcceptedBy() == null
                        ||
                        !s.getId().equals(
                                r.getAcceptedBy().getId()
                        )
                )
        ) {
            throw new IllegalArgumentException(
                    "You are not a participant in this chat."
            );
        }

        Message m = new Message();

        m.setRequest(r);
        m.setSender(s);
        m.setContent(content.trim());

        m.setCreatedAt(
                LocalDateTime.now(
                        ZoneId.of("Asia/Kolkata")
                )
        );

        // =====================================================
        // REPLY MESSAGE
        // =====================================================

        if (replyToId != null) {

            Message replyTo =
                    messages.findById(replyToId)
                            .orElseThrow(
                                    () -> new IllegalArgumentException(
                                            "Reply message not found."
                                    )
                            );

            // Make sure the replied message belongs
            // to the same blood request/chat
            if (
                    !replyTo.getRequest()
                            .getId()
                            .equals(requestId)
            ) {
                throw new IllegalArgumentException(
                        "Reply message does not belong to this chat."
                );
            }

            // Save the relationship
            m.setReplyTo(replyTo);
        }

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

            String eventType,

            Long replyToId,

            String replyToSenderName,

            String replyToContent

    ) {

        static MessageView from(Message m) {

            Message reply = m.getReplyTo();

            return new MessageView(

                    m.getId(),

                    m.getRequest().getId(),

                    m.getSender().getId(),

                    m.getSender().getName(),

                    m.getSender().getRole().name(),

                    m.getContent(),

                    m.getCreatedAt(),

                    "MESSAGE",

                    reply != null
                            ? reply.getId()
                            : null,

                    reply != null
                            ? reply.getSender().getName()
                            : null,

                    reply != null
                            ? reply.getContent()
                            : null
            );
        }

        static MessageView deleted(Message m) {

            Message reply = m.getReplyTo();

            return new MessageView(

                    m.getId(),

                    m.getRequest().getId(),

                    m.getSender().getId(),

                    m.getSender().getName(),

                    m.getSender().getRole().name(),

                    null,

                    m.getCreatedAt(),

                    "DELETED",

                    reply != null
                            ? reply.getId()
                            : null,

                    reply != null
                            ? reply.getSender().getName()
                            : null,

                    reply != null
                            ? reply.getContent()
                            : null
            );
        }
    }

    // =========================================================
    // DELETE ENTIRE CHAT FOR USER
    // =========================================================

    @Transactional
    @DeleteMapping("/{requestId}/conversation")
    public void deleteConversation(
            @PathVariable Long requestId,
            @RequestParam Long userId
    ) {

        BloodRequest request =
                requests.findById(requestId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "Blood request not found."
                                )
                        );

        User user =
                users.findById(userId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "User not found."
                                )
                        );

        boolean isReceiver =
                request.getReceiver()
                        .getId()
                        .equals(userId);

        boolean isDonor =
                request.getAcceptedBy() != null
                &&
                request.getAcceptedBy()
                        .getId()
                        .equals(userId);

        if (!isReceiver && !isDonor) {

            throw new IllegalArgumentException(
                    "You are not a participant in this chat."
            );
        }

        // Remove reply references first
        messages.clearRepliesByRequestId(requestId);

        // Remove existing messages
        messages.deleteByRequestId(requestId);

        // Remember deletion
        if (
                !chatDeletions
                        .existsByRequestIdAndUserId(
                                requestId,
                                userId
                        )
        ) {

            ChatDeletion deletion =
                    new ChatDeletion();

            deletion.setRequest(request);
            deletion.setUser(user);

            deletion.setDeletedAt(
                    LocalDateTime.now(
                            ZoneId.of("Asia/Kolkata")
                    )
            );

            chatDeletions.save(deletion);
        }

        // Notify chat page
        broker.convertAndSend(
                "/topic/requests/" + requestId,

                new MessageView(

                        null,

                        requestId,

                        userId,

                        user.getName(),

                        user.getRole().name(),

                        null,

                        LocalDateTime.now(
                                ZoneId.of("Asia/Kolkata")
                        ),

                        "CHAT_DELETED",

                        null,

                        null,

                        null
                )
        );
    }
}