package com.bloodconnect.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import com.bloodconnect.dto.MessageView;
import com.bloodconnect.dto.NotificationView;
import com.bloodconnect.entity.BloodRequest;
import com.bloodconnect.entity.Message;
import com.bloodconnect.entity.User;
import com.bloodconnect.repository.BloodRequestRepository;
import com.bloodconnect.repository.MessageRepository;
import com.bloodconnect.repository.UserRepository;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final MessageRepository messageRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate broker;

    public ChatController(
            MessageRepository messageRepository,
            BloodRequestRepository bloodRequestRepository,
            UserRepository userRepository,
            SimpMessagingTemplate broker
    ) {
        this.messageRepository = messageRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.userRepository = userRepository;
        this.broker = broker;
    }

    // =========================================================
    // GET CHAT HISTORY
    // =========================================================

    @GetMapping("/{requestId}")
    public ResponseEntity<List<MessageView>> getMessages(
            @PathVariable Long requestId
    ) {

        List<Message> messages =
                messageRepository.findByRequestIdOrderByCreatedAtAsc(requestId);

        List<MessageView> result =
                messages.stream()
                        .map(MessageView::from)
                        .toList();

        return ResponseEntity.ok(result);
    }


    // =========================================================
    // SAVE MESSAGE
    // =========================================================

    @Transactional
    public Message save(
            Long requestId,
            Long senderId,
            String content,
            Long replyToId
    ) {

        BloodRequest request =
                bloodRequestRepository.findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException("Blood request not found")
                        );

        User sender =
                userRepository.findById(senderId)
                        .orElseThrow(() ->
                                new RuntimeException("Sender not found")
                        );

        // -----------------------------------------------------
        // CHECK PARTICIPANTS
        // -----------------------------------------------------

        boolean isReceiver =
                request.getReceiver() != null
                        && request.getReceiver().getId().equals(senderId);

        boolean isAcceptedDonor =
                request.getAcceptedBy() != null
                        && request.getAcceptedBy().getId().equals(senderId);

        if (!isReceiver && !isAcceptedDonor) {
            throw new RuntimeException(
                    "You are not allowed to send messages for this request"
            );
        }

        // -----------------------------------------------------
        // CREATE MESSAGE
        // -----------------------------------------------------

        Message message = new Message();

        message.setRequest(request);
        message.setSender(sender);
        message.setContent(content);

        // -----------------------------------------------------
        // REPLY MESSAGE
        // -----------------------------------------------------

        if (replyToId != null) {

            Message replyTo =
                    messageRepository.findById(replyToId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Reply message not found"
                                    )
                            );

            message.setReplyTo(replyTo);
        }

        // -----------------------------------------------------
        // SAVE
        // -----------------------------------------------------

        return messageRepository.save(message);
    }


    // =========================================================
    // SAVE + BROADCAST MESSAGE
    // =========================================================

    @Transactional
    public void saveAndBroadcast(
            Long requestId,
            Long senderId,
            String content,
            Long replyToId
    ) {

        Message message =
                save(
                        requestId,
                        senderId,
                        content,
                        replyToId
                );

        // -----------------------------------------------------
        // BROADCAST CHAT MESSAGE
        // -----------------------------------------------------

        MessageView view =
                MessageView.from(message);

        broker.convertAndSend(
                "/topic/requests/" + requestId,
                view
        );

        // -----------------------------------------------------
        // SEND NOTIFICATION TO OTHER USER
        // -----------------------------------------------------

        sendMessageNotification(message);
    }


    // =========================================================
    // SEND CHAT MESSAGE NOTIFICATION
    // =========================================================

    private void sendMessageNotification(
            Message message
    ) {

        BloodRequest request =
                message.getRequest();

        User sender =
                message.getSender();

        if (request == null || sender == null) {
            return;
        }

        User recipient = null;

        // -----------------------------------------------------
        // RECEIVER SENT MESSAGE
        // → NOTIFY DONOR
        // -----------------------------------------------------

        if (
                request.getReceiver() != null
                        && request.getReceiver()
                        .getId()
                        .equals(sender.getId())
        ) {

            recipient =
                    request.getAcceptedBy();
        }

        // -----------------------------------------------------
        // DONOR SENT MESSAGE
        // → NOTIFY RECEIVER
        // -----------------------------------------------------

        else if (
                request.getAcceptedBy() != null
                        && request.getAcceptedBy()
                        .getId()
                        .equals(sender.getId())
        ) {

            recipient =
                    request.getReceiver();
        }

        // -----------------------------------------------------
        // NO RECIPIENT
        // -----------------------------------------------------

        if (recipient == null) {
            return;
        }

        // -----------------------------------------------------
        // CREATE NOTIFICATION
        // -----------------------------------------------------

        NotificationView notification =
                new NotificationView(
                        "CHAT_MESSAGE",
                        request.getId(),
                        sender.getId(),
                        sender.getName(),
                        message.getContent(),
                        message.getCreatedAt()
                );

        // -----------------------------------------------------
        // SEND TO RECIPIENT ONLY
        // -----------------------------------------------------

        broker.convertAndSend(
                "/topic/notifications/" + recipient.getId(),
                notification
        );

        System.out.println(
                "NOTIFICATION SENT: "
                        + sender.getName()
                        + " -> "
                        + recipient.getName()
        );
    }


    // =========================================================
    // DELETE / UNSEND MESSAGE
    // =========================================================

    @DeleteMapping("/{messageId}")
    @Transactional
    public ResponseEntity<?> deleteMessage(
            @PathVariable Long messageId
    ) {

        Message message =
                messageRepository.findById(messageId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Message not found"
                                )
                        );

        Long requestId =
                message.getRequest().getId();

        MessageView deleted =
                MessageView.deleted(message);

        messageRepository.delete(message);

        // -----------------------------------------------------
        // BROADCAST DELETED MESSAGE
        // -----------------------------------------------------

        broker.convertAndSend(
                "/topic/requests/" + requestId,
                deleted
        );

        return ResponseEntity.ok().build();
    }
}