package com.bloodconnect.controller;

import com.bloodconnect.dto.AuthDtos.*;

import com.bloodconnect.dto.AuthDtos.LoginRequest;
import com.bloodconnect.dto.AuthDtos.RegisterRequest;
import com.bloodconnect.dto.AuthDtos.ForgotPasswordRequest;
import com.bloodconnect.dto.AuthDtos.VerifyOtpRequest;
import com.bloodconnect.dto.AuthDtos.ResetPasswordRequest;
import com.bloodconnect.entity.User;
import com.bloodconnect.service.PasswordResetService;
import com.bloodconnect.service.UserService;
import com.bloodconnect.security.JwtService;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService service;
    private final PasswordResetService passwordResetService;
    private final JwtService jwtService;

    public AuthController(
            UserService service,
            PasswordResetService passwordResetService,
            JwtService jwtService
    ) {
        this.service = service;
        this.passwordResetService = passwordResetService;
        this.jwtService = jwtService;
    }
    
    private AuthResponse response(User u, String token) {
        return new AuthResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole(),
                u.getPhone(),
                u.getBloodGroup(),
                u.getState(),
                u.getDistrict(),
                u.isAvailable(),
                u.getDonations(),
                token
        );
    }

    @PostMapping("/register")
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest r
    ) {
    	return response(
    	        service.register(
    	                r.name(),
    	                r.email(),
    	                r.password(),
    	                r.role(),
    	                r.phone(),
    	                r.bloodGroup(),
    	                r.state(),
    	                r.district()
    	        ),
    	        null
    	);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest r
    ) {
        User user = service.login(
                r.identifier(),
                r.password(),
                r.role()
        );

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        return response(user, token);
    }
    

    @PutMapping("/availability/{userId}")
    public AuthResponse updateAvailability(
            @PathVariable Long userId,
            @RequestParam boolean available
    ) {
    	return response(
    	        service.updateAvailability(
    	                userId,
    	                available
    	        ),
    	        null
    	);
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest r
    ) {
    	return passwordResetService.sendOtp(
    	        r.phone(),
    	        r.role()
    	);
    }

    @PostMapping("/verify-otp")
    public String verifyOtp(
            @Valid @RequestBody VerifyOtpRequest r
    ) {
    	passwordResetService.verifyOtp(
    	        r.phone(),
    	        r.role(),
    	        r.otp()
    	);

        return "OTP verified successfully.";
    }

    @PostMapping("/reset-password")
    public String resetPassword(
            @Valid @RequestBody ResetPasswordRequest r
    ) {
        passwordResetService.resetPassword(
                r.phone(),
                r.role(),
                r.otp(),
                r.newPassword()
        );

        return "Password reset successfully.";
    }
    
    @PutMapping("/profile/{userId}")
    public AuthResponse updateProfile(
            @PathVariable Long userId,
            @RequestBody ProfileUpdateRequest r
    ) {
    	return response(
    	        service.updateProfile(
    	                userId,
    	                r.name(),
    	                r.phone(),
    	                r.bloodGroup(),
    	                r.state(),
    	                
    	                r.district()
    	        ),
    	        null
    	);
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public org.springframework.http.ResponseEntity<String> handleIllegalArgument(
            IllegalArgumentException e
    ) {
        return org.springframework.http.ResponseEntity
                .badRequest()
                .body(e.getMessage());
    }
}