package com.example.try2.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MfaCheckResponse {
    private boolean mfaRequired;
    private String temporaryToken;
} 