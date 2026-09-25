package com.bloodconnect.repository;
import com.bloodconnect.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface MessageRepository extends JpaRepository<Message,Long> { List<Message> findByRequestIdOrderByCreatedAtAsc(Long requestId); }
