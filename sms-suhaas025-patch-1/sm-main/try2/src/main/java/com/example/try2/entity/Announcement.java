package com.example.try2.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "target_role")
    private String targetRole;

    @Column(name = "is_urgent")
    private boolean isUrgent = false;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    // Constructor for creating a new announcement
    public Announcement(String title, String message, String targetRole, 
                      boolean isUrgent, boolean isActive,
                      LocalDateTime startDate, LocalDateTime endDate, 
                      User createdBy) {
        this.title = title;
        this.message = message;
        this.targetRole = targetRole;
        this.isUrgent = isUrgent;
        this.isActive = isActive;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdBy = createdBy;
    }
} 