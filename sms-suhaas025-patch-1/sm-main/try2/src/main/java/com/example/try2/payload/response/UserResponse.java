package com.example.try2.payload.response;

import com.example.try2.entity.ERole;
import com.example.try2.entity.EModeratorType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.Set;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String avatar;
    private Set<RoleResponse> roles;
    
    // Student-specific fields
    private String degree;
    private String departmentName;
    private Integer yearOfStudy;
    
    // Moderator-specific fields
    private EModeratorType moderatorType;
    private String specialization;
    private String hostelName;
    private String librarySection;
    private String labName;
    private String sportsCategory;
    private String culturalCategory;
    private String academicProgram;

    private boolean mfaEnabled;
    
    // Account status fields
    private String accountStatus;
    private String lastLoginDate;
    private String expirationDate;
    private Boolean accountBlocked;
    private Long daysUntilExpiration;

    public void setStudentFields(String degree, String department, Integer yearOfStudy) {
        this.degree = degree;
        if (department != null) {
            this.departmentName = department;
        }
        this.yearOfStudy = yearOfStudy;
        // Set moderator fields to null
        this.moderatorType = null;
        this.specialization = null;
        this.hostelName = null;
        this.librarySection = null;
        this.labName = null;
        this.sportsCategory = null;
        this.culturalCategory = null;
        this.academicProgram = null;
    }

    public void setModeratorFields(EModeratorType moderatorType, String specialization, String hostelName,
                                 String librarySection, String labName, String sportsCategory,
                                 String culturalCategory, String academicProgram) {
        this.moderatorType = moderatorType;
        this.specialization = specialization;
        this.hostelName = hostelName;
        this.librarySection = librarySection;
        this.labName = labName;
        this.sportsCategory = sportsCategory;
        this.culturalCategory = culturalCategory;
        this.academicProgram = academicProgram;
        
        // Set student-specific fields to null but PRESERVE department
        // as department is used by both students and moderators
        this.degree = null;
        // Intentionally NOT setting department to null
        this.yearOfStudy = null;
    }
} 