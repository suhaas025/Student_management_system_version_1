package com.example.try2.controller;

import com.example.try2.entity.EnrollmentStatus;
import com.example.try2.payload.request.EnrollmentRequest;
import com.example.try2.payload.request.EnrollmentStatusUpdateRequest;
import com.example.try2.payload.response.EnrollmentResponse;
import com.example.try2.payload.response.MessageResponse;
import com.example.try2.security.services.UserDetailsImpl;
import com.example.try2.service.EnrollmentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EnrollmentController {
    private static final Logger logger = LoggerFactory.getLogger(EnrollmentController.class);

    @Autowired
    private EnrollmentService enrollmentService;

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('STUDENT')")
    public ResponseEntity<?> enrollInCourse(@Valid @RequestBody EnrollmentRequest request) {
        try {
            // Get current user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long studentId = userDetails.getId();
            
            logger.info("Student {} enrolling in course {}", studentId, request.getCourseId());
            EnrollmentResponse enrollment = enrollmentService.enrollInCourse(studentId, request);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(enrollment);
        } catch (Exception e) {
            logger.error("Error enrolling in course: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/student")
    @PreAuthorize("hasRole('USER') or hasRole('STUDENT')")
    public ResponseEntity<?> getMyEnrollments(
            @RequestParam(name = "status", required = false) EnrollmentStatus status) {
        try {
            // Get current user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long studentId = userDetails.getId();
            
            List<EnrollmentResponse> enrollments;
            if (status != null) {
                enrollments = enrollmentService.getStudentEnrollmentsByStatus(studentId, status);
            } else {
                enrollments = enrollmentService.getStudentEnrollments(studentId);
            }
            
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            logger.error("Error retrieving enrollments: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> getStudentEnrollments(
            @PathVariable Long studentId,
            @RequestParam(name = "status", required = false) EnrollmentStatus status) {
        try {
            List<EnrollmentResponse> enrollments;
            if (status != null) {
                enrollments = enrollmentService.getStudentEnrollmentsByStatus(studentId, status);
            } else {
                enrollments = enrollmentService.getStudentEnrollments(studentId);
            }
            
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            logger.error("Error retrieving enrollments for student {}: {}", studentId, e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> getCourseEnrollments(@PathVariable Long courseId) {
        try {
            List<EnrollmentResponse> enrollments = enrollmentService.getCourseEnrollments(courseId);
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            logger.error("Error retrieving enrollments for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('STUDENT') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> getEnrollment(@PathVariable Long id) {
        try {
            // Get current user's authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long currentUserId = userDetails.getId();
            
            // Get the enrollment
            EnrollmentResponse enrollment = enrollmentService.getEnrollment(id);
            
            // Check if user is authorized to view this enrollment
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            boolean isModerator = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_MODERATOR"));
            
            // Only the student who enrolled, admins, or moderators can view the enrollment
            if (!isAdmin && !isModerator && !enrollment.getStudentId().equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("You are not authorized to view this enrollment"));
            }
            
            return ResponseEntity.ok(enrollment);
        } catch (Exception e) {
            logger.error("Error retrieving enrollment {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> updateEnrollmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody EnrollmentStatusUpdateRequest request) {
        try {
            EnrollmentResponse enrollment = enrollmentService.updateEnrollmentStatus(id, request);
            return ResponseEntity.ok(enrollment);
        } catch (Exception e) {
            logger.error("Error updating enrollment status: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteEnrollment(@PathVariable Long id) {
        try {
            // Get current user's authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long currentUserId = userDetails.getId();
            
            // Get the enrollment
            EnrollmentResponse enrollment = enrollmentService.getEnrollment(id);
            
            // Check if user is authorized to delete this enrollment
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            
            // Only the student who enrolled or admins can delete the enrollment
            if (!isAdmin && !enrollment.getStudentId().equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("You are not authorized to delete this enrollment"));
            }
            
            enrollmentService.deleteEnrollment(id);
            return ResponseEntity.ok(new MessageResponse("Enrollment deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting enrollment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
} 