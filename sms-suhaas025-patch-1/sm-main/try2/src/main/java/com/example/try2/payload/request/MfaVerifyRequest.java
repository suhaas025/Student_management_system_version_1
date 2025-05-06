package com.example.try2.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MfaVerifyRequest {
    @NotBlank
    @Size(min = 6, max = 6)
    private String code;
} 