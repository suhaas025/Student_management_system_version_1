package com.example.try2.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnouncementRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Message is required")
    private String message;
    
    private String targetRole;
    
    private Boolean isUrgent;
    
    private Boolean isActive = true;
    
    private LocalDateTime startDate;
    
    private LocalDateTime endDate;
} 