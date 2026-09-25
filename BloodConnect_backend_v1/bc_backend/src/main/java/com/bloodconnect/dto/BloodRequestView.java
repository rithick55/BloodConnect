package com.bloodconnect.dto;

import com.bloodconnect.entity.BloodRequest;
import com.bloodconnect.entity.RequestStatus;
import java.time.LocalDateTime;

public record BloodRequestView(
        Long id,
        Long receiverId,
        String receiverName,
        String receiverEmail,
        String receiverPhone,
        String patientName,
        int patientAge,
        String bloodGroup,
        String state,
        String district,
        String hospitalName,
        String hospitalAddress,
        String locationType,
        String location,
        boolean urgent,
        RequestStatus status,
        Long acceptedBy,
        String acceptedByName,
        LocalDateTime createdAt
) {

    public static BloodRequestView from(BloodRequest r) {

        Long donorId = null;
        String donorName = null;

        if (r.getAcceptedBy() != null) {
            donorId = r.getAcceptedBy().getId();
            donorName = r.getAcceptedBy().getName();
        }

        return new BloodRequestView(
        		r.getId(),
        		r.getReceiver().getId(),
        		r.getReceiver().getName(),
        		r.getReceiver().getEmail(),
        		r.getReceiver().getPhone(),
        		r.getPatientName(),
                r.getPatientAge(),
                r.getBloodGroup(),
                r.getState(),
                r.getDistrict(),
                r.getHospitalName(),
                r.getHospitalAddress(),
                r.getLocationType(),
                r.getLocation(),
                r.isUrgent(),
                r.getStatus(),
                donorId,
                donorName,
                r.getCreatedAt()
        );
    }
}