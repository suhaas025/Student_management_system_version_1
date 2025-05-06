package com.example.try2.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MfaLoginRequest {
    @NotBlank
    private String username;
    
    @NotBlank
    @Size(min = 6, max = 8)
    private String code;
    
    private boolean isBackupCode;
} 