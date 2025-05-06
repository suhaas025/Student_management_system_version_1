package com.example.try2.repository;

import com.example.try2.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    
    // Find active announcements targeting a specific role or all users
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND " +
           "(a.targetRole = ?1 OR a.targetRole IS NULL OR a.targetRole = '') AND " +
           "a.startDate <= ?2 AND (a.endDate IS NULL OR a.endDate >= ?2)")
    List<Announcement> findActiveAnnouncementsByRole(String role, LocalDateTime currentTime);
    
    // Find all announcements by a target role
    List<Announcement> findByTargetRoleOrderByCreatedAtDesc(String targetRole);
    
    // Find all active announcements
    List<Announcement> findByIsActiveTrueOrderByCreatedAtDesc();
    
    // Find all urgent announcements
    List<Announcement> findByIsUrgentTrueOrderByCreatedAtDesc();
    
    // Find all announcements created by a specific user
    List<Announcement> findByCreatedByIdOrderByCreatedAtDesc(Long userId);

    // Add the method to find announcements by creator ID
    List<Announcement> findByCreatedById(Long userId);
} 