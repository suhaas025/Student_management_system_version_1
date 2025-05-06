package com.example.try2.controller;

import com.example.try2.entity.Grade;
import com.example.try2.payload.request.CreateGradeRequest;
import com.example.try2.payload.response.GradeResponse;
import com.example.try2.payload.response.MessageResponse;
import com.example.try2.security.services.UserDetailsImpl;
import com.example.try2.service.GradeService;
import com.example.try2.service.CourseService;
import com.example.try2.service.UserService;
import com.example.try2.entity.Course;
import com.example.try2.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import jakarta.persistence.OptimisticLockException;
import org.springframework.web.multipart.MultipartFile;
import com.example.try2.exception.AppException;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

@RestController
@RequestMapping("/api/grades")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GradeController {
    private static final Logger logger = LoggerFactory.getLogger(GradeController.class);

    @Autowired
    private GradeService gradeService;
    
    @Autowired
    private CourseService courseService;
    
    @Autowired
    private UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<GradeResponse> createGrade(@RequestBody CreateGradeRequest request) {
        logger.info("Received request to create grade: {}", request);

        // Input validation for required fields
        if (request.getStudentId() == null || request.getCourseId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(null); // You can also return a custom error response if desired
        }
        
        // If moderator, verify they can manage this course
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MODERATOR"))) {
            String username = authentication.getName();
            Optional<User> moderator = userService.findByUsername(username);
            
            if (moderator.isPresent()) {
                Course course = courseService.getCourseEntityById(request.getCourseId());
                if (course == null || course.getTeacher() == null || 
                        !course.getTeacher().getId().equals(moderator.get().getId())) {
                    throw new AccessDeniedException("You can only assign grades to your own courses");
                }
            }
        }
        
        GradeResponse grade = gradeService.saveGrade(request);
        return ResponseEntity.ok(grade);
    }

    @PostMapping("/batch")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> createGradesBatch(@RequestBody List<CreateGradeRequest> requests) {
        List<GradeResponse> responses = new java.util.ArrayList<>();
        for (CreateGradeRequest req : requests) {
            try {
                responses.add(gradeService.saveGrade(req));
            } catch (Exception e) {
                // Optionally collect errors per student, or skip
            }
        }
        return ResponseEntity.ok(responses);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> getAllGrades() {
        try {
            logger.info("Retrieving all grades");
            List<GradeResponse> grades = gradeService.getAllGrades();
            logger.info("Successfully retrieved {} grades", grades.size());
            return ResponseEntity.ok(grades);
        } catch (Exception e) {
            logger.error("Error retrieving all grades: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving grades: " + e.getMessage()));
        }
    }
    
    @GetMapping("/moderator")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<?> getModeratorGrades() {
        try {
            // Get the current moderator
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            logger.info("Retrieving grades for moderator: {}", username);
            
            Optional<User> moderator = userService.findByUsername(username);
            if (!moderator.isPresent()) {
                logger.error("Moderator not found: {}", username);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new MessageResponse("Moderator not found"));
            }
            
            // Get all courses assigned to this moderator
            List<Long> moderatorCourseIds = courseService.getCoursesByTeacherId(moderator.get().getId())
                    .stream()
                    .map(course -> course.getId())
                    .collect(Collectors.toList());
            
            if (moderatorCourseIds.isEmpty()) {
                logger.info("No courses found for moderator: {}", username);
                return ResponseEntity.ok(List.of());
            }
            
            // Get grades for all these courses
            List<GradeResponse> grades = gradeService.getGradesByMultipleCourseIds(moderatorCourseIds);
            logger.info("Retrieved {} grades for moderator {}", grades.size(), username);
            
            return ResponseEntity.ok(grades);
        } catch (Exception e) {
            logger.error("Error retrieving moderator grades: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving grades: " + e.getMessage()));
        }
    }
    
    @GetMapping("/moderator/course/{courseId}")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<?> getModeratorCourseGrades(@PathVariable Long courseId) {
        try {
            // Get the current moderator
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            logger.info("Retrieving grades for course {} by moderator: {}", courseId, username);
            
            Optional<User> moderator = userService.findByUsername(username);
            if (!moderator.isPresent()) {
                logger.error("Moderator not found: {}", username);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new MessageResponse("Moderator not found"));
            }
            
            // Verify that the course belongs to this moderator
            Course course = courseService.getCourseEntityById(courseId);
            if (course == null) {
                logger.error("Course not found: {}", courseId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new MessageResponse("Course not found"));
            }
            
            if (course.getTeacher() == null || !course.getTeacher().getId().equals(moderator.get().getId())) {
                logger.error("Moderator {} attempted to access grades for course {} which they don't teach", 
                        username, courseId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("You can only view grades for courses you teach"));
            }
            
            // Get grades for this course
            List<GradeResponse> grades = gradeService.getGradesByCourseId(courseId);
            logger.info("Retrieved {} grades for course {}", grades.size(), courseId);
            
            return ResponseEntity.ok(grades);
        } catch (Exception e) {
            logger.error("Error retrieving course grades: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving grades: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> getGradeById(@PathVariable Long id) {
        // If moderator, verify they can access this grade
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MODERATOR"))) {
            String username = authentication.getName();
            Optional<User> moderator = userService.findByUsername(username);
            if (moderator.isPresent()) {
                GradeResponse gradeResponse = gradeService.getGradeById(id);
                Course course = courseService.getCourseEntityById(gradeResponse.getCourseId());
                if (course == null || course.getTeacher() == null || 
                        !course.getTeacher().getId().equals(moderator.get().getId())) {
                    logger.error("Moderator {} attempted to access grade {} for a course they don't teach", 
                            username, id);
                    throw new AppException("You can only access grades for courses you teach", 
                                          HttpStatus.FORBIDDEN, "UNAUTHORIZED_ACCESS");
                }
                return ResponseEntity.ok(gradeResponse);
            }
        }
        
        GradeResponse grade = gradeService.getGradeById(id);
        logger.info("Successfully retrieved grade with ID: {}", id);
        return ResponseEntity.ok(grade);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('STUDENT') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> getGradesByUserId(@PathVariable Long userId) {
        // Get current user's authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        
        // Check if user is trying to access their own grades or has admin/moderator role
        if (!authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || 
                         a.getAuthority().equals("ROLE_MODERATOR"))) {
            // For students, verify they're accessing their own grades
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (!userDetails.getId().equals(userId)) {
                logger.error("User {} attempted to access grades for user {}", currentUsername, userId);
                throw new AppException("You can only view your own grades", 
                                      HttpStatus.FORBIDDEN, "UNAUTHORIZED_ACCESS");
            }
        }

        logger.info("Retrieving grades for user ID: {}", userId);
        List<GradeResponse> grades = gradeService.getGradesByStudentId(userId);
        logger.info("Successfully retrieved {} grades for user {}", grades.size(), userId);
        return ResponseEntity.ok(grades);
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<List<GradeResponse>> getGradesByCourseId(@PathVariable Long courseId) {
        // If moderator, verify they can access this course
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MODERATOR"))) {
            String username = authentication.getName();
            Optional<User> moderator = userService.findByUsername(username);
            
            if (moderator.isPresent()) {
                Course course = courseService.getCourseEntityById(courseId);
                if (course == null || course.getTeacher() == null || 
                        !course.getTeacher().getId().equals(moderator.get().getId())) {
                    throw new AccessDeniedException("You can only access grades for courses you teach");
                }
            }
        }
        
        List<GradeResponse> grades = gradeService.getGradesByCourseId(courseId);
        return ResponseEntity.ok(grades);
    }

    @GetMapping("/student/{studentId}/course/{courseId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<List<GradeResponse>> getGradesByStudentAndCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        // If moderator, verify they can access this course
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MODERATOR"))) {
            String username = authentication.getName();
            Optional<User> moderator = userService.findByUsername(username);
            
            if (moderator.isPresent()) {
                Course course = courseService.getCourseEntityById(courseId);
                if (course == null || course.getTeacher() == null || 
                        !course.getTeacher().getId().equals(moderator.get().getId())) {
                    throw new AccessDeniedException("You can only access grades for courses you teach");
                }
            }
        }
        
        List<GradeResponse> grades = gradeService.getGradesByStudentAndCourse(studentId, courseId);
        return ResponseEntity.ok(grades);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> updateGrade(@PathVariable Long id, @RequestBody Grade gradeDetails) {
        // If moderator, verify they can access this grade
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MODERATOR"))) {
            String username = authentication.getName();
            Optional<User> moderator = userService.findByUsername(username);
            if (moderator.isPresent()) {
                GradeResponse gradeResponse = gradeService.getGradeById(id);
                Course course = courseService.getCourseEntityById(gradeResponse.getCourseId());
                if (course == null || course.getTeacher() == null || 
                        !course.getTeacher().getId().equals(moderator.get().getId())) {
                    throw new AccessDeniedException("You can only update grades for courses you teach");
                }
            }
        }
        try {
            GradeResponse grade = gradeService.updateGrade(id, gradeDetails);
            return ResponseEntity.ok(grade);
        } catch (RuntimeException e) {
            if (e.getCause() instanceof OptimisticLockException || e.getMessage().contains("modified by someone else")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("This grade was modified by someone else. Please refresh and try again."));
            }
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Void> deleteGrade(@PathVariable Long id) {
        // If moderator, verify they can access this grade
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MODERATOR"))) {
            String username = authentication.getName();
            Optional<User> moderator = userService.findByUsername(username);
            
            if (moderator.isPresent()) {
                GradeResponse gradeResponse = gradeService.getGradeById(id);
                Course course = courseService.getCourseEntityById(gradeResponse.getCourseId());
                if (course == null || course.getTeacher() == null || 
                        !course.getTeacher().getId().equals(moderator.get().getId())) {
                    throw new AccessDeniedException("You can only delete grades for courses you teach");
                }
            }
        }
        
        gradeService.deleteGrade(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/approve-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveAllGrades() {
        try {
            logger.info("Admin request to approve all grades");
            gradeService.approveAllGrades();
            return ResponseEntity.ok(new MessageResponse("All grades have been approved"));
        } catch (Exception e) {
            logger.error("Error approving all grades: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error approving all grades: " + e.getMessage()));
        }
    }

    @PostMapping("/import-csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> importGradesFromCsv(
            @RequestParam("file") MultipartFile file) {
        try {
            logger.info("Received CSV import request");
            
            // Validate file
            if (file.isEmpty()) {
                logger.error("Empty file received");
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Please select a file to upload"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.equals("text/csv")) {
                logger.error("Invalid file type: {}", contentType);
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Please upload a CSV file"));
            }

            // Process the file
            List<GradeResponse> importedGrades = gradeService.importGradesFromCsv(file);
            logger.info("Successfully imported {} grades", importedGrades.size());
            
            return ResponseEntity.ok()
                    .body(new MessageResponse("Successfully imported " + importedGrades.size() + " grades"));
        } catch (Exception e) {
            logger.error("Error importing grades from CSV: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error importing grades: " + e.getMessage()));
        }
    }

    @GetMapping("/import-template")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<org.springframework.core.io.Resource> downloadGradeImportTemplate() {
        return gradeService.getGradeImportTemplate();
    }
} 