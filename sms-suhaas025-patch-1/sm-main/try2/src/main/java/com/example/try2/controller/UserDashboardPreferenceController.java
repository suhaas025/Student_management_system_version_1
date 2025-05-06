package com.example.try2.controller;

import com.example.try2.entity.UserDashboardPreference;
import com.example.try2.payload.request.UserDashboardPreferenceRequest;
import com.example.try2.payload.response.UserDashboardPreferenceResponse;
import com.example.try2.service.UserDashboardPreferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/dashboard-preferences")
public class UserDashboardPreferenceController {
    @Autowired
    private UserDashboardPreferenceService service;

    @GetMapping
    public ResponseEntity<UserDashboardPreferenceResponse> getPreference(@RequestParam String userId) {
        Optional<UserDashboardPreference> prefOpt = service.getByUserId(userId);
        if (prefOpt.isPresent()) {
            return ResponseEntity.ok(toResponse(prefOpt.get()));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<UserDashboardPreferenceResponse> savePreference(@RequestParam String userId, @RequestBody UserDashboardPreferenceRequest req) {
        UserDashboardPreference pref = service.saveOrUpdate(userId, req.getPreferencesJson());
        return ResponseEntity.ok(toResponse(pref));
    }

    private UserDashboardPreferenceResponse toResponse(UserDashboardPreference pref) {
        UserDashboardPreferenceResponse resp = new UserDashboardPreferenceResponse();
        resp.setUserId(pref.getUserId());
        resp.setPreferencesJson(pref.getPreferencesJson());
        resp.setUpdatedAt(pref.getUpdatedAt());
        return resp;
    }
} 