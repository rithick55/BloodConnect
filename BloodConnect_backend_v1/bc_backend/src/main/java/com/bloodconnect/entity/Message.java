package com.bloodconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "request_id", nullable = false) private BloodRequest request;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "sender_id", nullable = false) private User sender;
    @Column(nullable = false, length = 2000) private String content;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public BloodRequest getRequest(){return request;} public void setRequest(BloodRequest v){request=v;}
    public User getSender(){return sender;} public void setSender(User v){sender=v;}
    public String getContent(){return content;} public void setContent(String v){content=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
