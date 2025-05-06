package com.example.try2.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MfaSetupResponse {
    private String secretKey;
    private String qrCodeUrl;
    private Set<String> backupCodes;
} 