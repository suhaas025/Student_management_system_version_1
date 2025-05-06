package com.example.try2.payload.request;

import lombok.Data;

import java.util.Set;
 
@Data
public class UpdateUserRolesRequest {
    private Set<String> roles;
} 