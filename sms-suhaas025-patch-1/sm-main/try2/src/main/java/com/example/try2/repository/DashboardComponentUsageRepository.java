package com.example.try2.repository;

import com.example.try2.entity.DashboardComponentUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DashboardComponentUsageRepository extends JpaRepository<DashboardComponentUsage, Long> {
    List<DashboardComponentUsage> findByComponentId(Long componentId);
    List<DashboardComponentUsage> findByUserId(String userId);
    List<DashboardComponentUsage> findByComponentIdAndTimestampBetween(Long componentId, LocalDateTime start, LocalDateTime end);
    List<DashboardComponentUsage> findByUserIdAndTimestampBetween(String userId, LocalDateTime start, LocalDateTime end);
} 