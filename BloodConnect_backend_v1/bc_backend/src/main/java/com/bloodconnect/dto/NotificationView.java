package com.bloodconnect.dto;

import java.time.LocalDateTime;

public record NotificationView(
        String type,
        Long requestId,
        Long senderId,
        String senderName,
        String message,
        LocalDateTime createdAt
) {
}