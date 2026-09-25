package com.bloodconnect.repository;

import com.bloodconnect.entity.Role;
import com.bloodconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {

	
    Optional<User> findByEmailIgnoreCaseAndRole(
            String email,
            Role role
    );

    Optional<User> findByPhoneAndRole(
            String phone,
            Role role
    );

    List<User> findByRoleAndBloodGroupAndAvailableTrue(
            Role role,
            String bloodGroup
    );
    List<User> findByRoleOrderByDonationsDesc(Role role);
    
}