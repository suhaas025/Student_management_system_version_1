package com.example.try2.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "token_blacklist")
public class TokenBlacklist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 512)
    private String token;

    @Column(nullable = false)
    private Instant blacklistedAt = Instant.now();

    public TokenBlacklist() {}
    public TokenBlacklist(String token) {
        this.token = token;
        this.blacklistedAt = Instant.now();
    }
    public Long getId() { return id; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Instant getBlacklistedAt() { return blacklistedAt; }
    public void setBlacklistedAt(Instant blacklistedAt) { this.blacklistedAt = blacklistedAt; }
} 