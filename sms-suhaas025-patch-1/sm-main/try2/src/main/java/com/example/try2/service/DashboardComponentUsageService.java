package com.example.try2.service;

import com.example.try2.entity.DashboardComponentUsage;
import com.example.try2.repository.DashboardComponentUsageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DashboardComponentUsageService {
    @Autowired
    private DashboardComponentUsageRepository repository;

    public DashboardComponentUsage logUsage(DashboardComponentUsage usage) {
        return repository.save(usage);
    }

    public List<DashboardComponentUsage> getUsageByComponent(Long componentId, LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null) {
            return repository.findByComponentIdAndTimestampBetween(componentId, start, end);
        } else {
            return repository.findByComponentId(componentId);
        }
    }

    public List<DashboardComponentUsage> getUsageByUser(String userId, LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null) {
            return repository.findByUserIdAndTimestampBetween(userId, start, end);
        } else {
            return repository.findByUserId(userId);
        }
    }
} 