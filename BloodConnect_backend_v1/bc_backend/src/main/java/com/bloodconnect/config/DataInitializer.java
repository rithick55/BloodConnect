package com.bloodconnect.config;

import com.bloodconnect.entity.Role;
import com.bloodconnect.entity.User;
import com.bloodconnect.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seed(
            UserRepository repo,
            PasswordEncoder encoder
    ) {
        return args -> {

            // Admin
            if (repo.findByEmailIgnoreCaseAndRole(
                    "admin@bloodconnect.com",
                    Role.ADMIN
            ).isEmpty()) {

                User u = new User();

                u.setName("BloodConnect Admin");
                u.setEmail("admin@bloodconnect.com");
                u.setPassword(encoder.encode("admin123"));
                u.setRole(Role.ADMIN);
                u.setAvailable(false);

                repo.save(u);
            }

            // Demo Donor
            if (repo.findByEmailIgnoreCaseAndRole(
                    "arun@bloodconnect.com",
                    Role.DONOR
            ).isEmpty()) {

                User u = new User();

                u.setName("Arun Kumar");
                u.setEmail("arun@bloodconnect.com");
                u.setPassword(encoder.encode("demo123"));
                u.setRole(Role.DONOR);
                u.setPhone("9876543210");
                u.setBloodGroup("O+");
                u.setState("Tamil Nadu");
                u.setDistrict("Chennai");
                u.setDonations(12);

                repo.save(u);
            }

         // Demo Receiver
            User karthik = repo.findByEmailIgnoreCaseAndRole(
                    "karthik@bloodconnect.com",
                    Role.RECEIVER
            ).orElse(null);

            if (karthik == null) {

                karthik = new User();

                karthik.setName("Karthik Kumar");
                karthik.setEmail("karthik@bloodconnect.com");
                karthik.setRole(Role.RECEIVER);
                karthik.setPhone("9876543211");
                karthik.setState("Tamil Nadu");
                karthik.setDistrict("Chennai");
            }

            karthik.setPassword(encoder.encode("demo123"));

            repo.save(karthik);
            
            System.out.println(
            	    "PASSWORD TEST = " +
            	    encoder.matches(
            	        "demo123",
            	        repo.findByEmailIgnoreCaseAndRole(
            	            "karthik@bloodconnect.com",
            	            Role.RECEIVER
            	        ).get().getPassword()
            	    )
            	);
        };
    }
}