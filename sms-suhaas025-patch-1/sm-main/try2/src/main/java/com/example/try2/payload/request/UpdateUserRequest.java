package com.example.try2.payload.request;

import com.example.try2.entity.EModeratorType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
public class UpdateUserRequest {
    private String username;
    private String email;
    private String password;
    private Set<String> role;
    private String singleRole;
    private EModeratorType moderatorType;
    private String degree;
    private Long departmentId;
    private Integer yearOfStudy;
    private String specialization;
    private String hostelName;
    private String librarySection;
    private String labName;
    private String sportsCategory;
    private String culturalCategory;
    private String academicProgram;
    private String avatar;
    
    public Set<String> getRole() {
        Set<String> combinedRoles = new HashSet<>();
        
        if (this.role != null) {
            combinedRoles.addAll(this.role);
        }
        
        if (this.singleRole != null && !this.singleRole.isEmpty()) {
            combinedRoles.add(this.singleRole);
        }
        
        return combinedRoles;
    }
} 