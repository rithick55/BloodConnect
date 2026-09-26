package com.bloodconnect.repository;

import com.bloodconnect.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
        SELECT m
        FROM Message m
        JOIN FETCH m.sender
        WHERE m.request.id = :requestId
        ORDER BY m.createdAt ASC
    """)
    List<Message> findByRequestIdOrderByCreatedAtAsc(Long requestId);
}