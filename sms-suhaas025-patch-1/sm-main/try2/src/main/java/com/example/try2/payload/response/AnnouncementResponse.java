package com.example.try2.payload.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnouncementResponse {
    private Long id;
    private String title;
    private String message;
    private String targetRole;
    private boolean isUrgent;
    private boolean isActive;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdById;
    private String createdByUsername;
} 