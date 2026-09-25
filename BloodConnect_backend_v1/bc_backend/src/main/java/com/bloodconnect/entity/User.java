package com.bloodconnect.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
            @UniqueConstraint(
                name = "uk_user_email_role",
                columnNames = {"email", "role"}
            ),
            @UniqueConstraint(
                name = "uk_user_phone_role",
                columnNames = {"phone", "role"}
            )
        }
)
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false, length = 150) private String email;
    @JsonIgnore
    @Column(nullable = false) private String password;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Role role;
    @Column(length = 20) private String phone;
    @Column(length = 5) private String bloodGroup;
    @Column(length = 100) private String state;
    @Column(length = 100) private String district;
    @Column(nullable = false) private boolean available = true;
    @Column(nullable = false) private int donations = 0;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getPassword(){return password;} public void setPassword(String v){password=v;}
    public Role getRole(){return role;} public void setRole(Role v){role=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getBloodGroup(){return bloodGroup;} public void setBloodGroup(String v){bloodGroup=v;}
    public String getState(){return state;} public void setState(String v){state=v;}
    public String getDistrict(){return district;} public void setDistrict(String v){district=v;}
    public boolean isAvailable(){return available;} public void setAvailable(boolean v){available=v;}
    public int getDonations(){return donations;} public void setDonations(int v){donations=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
