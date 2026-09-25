package com.bloodconnect.security;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import java.util.Date;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final String SECRET_KEY =
        System.getenv("JWT_SECRET");

    private static final long EXPIRATION_TIME =
            1000L * 60 * 60 * 24; // 24 hours

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                SECRET_KEY.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateToken(Long userId, String email, String role) {

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(
                        System.currentTimeMillis() + EXPIRATION_TIME
                ))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extractClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUserId(String token) {

        return Long.valueOf(
                extractClaims(token).getSubject()
        );
    }

    public String extractRole(String token) {

        return extractClaims(token)
                .get("role", String.class);
    }

    public boolean isTokenValid(String token) {

        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}