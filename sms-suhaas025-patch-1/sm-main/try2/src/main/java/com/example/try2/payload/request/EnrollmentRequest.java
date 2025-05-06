package com.example.try2.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EnrollmentRequest {
    
    @NotNull
    private Long courseId;
    
    private String semester;
    
    private String academicYear;
} 