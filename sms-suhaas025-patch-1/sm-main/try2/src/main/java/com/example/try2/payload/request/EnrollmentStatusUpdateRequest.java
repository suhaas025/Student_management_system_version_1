package com.example.try2.payload.request;

import com.example.try2.entity.EnrollmentStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EnrollmentStatusUpdateRequest {
    
    @NotBlank
    private String status;
    
    private String notes;
    
    public EnrollmentStatus getStatusEnum() {
        try {
            return EnrollmentStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status value: " + status);
        }
    }
} 