package com.bloodconnect.repository;
import com.bloodconnect.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findByStatusOrderByUrgentDescCreatedAtDesc(
            RequestStatus status
    );

    List<BloodRequest> findByReceiverIdOrderByCreatedAtDesc(
            Long receiverId
    );

    List<BloodRequest> findByAcceptedByIdOrderByCreatedAtDesc(
            Long donorId
    );
    

    List<BloodRequest> findByStatusAndBloodGroupOrderByUrgentDescCreatedAtDesc(
            RequestStatus status,
            String bloodGroup
    );
}
