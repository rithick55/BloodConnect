package com.bloodconnect.controller;

import com.bloodconnect.entity.BloodRequest;
import com.bloodconnect.entity.Role;
import com.bloodconnect.dto.BloodRequestView;
import com.bloodconnect.entity.User;
import com.bloodconnect.repository.BloodRequestRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository users;
    private final BloodRequestRepository requests;

    public AdminController(
            UserRepository users,
            BloodRequestRepository requests
    ) {
        this.users = users;
        this.requests = requests;
    }

    // All donors
    @GetMapping("/donors")
    public List<User> getDonors() {
        return users.findByRoleOrderByDonationsDesc(Role.DONOR);
    }

    @PutMapping("/donors/{id}/availability")
    public User updateDonorAvailability(
            @PathVariable Long id,
            @RequestParam boolean available
    ) {
        User donor = users.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Donor not found")
                );

        if (donor.getRole() != Role.DONOR) {
            throw new RuntimeException("User is not a donor");
        }

        donor.setAvailable(available);

        return users.save(donor);
    }
    
    // All receivers
    @GetMapping("/receivers")
    public List<User> getReceivers() {
        return users.findByRoleOrderByDonationsDesc(Role.RECEIVER);
    }

    // All users
    @GetMapping("/users")
    public List<User> getUsers() {
        return users.findAll();
    }

    // All blood requests
    @GetMapping("/requests")
    public List<BloodRequestView> getRequests() {
        return requests.findAll()
                .stream()
                .map(BloodRequestView::from)
                .toList();
    }
    

    // Dashboard statistics
    @GetMapping("/stats")
    public AdminStats getStats() {

        List<User> allUsers = users.findAll();
        List<BloodRequest> allRequests = requests.findAll();

        long totalDonors = allUsers.stream()
                .filter(user -> user.getRole() == Role.DONOR)
                .count();

        long totalReceivers = allUsers.stream()
                .filter(user -> user.getRole() == Role.RECEIVER)
                .count();

        long availableDonors = allUsers.stream()
                .filter(user ->
                        user.getRole() == Role.DONOR &&
                        user.isAvailable()
                )
                .count();

        long activeRequests = allRequests.stream()
                .filter(request ->
                        request.getStatus().name().equals("ACTIVE")
                )
                .count();

        long emergencyRequests = allRequests.stream()
                .filter(BloodRequest::isUrgent)
                .count();

        long completedRequests = allRequests.stream()
                .filter(request ->
                        request.getStatus().name().equals("COMPLETED")
                )
                .count();

        return new AdminStats(
                totalDonors,
                totalReceivers,
                allRequests.size(),
                emergencyRequests,
                availableDonors,
                activeRequests,
                completedRequests
        );
    }

    public record AdminStats(
            long totalDonors,
            long totalReceivers,
            long totalRequests,
            long emergencyRequests,
            long availableDonors,
            long activeRequests,
            long completedRequests
    ) {}
}