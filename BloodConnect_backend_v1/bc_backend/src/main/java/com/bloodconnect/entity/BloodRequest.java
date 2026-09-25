package com.bloodconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blood_requests")
public class BloodRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;  
    @Column(nullable = false, length = 100) private String patientName;
    @Column(nullable = false) private int patientAge;
    @Column(nullable = false, length = 5) private String bloodGroup;
    @Column(nullable = false, length = 100) private String state;
    @Column(nullable = false, length = 100) private String district;
    @Column(nullable = false, length = 150) private String hospitalName;
    @Column(length = 500) private String hospitalAddress;
    @Column(length = 20) private String locationType;
    @Column(length = 500) private String location;
    @Column(nullable = false) private boolean urgent;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private RequestStatus status = RequestStatus.ACTIVE;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "accepted_by")
    private User acceptedBy;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId(){return id;} public void setId(Long v){id=v;}
    public User getReceiver(){return receiver;} public void setReceiver(User v){receiver=v;}
    public String getPatientName(){return patientName;} public void setPatientName(String v){patientName=v;}
    public int getPatientAge(){return patientAge;} public void setPatientAge(int v){patientAge=v;}
    public String getBloodGroup(){return bloodGroup;} public void setBloodGroup(String v){bloodGroup=v;}
    public String getState(){return state;} public void setState(String v){state=v;}
    public String getDistrict(){return district;} public void setDistrict(String v){district=v;}
    public String getHospitalName(){return hospitalName;} public void setHospitalName(String v){hospitalName=v;}
    public String getHospitalAddress(){return hospitalAddress;} public void setHospitalAddress(String v){hospitalAddress=v;}
    public String getLocationType(){return locationType;} public void setLocationType(String v){locationType=v;}
    public String getLocation(){return location;} public void setLocation(String v){location=v;}
    public boolean isUrgent(){return urgent;} public void setUrgent(boolean v){urgent=v;}
    public RequestStatus getStatus(){return status;} public void setStatus(RequestStatus v){status=v;}
    public User getAcceptedBy(){return acceptedBy;} public void setAcceptedBy(User v){acceptedBy=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
