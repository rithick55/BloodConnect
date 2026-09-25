package com.bloodconnect.controller;

import com.bloodconnect.dto.DonorView;
import com.bloodconnect.entity.Role;
import com.bloodconnect.entity.User;
import com.bloodconnect.repository.UserRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donors")
public class DonorController {

    private final UserRepository users;

    public DonorController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/matching")
    public List<DonorView> matching(
            @RequestParam String bloodGroup
    ) {
        return users
                .findByRoleAndBloodGroupAndAvailableTrue(
                        Role.DONOR,
                        bloodGroup
                )
                .stream()
                .map(DonorView::from)
                .toList();
    }

    @PutMapping("/{id}/availability")
    public DonorView availability(
            @PathVariable Long id,
            @RequestParam boolean available
    ) {
        User u = users
                .findById(id)
                .orElseThrow();

        if (u.getRole() != Role.DONOR) {
            throw new IllegalArgumentException(
                    "Only donors have availability."
            );
        }

        u.setAvailable(available);

        return DonorView.from(users.save(u));
    }
}