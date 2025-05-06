package com.example.try2.service;

import com.example.try2.entity.UserDashboardPreference;
import com.example.try2.repository.UserDashboardPreferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserDashboardPreferenceService {
    @Autowired
    private UserDashboardPreferenceRepository repository;

    public Optional<UserDashboardPreference> getByUserId(String userId) {
        return repository.findByUserId(userId);
    }

    public UserDashboardPreference saveOrUpdate(String userId, String preferencesJson) {
        Optional<UserDashboardPreference> existing = repository.findByUserId(userId);
        UserDashboardPreference pref = existing.orElseGet(UserDashboardPreference::new);
        pref.setUserId(userId);
        pref.setPreferencesJson(preferencesJson);
        return repository.save(pref);
    }
} 