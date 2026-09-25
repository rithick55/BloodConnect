package com.bloodconnect.dto;

import com.bloodconnect.entity.Role;
import jakarta.validation.constraints.*;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank String name,
            @Email @NotBlank String email,
            @Size(min = 6) String password,
            @NotNull Role role,
            String phone,
            String bloodGroup,
            String state,
            String district
    ) {}

    public record LoginRequest(
            @NotBlank String identifier,
            @NotBlank String password,
            @NotNull Role role
    ) {}

    public record AuthResponse(
            Long id,
            String name,
            String email,
            Role role,
            String phone,
            String bloodGroup,
            String state,
            String district,
            boolean available,
            int donations,
            String token
    ) {}

    public record ForgotPasswordRequest(
            @NotBlank String phone,
            @NotNull Role role
    ) {}

    public record VerifyOtpRequest(
            @NotBlank String phone,
            @NotNull Role role,
            @NotBlank String otp
    ) {}
    public record ProfileUpdateRequest(
            String name,
            String phone,
            String bloodGroup,
            String state,
            String district
    ) {}

    public record ResetPasswordRequest(
            @NotBlank String phone,
            @NotBlank String otp,
            @NotNull Role role,
            @Size(min = 6) String newPassword
    ) {}
}