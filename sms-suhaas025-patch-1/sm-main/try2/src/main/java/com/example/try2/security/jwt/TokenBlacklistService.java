package com.example.try2.security.jwt;

import com.example.try2.entity.TokenBlacklist;
import com.example.try2.repository.TokenBlacklistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TokenBlacklistService {
    @Autowired
    private TokenBlacklistRepository tokenBlacklistRepository;

    public void blacklistToken(String token) {
        if (!tokenBlacklistRepository.existsByToken(token)) {
            tokenBlacklistRepository.save(new TokenBlacklist(token));
        }
    }

    public boolean isTokenBlacklisted(String token) {
        return tokenBlacklistRepository.existsByToken(token);
    }
} 