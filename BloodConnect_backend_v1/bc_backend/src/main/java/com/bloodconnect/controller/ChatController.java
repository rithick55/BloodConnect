package com.bloodconnect.controller;

import com.bloodconnect.dto.MessageDto;
import org.springframework.transaction.annotation.Transactional;
import com.bloodconnect.entity.BloodRequest;
import com.bloodconnect.entity.Message;
import com.bloodconnect.entity.User;
import com.bloodconnect.repository.BloodRequestRepository;
import com.bloodconnect.repository.MessageRepository;
import com.bloodconnect.repository.UserRepository;

import jakarta.validation.Valid;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

    @GetMapping("/{requestId}")
    @Transactional(readOnly = true)
    public List<MessageView> history(
            @PathVariable Long requestId
    ) {
        return messages
                .findByRequestIdOrderByCreatedAtAsc(requestId)
                .stream()
                .map(MessageView::from)
                .toList();
    }

    @PostMapping("/{requestId}")
    public MessageView send(
            @PathVariable Long requestId,
            @RequestParam Long senderId,
            @Valid @RequestBody MessageDto dto
    ) {
        Message m = save(
                requestId,
                senderId,
                dto.content()
        );

        MessageView v = MessageView.from(m);

        broker.convertAndSend(
                "/topic/requests/" + requestId,
                v
        );

        return v;
    }
    

    public Message saveAndBroadcast(
            Long requestId,
            Long senderId,
            String content
    ) {
        Message m = save(
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

    private Message save(
            Long requestId,
            Long senderId,
            String content
    ) {
        BloodRequest r = requests
                .findById(requestId)
                .orElseThrow();

        User s = users
                .findById(senderId)
                .orElseThrow();

        if (
                !s.getId().equals(r.getReceiver().getId())
                &&
                (
                    r.getAcceptedBy() == null
                    ||
                    !s.getId().equals(r.getAcceptedBy().getId())
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
        m.setCreatedAt(LocalDateTime.now());

        return messages.save(m);
    }

    public record MessageView(
            Long id,
            Long requestId,
            Long senderId,
            String senderName,
            String senderRole,
            String content,
            LocalDateTime createdAt
    ) {

        static MessageView from(Message m) {
            return new MessageView(
                    m.getId(),
                    m.getRequest().getId(),
                    m.getSender().getId(),
                    m.getSender().getName(),
                    m.getSender().getRole().name(),
                    m.getContent(),
                    m.getCreatedAt()
            );
        }
    }
}