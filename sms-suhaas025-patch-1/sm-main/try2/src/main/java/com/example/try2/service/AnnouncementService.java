package com.example.try2.service;

import com.example.try2.entity.Announcement;
import com.example.try2.entity.User;
import com.example.try2.payload.request.AnnouncementRequest;
import com.example.try2.payload.response.AnnouncementResponse;
import com.example.try2.repository.AnnouncementRepository;
import com.example.try2.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.try2.security.services.UserDetailsImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {
    private static final Logger logger = LoggerFactory.getLogger(AnnouncementService.class);

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all announcements
     */
    public List<AnnouncementResponse> getAllAnnouncements() {
        logger.info("Fetching all announcements");
        return announcementRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get announcement by ID
     */
    public AnnouncementResponse getAnnouncementById(Long id) {
        logger.info("Fetching announcement with ID: {}", id);
        return announcementRepository.findById(id)
                .map(this::convertToResponse)
                .orElseThrow(() -> new RuntimeException("Announcement not found with ID: " + id));
    }

    /**
     * Get announcements by role
     */
    public List<AnnouncementResponse> getAnnouncementsByRole(String role) {
        logger.info("Fetching announcements for role: {}", role);
        LocalDateTime now = LocalDateTime.now();
        return announcementRepository.findActiveAnnouncementsByRole(role, now).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create a new announcement
     */
    @Transactional
    public AnnouncementResponse createAnnouncement(AnnouncementRequest request, Long userId) {
        logger.info("Creating announcement: {}", request.getTitle());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        boolean isUrgent = request.getIsUrgent() != null ? request.getIsUrgent() : false;
        boolean isActive = request.getIsActive() != null ? request.getIsActive() : true;
        
        Announcement announcement = new Announcement(
            request.getTitle(),
            request.getMessage(),
            request.getTargetRole(),
            isUrgent,
            isActive,
            request.getStartDate(),
            request.getEndDate(),
            user
        );
        
        Announcement savedAnnouncement = announcementRepository.save(announcement);
        logger.info("Successfully created announcement with ID: {}", savedAnnouncement.getId());
        
        return convertToResponse(savedAnnouncement);
    }

    /**
     * Update an existing announcement
     */
    @Transactional
    public AnnouncementResponse updateAnnouncement(Long id, AnnouncementRequest request) {
        logger.info("Updating announcement with ID: {}", id);
        
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with ID: " + id));
        
        announcement.setTitle(request.getTitle());
        announcement.setMessage(request.getMessage());
        announcement.setTargetRole(request.getTargetRole());
        
        if (request.getIsUrgent() != null) {
            announcement.setUrgent(request.getIsUrgent());
        }
        
        if (request.getIsActive() != null) {
            announcement.setActive(request.getIsActive());
        }
        
        announcement.setStartDate(request.getStartDate());
        announcement.setEndDate(request.getEndDate());
        
        announcement.setUpdatedBy(getCurrentUser());
        
        Announcement updatedAnnouncement = announcementRepository.save(announcement);
        logger.info("Successfully updated announcement with ID: {}", id);
        
        return convertToResponse(updatedAnnouncement);
    }

    /**
     * Delete an announcement
     */
    @Transactional
    public void deleteAnnouncement(Long id) {
        logger.info("Deleting announcement with ID: {}", id);
        
        if (!announcementRepository.existsById(id)) {
            throw new RuntimeException("Announcement not found with ID: " + id);
        }
        
        announcementRepository.deleteById(id);
        logger.info("Successfully deleted announcement with ID: {}", id);
    }

    /**
     * Convert Announcement entity to AnnouncementResponse DTO
     */
    private AnnouncementResponse convertToResponse(Announcement announcement) {
        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId());
        response.setTitle(announcement.getTitle());
        response.setMessage(announcement.getMessage());
        response.setTargetRole(announcement.getTargetRole());
        response.setUrgent(announcement.isUrgent());
        response.setActive(announcement.isActive());
        response.setStartDate(announcement.getStartDate());
        response.setEndDate(announcement.getEndDate());
        response.setCreatedAt(announcement.getCreatedAt());
        response.setUpdatedAt(announcement.getUpdatedAt());
        
        if (announcement.getCreatedBy() != null) {
            response.setCreatedById(announcement.getCreatedBy().getId());
            response.setCreatedByUsername(announcement.getCreatedBy().getUsername());
        }
        
        return response;
    }

    private User getCurrentUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Announcement saveAnnouncement(Announcement announcement) {
        User currentUser = getCurrentUser();
        announcement.setCreatedBy(currentUser);
        announcement.setUpdatedBy(currentUser);
        return announcementRepository.save(announcement);
    }

    /**
     * One-time migration: Set createdBy and updatedBy to a default admin user for all announcements where these fields are null.
     * Call this method manually to fix existing data.
     */
    @Transactional
    public void setCreatedByAndUpdatedByForAllAnnouncements(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found with ID: " + adminUserId));
        List<Announcement> announcements = announcementRepository.findAll();
        int updated = 0;
        for (Announcement ann : announcements) {
            boolean changed = false;
            if (ann.getCreatedBy() == null) {
                ann.setCreatedBy(admin);
                changed = true;
            }
            if (ann.getUpdatedBy() == null) {
                ann.setUpdatedBy(admin);
                changed = true;
            }
            if (changed) {
                announcementRepository.save(ann);
                updated++;
            }
        }
        logger.info("Announcement migration complete. Records updated: {}", updated);
    }
} 