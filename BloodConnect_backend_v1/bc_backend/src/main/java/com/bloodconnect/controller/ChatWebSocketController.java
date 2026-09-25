package com.bloodconnect.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
public class ChatWebSocketController {

    private final ChatController chat;

    public ChatWebSocketController(ChatController chat) {
        this.chat = chat;
    }

    @MessageMapping("/chat/{requestId}")
    public void send(
            @DestinationVariable Long requestId,
            @Payload WebSocketMessage payload
    ) {
        chat.saveAndBroadcast(
                requestId,
                payload.senderId(),
                payload.content()
        );
    }

    public record WebSocketMessage(
            Long senderId,
            String content
    ) {
    }
}