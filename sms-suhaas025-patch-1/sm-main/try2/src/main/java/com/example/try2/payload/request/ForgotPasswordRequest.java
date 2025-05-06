package com.example.try2.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
 
@Data
public class ForgotPasswordRequest {
    @NotBlank
    private String username;
} 