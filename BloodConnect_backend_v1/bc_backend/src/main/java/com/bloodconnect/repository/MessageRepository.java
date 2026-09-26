package com.bloodconnect.repository;

import com.bloodconnect.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
        SELECT m
        FROM Message m
        JOIN FETCH m.sender
        WHERE m.request.id = :requestId
        ORDER BY m.createdAt ASC
    """)
    List<Message> findByRequestIdOrderByCreatedAtAsc(
            @Param("requestId") Long requestId
    );

    @Modifying
    @Query("""
        DELETE FROM Message m
        WHERE m.id = :messageId
        AND m.request.id = :requestId
        AND m.sender.id = :senderId
    """)
    int deleteMessage(
            @Param("messageId") Long messageId,
            @Param("requestId") Long requestId,
            @Param("senderId") Long senderId
    );
}