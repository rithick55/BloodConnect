
package com.bloodconnect.service;

import com.bloodconnect.entity.*;
import com.bloodconnect.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public UserService(
            UserRepository repo,
            PasswordEncoder encoder
    ) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public User register(
            String name,
            String email,
            String password,
            Role role,
            String phone,
            String bloodGroup,
            String state,
            String district
    ) {

        String normalizedEmail = email.trim().toLowerCase();
        String normalizedPhone = phone.trim();

        if (!normalizedPhone.matches("\\d{10}")) {
            throw new IllegalArgumentException(
                    "Mobile number must contain exactly 10 digits."
            );
        }

        if (repo.findByEmailIgnoreCaseAndRole(
                normalizedEmail,
                role
        ).isPresent()) {

            throw new IllegalArgumentException(
                    "An account with this email already exists for this role."
            );
        }

        if (repo.findByPhoneAndRole(
                normalizedPhone,
                role
        ).isPresent()) {

            throw new IllegalArgumentException(
                    "An account with this mobile number already exists for this role."
            );
        }

        User u = new User();

        u.setName(name.trim());
        u.setEmail(normalizedEmail);
        u.setPassword(encoder.encode(password));
        u.setRole(role);
        u.setPhone(normalizedPhone);
        u.setBloodGroup(bloodGroup);
        u.setState(state);
        u.setDistrict(district);

        return repo.save(u);
    }
    public User login(
            String identifier,
            String password,
            Role role
    ) {
        String value = identifier.trim();

        User u;

        if (value.matches("\\d{10}")) {
            u = repo.findByPhoneAndRole(value, role)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Invalid email/mobile number or password."
                            )
                    );
        } else {
            u = repo.findByEmailIgnoreCaseAndRole(value, role)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Invalid email/mobile number or password."
                            )
                    );
        }

        if (!encoder.matches(password, u.getPassword())) {
            throw new IllegalArgumentException(
                    "Invalid email/mobile number or password."
            );
        }

        return u;
    }

    public User updateAvailability(
            Long userId,
            boolean available
    ) {
        User user = repo.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found."
                        )
                );

        user.setAvailable(available);

        return repo.save(user);
    }
    public User updateProfile(
            Long userId,
            String name,
            String phone,
            String bloodGroup,
            String state,
            String district
    ) {
        User user = repo.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found."
                        )
                );

        String normalizedName = name.trim();
        String normalizedPhone = phone.trim();

        if (normalizedName.isEmpty()) {
            throw new IllegalArgumentException(
                    "Name cannot be empty."
            );
        }

        if (!normalizedPhone.matches("\\d{10}")) {
            throw new IllegalArgumentException(
                    "Mobile number must contain exactly 10 digits."
            );
        }

        // Check whether another account with the same
        // phone + role already exists
        repo.findByPhoneAndRole(normalizedPhone, user.getRole())
                .ifPresent(existingUser -> {
                    if (!existingUser.getId().equals(userId)) {
                        throw new IllegalArgumentException(
                                "An account with this mobile number already exists for this role."
                        );
                    }
                });

        user.setName(normalizedName);
        user.setPhone(normalizedPhone);
        user.setBloodGroup(bloodGroup);
        user.setState(state);
        user.setDistrict(district);

        return repo.save(user);
    }
    
    public List<User> findAvailableDonors(String bloodGroup) {
        return repo.findByRoleAndBloodGroupAndAvailableTrue(
                Role.DONOR,
                bloodGroup
        );
    }
    
    public List<User> getDonorLeaderboard() {
        return repo.findByRoleOrderByDonationsDesc(Role.DONOR);
    }
    
}

