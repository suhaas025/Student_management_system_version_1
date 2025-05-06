package com.example.try2.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordMfaVerifyRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String code;
} 