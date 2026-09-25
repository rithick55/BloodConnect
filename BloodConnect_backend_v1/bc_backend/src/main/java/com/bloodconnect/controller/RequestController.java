package com.bloodconnect.controller;

import com.bloodconnect.dto.BloodRequestView;
import com.bloodconnect.dto.RequestDtos.CreateRequest;
import com.bloodconnect.entity.BloodRequest;
import com.bloodconnect.entity.RequestStatus;
import com.bloodconnect.entity.Role;
import com.bloodconnect.entity.User;
import com.bloodconnect.repository.BloodRequestRepository;
import com.bloodconnect.repository.UserRepository;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final BloodRequestRepository requests;
    private final UserRepository users;

    public RequestController(
            BloodRequestRepository requests,
            UserRepository users
    ) {
        this.requests = requests;
        this.users = users;
    }

    @PostMapping
    public BloodRequestView create(
            @RequestParam Long receiverId,
            @Valid @RequestBody CreateRequest r
    ) {
        User receiver = users
                .findById(receiverId)
                .orElseThrow();

        BloodRequest x = new BloodRequest();

        x.setReceiver(receiver);
        x.setPatientName(r.patientName());
        x.setPatientAge(r.patientAge());
        x.setBloodGroup(r.bloodGroup());
        x.setState(r.state());
        x.setDistrict(r.district());
        x.setHospitalName(r.hospitalName());
        x.setHospitalAddress(r.hospitalAddress());
        x.setLocationType(r.locationType());
        x.setLocation(r.location());
        x.setUrgent(r.urgent());

        return BloodRequestView.from(
                requests.save(x)
        );
    }

    @GetMapping("/active")
    public List<BloodRequestView> active() {
        return requests
                .findByStatusOrderByUrgentDescCreatedAtDesc(
                        RequestStatus.ACTIVE
                )
                .stream()
                .map(BloodRequestView::from)
                .toList();
    }

    @GetMapping("/receiver/{receiverId}")
    public List<BloodRequestView> receiver(
            @PathVariable Long receiverId
    ) {
        return requests
                .findByReceiverIdOrderByCreatedAtDesc(receiverId)
                .stream()
                .map(BloodRequestView::from)
                .toList();
    }
    
    @GetMapping("/donor/{donorId}")
    public List<BloodRequestView> donor(@PathVariable Long donorId) {
        return requests.findByAcceptedByIdOrderByCreatedAtDesc(donorId)
                .stream().map(BloodRequestView::from).toList();
    }

    @GetMapping("/matching")
    public List<BloodRequestView> matching(
            @RequestParam String bloodGroup
    ) {
        return requests
                .findByStatusAndBloodGroupOrderByUrgentDescCreatedAtDesc(
                        RequestStatus.ACTIVE,
                        bloodGroup
                )
                .stream()
                .map(BloodRequestView::from)
                .toList();
    }

    @PutMapping("/{requestId}/accept")
    public BloodRequestView accept(
            @PathVariable Long requestId,
            @RequestParam Long donorId
    ) {
        BloodRequest r = requests
                .findById(requestId)
                .orElseThrow();

        User d = users
                .findById(donorId)
                .orElseThrow();

        if (d.getRole() != Role.DONOR) {
            throw new IllegalArgumentException(
                    "Only donors can accept requests."
            );
        }

        r.setStatus(RequestStatus.ACCEPTED);
        r.setAcceptedBy(d);

        users.save(d);

        return BloodRequestView.from(
                requests.save(r)
        );
    }
    
    @PutMapping("/{requestId}/cancel")
    public BloodRequestView cancel(
            @PathVariable Long requestId
    ) {
        BloodRequest r = requests.findById(requestId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Blood request not found.")
                );

        if (r.getStatus() == RequestStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Completed requests cannot be cancelled."
            );
        }

        if (r.getStatus() == RequestStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Request is already cancelled."
            );
        }

        r.setStatus(RequestStatus.CANCELLED);

        return BloodRequestView.from(
                requests.save(r)
        );
    }
    
    @PutMapping("/{requestId}/complete")
    public BloodRequestView complete(
            @PathVariable Long requestId,
            @RequestParam Long receiverId
    ) {
        BloodRequest r = requests.findById(requestId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Blood request not found.")
                );

        User receiver = users.findById(receiverId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Receiver not found.")
                );

        if (!r.getReceiver().getId().equals(receiver.getId())) {
            throw new IllegalArgumentException(
                    "You are not the receiver of this request."
            );
        }

        if (r.getStatus() != RequestStatus.ACCEPTED) {
            throw new IllegalArgumentException(
                    "Only an accepted request can be completed."
            );
        }

        if (r.getAcceptedBy() == null) {
            throw new IllegalArgumentException(
                    "No donor has accepted this request."
            );
        }

        User donor = r.getAcceptedBy();

        donor.setDonations(donor.getDonations() + 1);

        r.setStatus(RequestStatus.COMPLETED);

        users.save(donor);

        return BloodRequestView.from(requests.save(r));
    }
}