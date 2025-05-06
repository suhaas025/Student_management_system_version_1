package com.example.try2.service;

import com.example.try2.entity.*;
import com.example.try2.payload.request.EnrollmentRequest;
import com.example.try2.payload.request.EnrollmentStatusUpdateRequest;
import com.example.try2.payload.response.EnrollmentResponse;
import com.example.try2.repository.CourseRepository;
import com.example.try2.repository.EnrollmentRepository;
import com.example.try2.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.example.try2.security.services.UserDetailsImpl;

@Service
public class EnrollmentService {
    private static final Logger logger = LoggerFactory.getLogger(EnrollmentService.class);

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Transactional
    public EnrollmentResponse enrollInCourse(Long studentId, EnrollmentRequest request) {
        logger.info("Enrolling student {} in course {}", studentId, request.getCourseId());
        
        // Verify student exists
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> {
                    logger.error("Student not found with ID: {}", studentId);
                    return new RuntimeException("Student not found with ID: " + studentId);
                });
        
        // Verify user is a student
        boolean isStudent = student.getRoles().stream()
                .anyMatch(role -> role.getName() == ERole.ROLE_USER || role.getName() == ERole.ROLE_STUDENT);
        
        if (!isStudent) {
            logger.error("User {} is not a student", studentId);
            throw new RuntimeException("User must be a student to enroll in courses");
        }
        
