package com.example.try2.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.Convert;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username"),
                @UniqueConstraint(columnNames = "email")
        })
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 20)
    private String username;

    @NotBlank
    @Size(max = 255)
    @Email
    @Convert(converter = com.example.try2.security.AttributeEncryptor.class)
    @Column(name = "email", columnDefinition = "TEXT", unique = true)
    private String email;

    @NotBlank
    @Size(max = 120)
    @JsonIgnore
    private String password;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    // Student-specific fields
    @Column(name = "degree")
    private String degree;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "year_of_study")
    private Integer yearOfStudy;

    // Moderator-specific fields
    @Enumerated(EnumType.STRING)
    @Column(name = "moderator_type")
    private EModeratorType moderatorType;

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "hostel_name")
    private String hostelName;

    @Column(name = "library_section")
    private String librarySection;

    @Column(name = "lab_name")
    private String labName;

    @Column(name = "sports_category")
    private String sportsCategory;

    @Column(name = "cultural_category")
    private String culturalCategory;

    @Column(name = "academic_program")
    private String academicProgram;

    @Column(name = "avatar", columnDefinition = "TEXT")
    private String avatar;

    // MFA fields
    @Column(name = "mfa_enabled", columnDefinition = "boolean default false")
    private boolean mfaEnabled = false;
    
    @Column(name = "mfa_secret", columnDefinition = "TEXT")
    @JsonIgnore
    private String mfaSecret;
    
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_backup_codes", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "backup_code")
    @JsonIgnore
    private Set<String> backupCodes = new HashSet<>();

    // --- Account lockout fields ---
    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "account_locked_until")
    private Long accountLockedUntil; // epoch millis, nullable

    // Account expiration fields
    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

    @Column(name = "account_expiration_date")
    private LocalDateTime accountExpirationDate;

    @Column(name = "account_blocked")
    private Boolean accountBlocked = false;

    @Column(name = "account_status")
    @Enumerated(EnumType.STRING)
    private EAccountStatus accountStatus = EAccountStatus.ACTIVE;

    @Column(name = "current_jwt", columnDefinition = "TEXT")
    @JsonIgnore
    private String currentJwt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }

    public Integer getFailedLoginAttempts() {
        return failedLoginAttempts != null ? failedLoginAttempts : 0;
    }
} 