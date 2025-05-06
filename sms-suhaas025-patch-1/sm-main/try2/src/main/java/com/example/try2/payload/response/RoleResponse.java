package com.example.try2.payload.response;

import com.example.try2.entity.ERole;
import lombok.Data;

@Data
public class RoleResponse {
    private Long id;
    private ERole name;
} 