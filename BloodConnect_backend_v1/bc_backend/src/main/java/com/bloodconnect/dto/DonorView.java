package com.bloodconnect.dto;

import com.bloodconnect.entity.User;

public record DonorView(
        Long id,
        String name,
        String phone,
        String bloodGroup,
        String state,
        String district,
        boolean available,
        int donations
) {
    public static DonorView from(User u) {
        return new DonorView(
                u.getId(),
                u.getName(),
                u.getPhone(),
                u.getBloodGroup(),
                u.getState(),
                u.getDistrict(),
                u.isAvailable(),
                u.getDonations()
        );
    }
}