package com.bloodconnect.dto;
import jakarta.validation.constraints.NotBlank;
public record MessageDto(
        String content,
        Long replyToId
) {
}