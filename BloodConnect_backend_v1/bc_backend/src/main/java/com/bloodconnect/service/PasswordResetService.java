package com.bloodconnect.service;

import com.bloodconnect.entity.Role;
import com.bloodconnect.entity.User;
import com.bloodconnect.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final SecureRandom random = new SecureRandom();

    private final Map<String, OtpData> otpStore =
            new ConcurrentHashMap<>();

    public PasswordResetService(
            UserRepository repo,
            PasswordEncoder encoder
    ) {
        this.repo = repo;
        this.encoder = encoder;
    }

    private String otpKey(String phone, Role role) {
        return phone.trim() + ":" + role.name();
    }

    public String sendOtp(String phone, Role role) {

        String normalizedPhone = phone.trim();

        User user = repo.findByPhoneAndRole(
                normalizedPhone,
                role
        ).orElseThrow(() ->
                new IllegalArgumentException(
                        "No account found with this mobile number for this role."
                )
        );

        String otp = String.format(
                "%06d",
                random.nextInt(1_000_000)
        );

        Instant expiresAt =
                Instant.now().plusSeconds(5 * 60);

        String key = otpKey(normalizedPhone, role);

        otpStore.put(
                key,
                new OtpData(otp, expiresAt)
        );

        // DEMO ONLY
        // Later this OTP will be sent through SMS.
        System.out.println("=================================");
        System.out.println("BloodConnect Password Reset OTP");
        System.out.println("User: " + user.getName());
        System.out.println("Phone: " + normalizedPhone);
        System.out.println("Role: " + role);
        System.out.println("OTP: " + otp);
        System.out.println("Expires: " + expiresAt);
        System.out.println("=================================");

        return otp;
    }

    public void verifyOtp(
            String phone,
            Role role,
            String otp
    ) {

        String normalizedPhone = phone.trim();

        String key = otpKey(
                normalizedPhone,
                role
        );

        OtpData data = otpStore.get(key);

        if (data == null) {
            throw new IllegalArgumentException(
                    "OTP not found. Please request a new OTP."
            );
        }

        if (Instant.now().isAfter(data.expiresAt())) {

            otpStore.remove(key);

            throw new IllegalArgumentException(
                    "OTP has expired. Please request a new OTP."
            );
        }

        if (!data.otp().equals(otp.trim())) {
            throw new IllegalArgumentException(
                    "Invalid OTP."
            );
        }
    }

    public void resetPassword(
            String phone,
            Role role,
            String otp,
            String newPassword
    ) {

        String normalizedPhone = phone.trim();

        // Verify OTP again before changing password
        verifyOtp(
                normalizedPhone,
                role,
                otp
        );

        User user = repo.findByPhoneAndRole(
                normalizedPhone,
                role
        ).orElseThrow(() ->
                new IllegalArgumentException(
                        "User not found."
                )
        );

        user.setPassword(
                encoder.encode(newPassword)
        );

        repo.save(user);

        // OTP cannot be reused
        otpStore.remove(
                otpKey(normalizedPhone, role)
        );
    }

    private record OtpData(
            String otp,
            Instant expiresAt
    ) {}
}