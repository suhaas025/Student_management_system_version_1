package com.example.try2.controller;

import com.example.try2.payload.request.AnnouncementRequest;
import com.example.try2.payload.response.AnnouncementResponse;
import com.example.try2.payload.response.MessageResponse;
import com.example.try2.security.services.UserDetailsImpl;
import com.example.try2.service.AnnouncementService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnnouncementController {
    private static final Logger logger = LoggerFactory.getLogger(AnnouncementController.class);

    @Autowired
    private AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> getAllAnnouncements() {
        try {
            logger.info("Retrieving all announcements");
            List<AnnouncementResponse> announcements = announcementService.getAllAnnouncements();
            logger.info("Successfully retrieved {} announcements", announcements.size());
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            logger.error("Error retrieving announcements: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> getAnnouncementById(@PathVariable Long id) {
        try {
            logger.info("Retrieving announcement with ID: {}", id);
            AnnouncementResponse announcement = announcementService.getAnnouncementById(id);
            return ResponseEntity.ok(announcement);
        } catch (RuntimeException e) {
            logger.error("Error retrieving announcement: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Unexpected error retrieving announcement: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/roles/{role}")
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncementsByRole(@PathVariable String role) {
        try {
            logger.info("Retrieving announcements for role: {}", role);
            List<AnnouncementResponse> announcements = announcementService.getAnnouncementsByRole(role);
            logger.info("Successfully retrieved {} announcements for role {}", announcements.size(), role);
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            logger.error("Error retrieving announcements by role: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<AnnouncementResponse> createAnnouncement(@Valid @RequestBody AnnouncementRequest request) {
        try {
            logger.info("Creating new announcement: {}", request.getTitle());
            
            // Get the current user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long userId = userDetails.getId();
            
            AnnouncementResponse createdAnnouncement = announcementService.createAnnouncement(request, userId);
            logger.info("Successfully created announcement with ID: {}", createdAnnouncement.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAnnouncement);
        } catch (Exception e) {
            logger.error("Error creating announcement: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<AnnouncementResponse> updateAnnouncement(
            @PathVariable Long id,
            @Valid @RequestBody AnnouncementRequest request) {
        try {
            logger.info("Updating announcement with ID: {}", id);
            
            // Get the current user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long userId = userDetails.getId();
            
            // Check if the user is updating their own announcement or is an admin
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
                    
            AnnouncementResponse announcementToUpdate = announcementService.getAnnouncementById(id);
            if (!isAdmin && !announcementToUpdate.getCreatedById().equals(userId)) {
                logger.warn("User {} attempted to update announcement {} created by {}", 
                    userId, id, announcementToUpdate.getCreatedById());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            AnnouncementResponse updatedAnnouncement = announcementService.updateAnnouncement(id, request);
            logger.info("Successfully updated announcement with ID: {}", id);
            return ResponseEntity.ok(updatedAnnouncement);
        } catch (RuntimeException e) {
            logger.error("Error updating announcement: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Unexpected error updating announcement: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MessageResponse> deleteAnnouncement(@PathVariable Long id) {
        try {
            logger.info("Deleting announcement with ID: {}", id);
            
            // Get the current user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long userId = userDetails.getId();
            
            // Check if the user is deleting their own announcement or is an admin
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
                    
            AnnouncementResponse announcementToDelete = announcementService.getAnnouncementById(id);
            if (!isAdmin && !announcementToDelete.getCreatedById().equals(userId)) {
                logger.warn("User {} attempted to delete announcement {} created by {}", 
                    userId, id, announcementToDelete.getCreatedById());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            announcementService.deleteAnnouncement(id);
            logger.info("Successfully deleted announcement with ID: {}", id);
            return ResponseEntity.ok(new MessageResponse("Announcement deleted successfully"));
        } catch (RuntimeException e) {
            logger.error("Error deleting announcement: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Unexpected error deleting announcement: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 