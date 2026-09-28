package com.bloodconnect.dto;

import java.time.LocalDateTime;

import com.bloodconnect.entity.Message;

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

    public static MessageView from(Message message) {

        Message reply = message.getReplyTo();

        return new MessageView(
                message.getId(),
                message.getRequest().getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getSender().getRole().name(),
                message.getContent(),
                message.getCreatedAt(),
                "MESSAGE",
                reply != null ? reply.getId() : null,
                reply != null
                        ? reply.getSender().getName()
                        : null,
                reply != null
                        ? reply.getContent()
                        : null
        );
    }

    public static MessageView deleted(Message message) {

        Message reply = message.getReplyTo();

        return new MessageView(
                message.getId(),
                message.getRequest().getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getSender().getRole().name(),
                message.getContent(),
                message.getCreatedAt(),
                "DELETED",
                reply != null ? reply.getId() : null,
                reply != null
                        ? reply.getSender().getName()
                        : null,
                reply != null
                        ? reply.getContent()
                        : null
        );
    }
}