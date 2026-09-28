package com.bloodconnect.repository;

import com.bloodconnect.entity.ChatDeletion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatDeletionRepository
        extends JpaRepository<ChatDeletion, Long> {

    boolean existsByRequestIdAndUserId(
            Long requestId,
            Long userId
    );
}