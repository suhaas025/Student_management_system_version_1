package com.example.try2.payload.request;

import com.example.try2.entity.EModeratorType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class CreateModeratorRequest {
    @NotBlank
    @Size(min = 3, max = 20)
    private String username;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 40)
    private String password;

    @NotNull
    private EModeratorType moderatorType;
    
    // Field to support multiple roles
    private Set<String> additionalRoles;

    // Additional fields for specific moderator types
    private Long departmentId;  // For teachers
    private String specialization;  // For teachers
    private String hostelName;  // For hostel wardens
    private String librarySection;  // For librarians
    private String labName;  // For lab incharges
    private String sportsCategory;  // For sports coordinators
    private String culturalCategory;  // For cultural coordinators
    private String academicProgram;  // For academic coordinators
} 