        // Verify course exists
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> {
                    logger.error("Course not found with ID: {}", request.getCourseId());
                    return new RuntimeException("Course not found with ID: " + request.getCourseId());
                });
        
        // Check if student is already enrolled in this course
        if (enrollmentRepository.existsByStudent_IdAndCourse_Id(studentId, request.getCourseId())) {
            logger.error("Student {} is already enrolled in course {}", studentId, request.getCourseId());
            throw new RuntimeException("Student is already enrolled in this course");
        }
        
        // If semester is not provided, use the course's semester
        String semester = request.getSemester() != null ? request.getSemester() : course.getSemester();
        
        // If academic year is not provided, use the course's academic year
        String academicYear = request.getAcademicYear() != null ? 
                request.getAcademicYear() : course.getAcademicYear();
        
        // Create enrollment
        Enrollment enrollment = new Enrollment(student, course, semester, academicYear);
        
        // Save enrollment
        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        logger.info("Successfully enrolled student {} in course {}", studentId, request.getCourseId());
        
        return convertToResponse(savedEnrollment);
    }
    
    @Transactional
    public EnrollmentResponse updateEnrollmentStatus(Long enrollmentId, EnrollmentStatusUpdateRequest request) {
        logger.info("Updating enrollment {} status to {}", enrollmentId, request.getStatus());
        
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> {
                    logger.error("Enrollment not found with ID: {}", enrollmentId);
                    return new RuntimeException("Enrollment not found with ID: " + enrollmentId);
                });
        
        try {
            EnrollmentStatus newStatus = request.getStatusEnum();
            enrollment.setStatus(newStatus);
            
            // Set notes if provided
            if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
                // If you want to store notes, add a notes field to the Enrollment entity
                // enrollment.setNotes(request.getNotes());
                logger.info("Notes provided for enrollment {}: {}", enrollmentId, request.getNotes());
            }
            
            Enrollment updatedEnrollment = enrollmentRepository.save(enrollment);
            
            logger.info("Successfully updated enrollment {} status to {}", enrollmentId, newStatus);
            return convertToResponse(updatedEnrollment);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid status update request for enrollment {}: {}", enrollmentId, e.getMessage());
            throw new RuntimeException("Invalid status value: " + request.getStatus());
        }
    }
    
    public List<EnrollmentResponse> getStudentEnrollments(Long studentId) {
        logger.info("Retrieving all enrollments for student {}", studentId);
        
        // Verify student exists
        if (!userRepository.existsById(studentId)) {
            logger.error("Student not found with ID: {}", studentId);
            throw new RuntimeException("Student not found with ID: " + studentId);
        }
        
        List<Enrollment> enrollments = enrollmentRepository.findByStudent_Id(studentId);
        logger.info("Found {} enrollments for student {}", enrollments.size(), studentId);
        
        return enrollments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public List<EnrollmentResponse> getStudentEnrollmentsByStatus(Long studentId, EnrollmentStatus status) {
        logger.info("Retrieving {} enrollments for student {}", status, studentId);
        
        // Verify student exists
        if (!userRepository.existsById(studentId)) {
            logger.error("Student not found with ID: {}", studentId);
            throw new RuntimeException("Student not found with ID: " + studentId);
        }
        
        List<Enrollment> enrollments = enrollmentRepository.findByStudent_IdAndStatus(studentId, status);
        logger.info("Found {} {} enrollments for student {}", enrollments.size(), status, studentId);
        
        return enrollments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public List<EnrollmentResponse> getCourseEnrollments(Long courseId) {
        logger.info("Retrieving all enrollments for course {}", courseId);
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            logger.error("Course not found with ID: {}", courseId);
            throw new RuntimeException("Course not found with ID: " + courseId);
        }
        
        List<Enrollment> enrollments = enrollmentRepository.findByCourse_Id(courseId);
        logger.info("Found {} enrollments for course {}", enrollments.size(), courseId);
        
        return enrollments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public EnrollmentResponse getEnrollment(Long enrollmentId) {
        logger.info("Retrieving enrollment with ID: {}", enrollmentId);
        
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> {
                    logger.error("Enrollment not found with ID: {}", enrollmentId);
                    return new RuntimeException("Enrollment not found with ID: " + enrollmentId);
                });
        
        return convertToResponse(enrollment);
    }
    
    @Transactional
    public void deleteEnrollment(Long enrollmentId) {
        logger.info("Deleting enrollment with ID: {}", enrollmentId);
        
        if (!enrollmentRepository.existsById(enrollmentId)) {
            logger.error("Enrollment not found with ID: {}", enrollmentId);
            throw new RuntimeException("Enrollment not found with ID: " + enrollmentId);
        }
        
        enrollmentRepository.deleteById(enrollmentId);
        logger.info("Successfully deleted enrollment with ID: {}", enrollmentId);
    }
    
    private EnrollmentResponse convertToResponse(Enrollment enrollment) {
        EnrollmentResponse response = new EnrollmentResponse();
        response.setId(enrollment.getId());
        response.setStudentId(enrollment.getStudent().getId());
        response.setStudentName(enrollment.getStudent().getUsername());
        response.setCourseId(enrollment.getCourse().getId());
        response.setCourseCode(enrollment.getCourse().getCourseCode());
        response.setCourseName(enrollment.getCourse().getCourseName());
        response.setStatus(enrollment.getStatus());
        response.setSemester(enrollment.getSemester());
        response.setAcademicYear(enrollment.getAcademicYear());
        response.setCreatedAt(enrollment.getEnrolledAt());
        response.setUpdatedAt(enrollment.getUpdatedAt());
        if (enrollment.getCreatedBy() != null) {
            response.setCreatedById(enrollment.getCreatedBy().getId());
            response.setCreatedByUsername(enrollment.getCreatedBy().getUsername());
        }
        if (enrollment.getUpdatedBy() != null) {
            response.setUpdatedById(enrollment.getUpdatedBy().getId());
            response.setUpdatedByUsername(enrollment.getUpdatedBy().getUsername());
        }
        return response;
    }

    private User getCurrentUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Enrollment saveEnrollment(Enrollment enrollment) {
        User currentUser = getCurrentUser();
        enrollment.setCreatedBy(currentUser);
        enrollment.setUpdatedBy(currentUser);
        return enrollmentRepository.save(enrollment);
    }

    public Enrollment updateEnrollment(Long id, Enrollment enrollmentDetails) {
        Enrollment enrollment = enrollmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Enrollment not found"));
        // ... update fields ...
        enrollment.setUpdatedBy(getCurrentUser());
        return enrollmentRepository.save(enrollment);
    }

    /**
     * One-time migration: Set createdBy and updatedBy to a default admin user for all enrollments where these fields are null.
     * Call this method manually to fix existing data.
     */
    @Transactional
    public void setCreatedByAndUpdatedByForAllEnrollments(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found with ID: " + adminUserId));
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        int updated = 0;
        for (Enrollment enrollment : enrollments) {
            boolean changed = false;
            if (enrollment.getCreatedBy() == null) {
                enrollment.setCreatedBy(admin);
                changed = true;
            }
            if (enrollment.getUpdatedBy() == null) {
                enrollment.setUpdatedBy(admin);
                changed = true;
            }
            if (changed) {
                enrollmentRepository.save(enrollment);
                updated++;
            }
        }
        logger.info("Enrollment migration complete. Records updated: {}", updated);
    }
} 