package com.bloodconnect.controller;

import com.bloodconnect.dto.DonorView;
import com.bloodconnect.entity.User;
import com.bloodconnect.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donors")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public List<DonorView> getAvailableDonors(
            @RequestParam String bloodGroup
    ) {
        return service.findAvailableDonors(bloodGroup)
                .stream()
                .map(DonorView::from)
                .toList();
    }
    
    @GetMapping("/leaderboard")
    public List<DonorView> leaderboard() {
        return service.getDonorLeaderboard()
                .stream()
                .map(DonorView::from)
                .toList();
    }

    @PutMapping("/{userId}")
    public User updateProfile(
            @PathVariable Long userId,
            @RequestBody UserUpdateRequest request
    ) {
        return service.updateProfile(
                userId,
                request.name(),
                request.phone(),
                request.bloodGroup(),
                request.state(),
                request.district()
        );
    }

    public record UserUpdateRequest(
            String name,
            String phone,
            String bloodGroup,
            String state,
            String district
    ) {}
}